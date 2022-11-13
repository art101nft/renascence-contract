const newMerkleRoot = '0xa758df020ed4cca092118f2889cc26bd5746278be08c87ef04204b0c544c0553'; // snapshot 2

module.exports = async function main(callback) {
  try {
    const NFTisse = artifacts.require("NFTisse");
    const contract = await NFTisse.deployed();
    if (newMerkleRoot == '') {
      console.log('[!] You need to specify a merkle root hash.');
      callback(1);
    } else {
      await contract.setMerkleRoot(newMerkleRoot);
      console.log(`[+] Set new merkle root hash as: ${newMerkleRoot}`);
      callback(0);
    }
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
