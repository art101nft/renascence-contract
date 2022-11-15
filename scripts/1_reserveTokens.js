module.exports = async function main(callback) {
  try {
    const Renascence = artifacts.require("Renascence");
    const contract = await Renascence.deployed();
    await contract.reserveTokens();
    console.log(`[+] Tokens reserved!`);
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
