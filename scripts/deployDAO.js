const hre = require("hardhat");

const parseUnits = ethers.utils.parseUnits;

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("DAO");
  const args = [
    "0xEBCD3922A199cd1358277C6458439C13A93531eD", // voters
    parseUnits("10000"), // min to propose
    parseUnits("0.1", 12), // min % quorum
    5 * 86400, // min voting time
    1 * 86400 // min execution delay
  ];
  const contract = await Contract.deploy(...args);
  await contract.deployed();
  console.log(contract.address, args);
  if (hre.network.name !== "hardhat") {
    await new Promise(resolve => setTimeout(resolve, 20000));
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
