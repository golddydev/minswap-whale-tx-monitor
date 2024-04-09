const { app: appConfig, db: dbConfig } = require('../config');

const { BigInteger } = require('jsbn');

const {
  BlockfrostAdapter,
  NetworkId,
  POOL_ADDRESS_LIST,
} = require('@minswap/blockfrost-adapter');

const adapter = new BlockfrostAdapter({
  projectId: appConfig.blockfrostApiKey,
  networkId: NetworkId.MAINNET,
});

const Blockfrost = require('@blockfrost/blockfrost-js');
const API = new Blockfrost.BlockFrostAPI({
  projectId: appConfig.blockfrostApiKey, // see: https://blockfrost.io
});

const orderAddresses = [
  'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70',
  'addr1wxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uwc0h43gt',
];

const poolAddresses = [
  'addr1z8snz7c4974vzdpxu65ruphl3zjdvtxw8strf2c2tmqnxz2j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq0xmsha',
  'addr1qyht4ja0zcn45qvyx477qlyp6j5ftu5ng0prt9608dxp6l2j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq4jxtdy',
];

const { minswap: minswapConstant, minswap } = require('../constants');

const hookData = require('./data.json');

(async () => {
  const promises = hookData.payload.map((txData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let assetA, assetB;
        const txHash = txData.tx.hash;
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
            unit: foundInput?.unit,
            quantity: new BigInteger(foundInput?.quantity || '1').toString(),
          };
        }
        const datumHash = orderInput.data_hash;
        const datumScript = await API.scriptsDatum(datumHash);
        const datumFields = datumScript?.json_value?.fields || [];
        if (datumFields?.length > 2) {
          const outputDatum = datumFields[datumFields.length - 3].fields;
          const outputUnit = outputDatum[0]?.fields[0]?.bytes || '';
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

  await Promise.all(promises).then((swappingDatas) => {
    swappingDatas.forEach((data) => {
      if (!data) {
        return;
      }
      if (
        !(data?.assetA?.unit == 'lovelace' || data?.assetB?.unit == 'lovelace')
      ) {
        return;
      }
      let adaValue;
      if (data?.assetA.unit == 'lovelace') {
        adaValue = new BigInteger(data?.assetA?.quantity || '1');
      } else {
        adaValue = new BigInteger(data?.assetB?.quantity || '1');
      }
      if (adaValue.compareTo(minswapConstant.adaThreshold) < 0) {
        return;
      }
      console.log('-'.repeat(20) + 'Start Swap' + '-'.repeat(20));
      console.log('Tx Hash: ', data.txHash);
      console.log('Who: ', data.who);
      console.log('Asset A: ', data.assetA);
      console.log('Asset B: ', data.assetB);
      console.log(data.time.toLocaleString());
      console.log('-'.repeat(20) + 'End Swap' + '-'.repeat(20));
      console.log('\n');
    });
  });
})();

// ADA - Other
// 0f81ec918cdebdac3c90dcfea82a2d1f0b588cd5fad93c64ef6b5502c767d72e

// Other - ADA
// 2f4572d7f7f644b5e8cd1b9e0bceaaee3cc74da7aebd3eeec2532b9101f1a665
