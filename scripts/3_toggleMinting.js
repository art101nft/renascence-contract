module.exports = async function main(callback) {
  try {
    const Renascence = artifacts.require("Renascence");
    const contract = await Renascence.deployed();
    const mintingIsActive = await contract.mintingIsActive();
    console.log(`[+] Toggling mintingIsActive. Currently: ${mintingIsActive}`);
    await contract.toggleMinting();
    if (mintingIsActive) {
      console.log(`[+] Minting disabled!`);
    } else {
      console.log(`[+] Minting enabled!`);
    }
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
