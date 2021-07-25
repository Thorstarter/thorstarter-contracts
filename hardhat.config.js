require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

require("@nomiclabs/hardhat-solhint");
require("solidity-coverage");

if (process.env.GAS_REPORT === "true") {
  require("hardhat-gas-reporter");
}

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
      mining: {
        auto: true,
        interval: 0
      }
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: [process.env.THORSTARTER_TESTING_PRIVATE_KEY]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: [process.env.THORSTARTER_DEPLOYER_PRIVATE_KEY]
    }
  },
  gasReporter: {
    enabled: process.env.GAS_REPORT === "true",
    currency: "USD",
    gasPrice: 50,
    outputFile: undefined
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
