module.exports = async function main(callback) {
  try {
    const Renascence = artifacts.require("Renascence");
    const contract = await Renascence.deployed();
    await contract.withdraw();
    console.log(`[+] Withdrew funds!`);
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
