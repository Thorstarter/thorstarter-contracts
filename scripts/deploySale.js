const hre = require("hardhat");

const parseUnits = ethers.utils.parseUnits;
const networkId = '3';
const addresses = {
  '1': {
    xrune: '0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c',
    voters: '0xEBCD3922A199cd1358277C6458439C13A93531eD',
    tiers: '0x817ba0ecafD58460bC215316a7831220BFF11C80',
  },
  '3': {
    xrune: '0x0fe3ecd525d16fa09aa1ff177014de5304c835e2',
    voters: '0x776E752E2fed4af405b4cf2C673D9d19A3346a69',
    tiers: '0x1190C41f4c47A466F507E28C8fe4cC6aC3E34906',
    offering: '0x730ecbe7a8ac44c9250a4f44a433ac9fb073c491',
  },
};

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("SaleFcfs");
  const now = (Date.now() / 1000) | 0;
  const args = [
    addresses[networkId].xrune, // payment token
    addresses[networkId].offering, // offering token
    addresses[networkId].voters, // vxrune
    now + 300, // start time
    now + 7500, // end time
    parseUnits("1000"), // offerring amount
    parseUnits("100"), // raising amount
    parseUnits("25"), // per user cap amount
    '0x0000000000000000000000000000000000000000' // staking
  ];
  const contract = await Contract.deploy(...args, {
    // gasLimit: 5000000,
    // gasPrice: parseUnits("100", "gwei"),
  });
  await contract.deployed();
  console.log(contract.address, args);
  await contract.configureTiers(
    addresses[networkId].tiers,
    50,
    [parseUnits('2500'), parseUnits('7500'), parseUnits('25000'), parseUnits('150000')],
    [parseUnits('1', 8), parseUnits('1.5', 8), parseUnits('3', 8), parseUnits('10', 8)],
  );
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
