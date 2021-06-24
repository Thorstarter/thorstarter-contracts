const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const tokenAddress = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet

  const signer = await hre.ethers.getSigner();
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    tokenAddress, // token
    await signer.getAddress(),
    ethers.utils.parseEther("0")
  );

  await staking.deployed();
  console.log("Staking deployed to:", staking.address);

  await staking.add(100, tokenAddress);
  console.log("Staking XRUNE pool added");

  const Token = await hre.ethers.getContractFactory("XRUNE");
  const token = Token.attach(tokenAddress);
  await token.approve(staking.address, ethers.utils.parseEther("1000000"));
  console.log("Staking approved for 1000000 tokens");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
