require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

require("@nomiclabs/hardhat-solhint");
require("solidity-coverage");

if (process.env.GAS_REPORT === "true") {
  require("hardhat-gas-reporter");
}

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

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
      url: "https://ropsten.infura.io/v3/f0039abafaab4ecf9b573383a5eba292",
      accounts: [
        "502cd3847e2c034df8d97ce706d3cffc5592da35b701f6d02ad05b9aa446abd2"
      ]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/f0039abafaab4ecf9b573383a5eba292",
      accounts: []
    }
  },
  gasReporter: {
    enabled: process.env.GAS_REPORT === "true",
    currency: "USD",
    gasPrice: 50,
    outputFile: undefined
  },
  etherscan: {
    apiKey: "3DCDTDG8SE69YYH6E8Q8AYM3VSTWAQ3H1H"
  }
};
