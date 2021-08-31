const hre = require("hardhat");

const parseUnits = ethers.utils.parseUnits;

const xruneContract = "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2"; // ropsten
// const xruneContract = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("EmissionsPrivateDispenser");
  const args = [
    xruneContract, // token
    [signer.address, "0x0000000000000000000000000000000000000001"], // investor addresses
    [parseUnits('0.18', 12), parseUnits('0.82', 12)], // investor percentages (1e12 = 100%) 
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
      constructorArguments: args,
    });
  }
  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
