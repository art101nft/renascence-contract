const newURI = 'ipfs://QmZYMddjA5Hks1uzMHGmg8XwMpc893nWYRX8Xt2PVuvsrY/';

module.exports = async function main(callback) {
  try {
    const NFTisse = artifacts.require("NFTisse");
    const nfs = await NFTisse.deployed();
    if (newURI == '') {
      console.log('You need to specify a metadata URI where assets can be loaded. ie: "ipfs://xxxxxx/"');
      callback(1);
    } else {
      await nfs.setBaseURI(newURI);
      console.log(`Set new contract base metadata URI as: ${newURI}`);
      callback(0);
    }
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
