// import config
const { app: appConfig } = require('../config');

// import utils
const Blockfrost = require('@blockfrost/blockfrost-js');
const { BigInteger } = require('jsbn');
const { Decimal } = require('decimal.js');
const validator = require('validator').default;
const { convertHexCodeToString } = require('./common.util');

// set up blockfrost
const API = new Blockfrost.BlockFrostAPI({
  projectId: appConfig.blockfrostApiKey, // see: https://blockfrost.io
});

// set up adapter
const {
  BlockfrostAdapter,
  NetworkId,
} = require('@minswap/blockfrost-adapter');

const adapter = new BlockfrostAdapter({
  projectId: appConfig.blockfrostApiKey,
  networkId: NetworkId.MAINNET,
});

// import constants
const { minswap: minswapConstant } = require('../constants');
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { orderAddresses, poolAddresses } = minswapConstant;

const analyzeMinswapTransaction = (txsData = []) => {
  const promises = txsData.map((txData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let assetA, assetB;
        const txHash = txData.tx.hash;
        const poolState = await adapter.getPoolInTx({
          txHash,
        });
        if (!poolState || (poolState.assetA != 'lovelace' && poolState.assetB != 'lovelace')) {
          return;
        }

        let orderInput;
        for (let i = 0; i < orderAddresses.length; i++) {
          orderInput = txData.inputs.find(
            (e) => e.address == orderAddresses[i] && e.data_hash
          );
          if (orderInput) {
            break;
          }
        }
        if (!orderInput) {
          resolve(null);
        }
        if (
          orderInput.amount.length == 1 &&
          orderInput.amount[0].unit == 'lovelace'
        ) {
          let inputAmount = new BigInteger(orderInput.amount[0].quantity);
          assetA = {
            unit: 'lovelace',
            quantity: (inputAmount - 4000000).toString(),
          };
        } else {
          const foundInput = orderInput.amount.find(
            (e) => e.unit != 'lovelace'
          );
          assetA = {
            // unit: foundInput?.unit,
            unit: poolState.assetA == 'lovelace' ? poolState.assetB : poolState.assetA,
            quantity: new BigInteger(foundInput?.quantity || '1').toString(),
          };
        }
        const datumHash = orderInput.data_hash;
        const datumScript = await API.scriptsDatum(datumHash);
        const datumFields = datumScript?.json_value?.fields || [];
        if (datumFields?.length > 2) {
          const outputDatum = datumFields[datumFields.length - 3].fields;
          const outputUnit = (outputDatum[0]?.fields[0]?.bytes || '') + (outputDatum[0]?.fields[1]?.bytes || '');
          assetB = {
            quantity: (outputDatum[1]?.int || 0)?.toString() || '0',
            unit: outputUnit || 'lovelace',
          };
        }
        const otherAddresses =
          txData.outputs.filter(
            (e) => poolAddresses.findIndex((pA) => pA == e.address) < 0
          ) || [];
        resolve({
          time: new Date(txData.tx.block_time * 1000),
          who:
            otherAddresses.length > 0 ? otherAddresses[0]?.address || '' : '',
          txHash,
          assetA,
          assetB,
        });
      } catch (err) {
        resolve(null);
        // reject(err);
      }
    });
  });

  return Promise.all(promises);
};

const buildMessage = async (data) => {
  try {
    const { assetA, assetB, who, txHash, time } = data;
    const timeString = time.toLocaleString();
    const txHashUrl = `https://cardanoscan.io/transaction/${txHash}`;

    let assetAMetadata = {}, assetBMetadata = {};
    if (assetA.unit == 'lovelace') {
      assetAMetadata.name = 'ADA';
      assetAMetadata.value = (new Decimal(assetA.quantity)).dividedBy(new Decimal('10').pow(6));
      const bMetadata = await API.assetsById(assetB.unit);
      assetBMetadata.name = convertHexCodeToString(bMetadata.asset_name);
      assetBMetadata.value = (new Decimal(assetB.quantity)).dividedBy(new Decimal('10').pow(parseInt(bMetadata.metadata.decimals) || 0)).toString();
      assetAMetadata.nameMarkdown = `**ADA**`;
      // assetBMetadata.nameMarkdown = `**${assetBMetadata.name}${validator.isURL(bMetadata.metadata.url || "") ? ` (${bMetadata.metadata.url})` : ""}**`;
      assetBMetadata.nameMarkdown = `**${assetBMetadata.name}**`;
    } else {
      assetBMetadata.name = 'ADA';
      assetBMetadata.value = (new Decimal(assetB.quantity)).dividedBy(new Decimal('10').pow(6));
      const aMetadata = await API.assetsById(assetA.unit);
      assetAMetadata.name = convertHexCodeToString(aMetadata.asset_name);
      assetAMetadata.value = (new Decimal(assetA.quantity)).dividedBy(new Decimal('10').pow(parseInt(aMetadata.metadata.decimals) || 0)).toString();
      assetBMetadata.nameMarkdown = `**ADA**`;
      // assetAMetadata.nameMarkdown = `**${assetAMetadata.name}${validator.isURL(aMetadata.metadata.url || "") ? ` (${aMetadata.metadata.url})` : ""}**`;
      assetAMetadata.nameMarkdown = `**${assetAMetadata.name}**`;
    }
    const simpledTxHash = txHash.slice(0, 4) + "..." + txHash.slice(-5);
    const simpledWho = who.slice(0, 7) + "..." + who.slice(-5);
    const poolPMUrl = `https://pool.pm/${who}`;

    // building message
    const txButton = new ButtonBuilder()
      .setLabel('Tx (cardanoscan.io)')
      .setStyle(ButtonStyle.Link)
      .setURL(txHashUrl);

    const poolPMButton = new ButtonBuilder()
      .setLabel('Addr (pool.pm)')
      .setStyle(ButtonStyle.Link)
      .setURL(poolPMUrl);

    const row = new ActionRowBuilder().addComponents(txButton, poolPMButton);

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`_${assetAMetadata.value}_ ${assetAMetadata.name} → _${assetBMetadata.value}_ ${assetBMetadata.name}`)
      .setURL(txHashUrl)
      .setAuthor({ name: 'Whale Tracker', iconURL: 'https://cdn.discordapp.com/avatars/909247186305445898/2736b83c60b4172aae5278a6b85d50a4.webp?size=80' })
      .setThumbnail('https://minswap.org/storage/2022/05/logo-1.png')
      .addFields(
        { name: 'Tx Hash', value: `\_${txHash}\_` },
        { name: 'Who', value: `\_${who}\_` },
        {
          name: 'From', value: `\`\`\`${assetAMetadata.value} ${assetAMetadata.name}\`\`\``,
        },
        { name: 'To', value: `\`\`\`${assetBMetadata.value} ${assetBMetadata.name}\`\`\``, },
      )
      .setFooter({ text: timeString, iconURL: 'https://cdn.discordapp.com/avatars/909247186305445898/2736b83c60b4172aae5278a6b85d50a4.webp?size=80' });

    return {
      components: [row],
      embeds: [embed],
    };
  } catch (err) {
    console.log(err)
    return undefined;
  }
}

module.exports = {
  analyzeMinswapTransaction,
  buildMessage,
};
