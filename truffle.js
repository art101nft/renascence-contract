require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*",
    },
    testnet: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://goerli.infura.io/v3/" + process.env.INFURA_PID),
      network_id: 5,
      confirmations: 1,
      timeoutBlocks: 10,
      skipDryRun: true,
      production: false
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://mainnet.infura.io/v3/" + process.env.INFURA_PID),
      network_id: 1,
      confirmations: 3,
      timeoutBlocks: 30,
      skipDryRun: false,
      production: true,
      gas: 3500000,
      gasPrice: 15000000000 // 15 gwei
    },
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      gasPrice: 2,
    },
  },
  compilers: {
    solc: {
      version: "^0.8.13",
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    'etherscan': process.env.ETHERSCAN_API
  }
};
