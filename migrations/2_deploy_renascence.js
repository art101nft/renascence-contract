var Renascence = artifacts.require("Renascence");

module.exports = function(deployer) {
  if (deployer.network == 'mainnet') {
    console.log(`[+] Deploying mainnet contract`);
  } else {
    console.log(`[+] Deploying testnet contract`);
  }
  deployer.deploy(Renascence);
};