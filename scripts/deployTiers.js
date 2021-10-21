const hre = require("hardhat");

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("TiersV1");
  const args = [
    signer.address, // owner
    "0x4249dA70DdF83bcf7251d55f77CB04B002B64E7b", // dao
    "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2", // reward/xrune token
    "0xa4B53C4a1Fd342610cf2CC0fe9a30F3120387cf3", // voters token
  ];

  const contract = await upgrades.deployProxy(Contract, args);
  await contract.deployed();

  let contractAddress = await ethers.provider.getStorageAt(contract.address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
  contractAddress = '0x' + contractAddress.slice(26);
  if (hre.network.name !== "hardhat") {
    await new Promise(resolve => setTimeout(resolve, 20000));
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
  }
  console.log("Contract deployed to:", contract.address, contractAddress);
  // Use https://ropsten.etherscan.io/proxyContractChecker to finish verifying contract
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
