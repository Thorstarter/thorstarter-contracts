const hre = require("hardhat");

const xruneContract = "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2"; // ropsten
// const xruneContract = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet

async function main() {
  const Contract = await hre.ethers.getContractFactory("EmissionsSplitter");
  const args = [
    xruneContract, // token
    1627789788, // emissions start
    "0xda4f15016dcc70f048e647339d2065f91b9f658c", // dao
    "0x0000000000000000000000000000000000000001", // team
    "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE", // investors
    "0x0000000000000000000000000000000000000002" // ecosystem
  ];
  const contract = await Contract.deploy(...args, {
    //gasLimit: 5000000,
    //gasPrice: parseUnits("100", "gwei"),
  });
  await contract.deployed();
  console.log(contract.address, args);
  if (hre.network.name !== "hardhat") {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args
    });
  }
  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
