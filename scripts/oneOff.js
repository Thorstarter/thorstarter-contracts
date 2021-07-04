const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const signer = await ethers.getSigner();
  const gasPrice = (await signer.getGasPrice()).mul(200).div(100);
  const tokenAddress = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet
  const XRUNE = await hre.ethers.getContractFactory("XRUNE");
  const token = XRUNE.attach(tokenAddress);
  await token.approve('0x87CF821bc517b6e54EEC96c324ABae82E8285E7C', ethers.utils.parseEther("100000"), {gasPrice});
  console.log("Faucet approved for 100000 tokens");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
