// import discord bot
const bot = require('../bot');

// import utils
const httpStatus = require('http-status');

const { minswap: minswapUtil } = require('../utils');
const { BigInteger } = require('jsbn');

// import config
const { discord: discordConfig } = require('../config')

// import constants
const { minswap: minswapConstant } = require('../constants');

const minswapHappen = async (req, res) => {
  const { payload } = req.body;
  const analyzedDatas = await minswapUtil.analyzeMinswapTransaction(payload);
  const promises = [];
  analyzedDatas.forEach((data) => {
    // if data is empty, ignore
    if (!data) {
      return;
    }
    // if ADA is not involved with this swap, ignore
    if (
      !(data?.assetA?.unit == 'lovelace' || data?.assetB?.unit == 'lovelace')
    ) {
      return;
    }
    // calculate ADA value
    let adaValue;
    if (data?.assetA.unit == 'lovelace') {
      adaValue = new BigInteger(data?.assetA?.quantity || '1');
    } else {
      adaValue = new BigInteger(data?.assetB?.quantity || '1');
    }
    // if adaValue if less than 10K, ignore
    if (adaValue.compareTo(minswapConstant.adaThreshold) < 0) {
      return;
    }
    // If this swap transaction meets all the conditions
    // Handle this swap data
    // send data to discord server.
    console.log('-'.repeat(20) + 'Start Swap' + '-'.repeat(20));
    console.log('Tx Hash: ', data.txHash);
    console.log('Who: ', data.who);
    console.log('Asset A: ', data.assetA);
    console.log('Asset B: ', data.assetB);
    console.log(data.time.toLocaleString());
    console.log('-'.repeat(20) + 'End Swap' + '-'.repeat(20));
    console.log('\n');
    promises.push(minswapUtil.buildMessage(data));
  });
  const channel = await bot.channels.fetch(discordConfig.channelId);
  if (bot.isReady && channel) {
    const messages = await Promise.all(promises);
    messages.forEach(message => {
      if (!message) {
        return;
      }
      channel.send(message);
      // bot.users.send('933743685689036840', message);
    });
  }
  return res.status(httpStatus.OK).send('Success');
};

module.exports = {
  minswapHappen,
};
