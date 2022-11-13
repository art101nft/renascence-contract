var Renascence = artifacts.require("Renascence");

module.exports = function(deployer) {
  let opensea;
  if (deployer.network == 'mainnet') {
    opensea = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';
    console.log(`[+] Using OpenSea mainnet proxy address ${opensea}`);
  } else {
    opensea = '0xf57b2c51ded3a29e6891aba85459d600256cf317';
    console.log(`[+] Using OpenSea testnet proxy address ${opensea}`);
  }
  deployer.deploy(Renascence, opensea);
};