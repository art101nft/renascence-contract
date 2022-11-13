module.exports = async function main(callback) {
  try {
    const NFTisse = artifacts.require("NFTisse");
    const contract = await NFTisse.deployed();
    await contract.withdraw();
    console.log(`[+] Withdrew funds!`);
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
