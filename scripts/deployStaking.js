const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const tokenAddress = "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2";
  const signer = await hre.ethers.getSigner();
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    tokenAddress, // token
    await signer.getAddress(),
    ethers.utils.parseEther("0"),
    { gasLimit: 5000000 }
  );

  await staking.deployed();

  await staking.add(100, tokenAddress);

  const Token = await hre.ethers.getContractFactory("XRUNE");
  const token = Token.attach(tokenAddress);
  await token.approve(staking.address, ethers.utils.parseEther("1000000"));

  console.log("Staking deployed to:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
