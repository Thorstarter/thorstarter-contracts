const hre = require("hardhat");

const parseUnits = ethers.utils.parseUnits;

// const xruneContract = "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2"; // ropsten
const xruneContract = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet
// const votersContract = "0x776E752E2fed4af405b4cf2C673D9d19A3346a69"; // ropsten
const votersContract = "0xEBCD3922A199cd1358277C6458439C13A93531eD"; // mainnet
const xxruneTestToken = "0x730ecbe7a8ac44c9250a4f44a433ac9fb073c491"; // ropsten

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("SaleDutch");
  const now = (Date.now() / 1000) | 0;
  const args = [
    xruneContract, // payment token
    "0x2610F0bFC21EF389fe4D03CFB7De9ac1E6C99D6E", // offering token
    1630418400, // now + 3 * 60, // start time
    1630461600, // now + 4 * 60 * 60, // end time
    parseUnits("2.50"), // start price
    parseUnits("0.25"), // end price
    parseUnits("5000000"), // offering amount
    parseUnits("0"), // per user cap amount
    signer.address, // owner
  ];
  const contract = await Contract.deploy(...args, {
    //gasLimit: 5000000,
    //gasPrice: parseUnits("100", "gwei"),
  });
  await contract.deployed();
  console.log(contract.address, args);
  await contract.configureVotingToken(parseUnits("100"), votersContract, 0);
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
