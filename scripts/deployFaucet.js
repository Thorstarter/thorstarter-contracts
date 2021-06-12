const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const tokenAddress = "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2";
  const signer = await hre.ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("Faucet");
  const contract = await Contract.deploy(
    tokenAddress,
    "0xe0a63488e677151844e70623533c22007dc57c9e", // thorchain router
    { gasLimit: 5000000 }
  );

  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
