const { app: appConfig, db: dbConfig } = require('../config');

const cbor = require('cbor');

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
const { convertHexCodeToString } = require('../utils/common.util');
const API = new Blockfrost.BlockFrostAPI({
  projectId: appConfig.blockfrostApiKey, // see: https://blockfrost.io
});


/*

8daefa391220bd0d8d007f3748d870f7f3c106040314c8515ccc35a5464c4143
2b28c81dbba6d67e4b5a997c6be1212cba9d60d33f82444ab8b1f21842414e4b

bf9354cba4ee83c5de05c72830c6430967a26a1656b06293541d23e154414e47
bf9354cba4ee83c5de05c72830c6430967a26a1656b06293541d23e1

279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b

29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6

5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147
5ad8deb64bfec21ad2d96e1270b5873d0c4d0f231b928b4c39eb243561646f736961
5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114
5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147

*/

(async () => {
  try {
    const data = await adapter.getPoolInTx({
      txHash: '20e01a7b358d2390c485e355874449fadbf34e7891d79f0d7548c2754d3f33e1'
    });
    console.log(data)
    // console.log(data.assetA, data.assetB)
    // if (data.assetA == 'lovelace') {
    //   const t = await API.assetsById(data.assetB);
    //   console.log(t);
    // } else {
    //   const t = await API.assetsById(data.assetA);
    //   console.log(t);
    // }
  } catch (error) {
    console.error(error);
  }
})();

/*
9355d746ac3e4a97723d5ca134f4ec1ef07e670d375e900bf9a77ad05408f584
0

01fc65555d2155724c4bd2e5512244384f01ad1c708f0cf60268e8e40a2cbc24cb422413c0c1ffbbf9797a3cd2ab7d6a858a9819a97d8bd0ae

1827546


ADAX
0c78f619e54a5d00e143f66181a2c500d0c394b38a10e86cd1a23c5f
41444158 200


47207b53d4a031fa7d023a8ffd154c8db855c7b42201ff44d3847d4f
43617264616e6f456d7069726573436f696e 400


d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc
537061636542756433373235 1

*/
