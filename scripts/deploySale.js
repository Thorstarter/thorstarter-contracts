const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { bn, ADDRESS_ZERO } = require('../test/utilities');

const allocations = `0x41B720be5796ECb7BEB5f712e1cC57dE631240c0,0.00,0,100.00,,
0x69539C1c678dFd26E626f109149b7cEBDd5E4768,0.00,0,100.00,,`;

const parseUnits = ethers.utils.parseUnits;
const networkId = '1';
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
  // const signer = await ethers.getSigner();
  const users = allocations.split('\n').map(line => {
    const parts = line.split(',');
    if (parseFloat(parts[3]) === 0) return null;
    return {address: parts[0], amount: bn(parts[3]).div('4200')};
  }).filter(u => u);
  const elements = users.map((x) =>
    ethers.utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount])
  );
  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
  const root = merkleTree.getHexRoot();
  require('fs').writeFileSync('allocations.json', JSON.stringify(users.map((u, i) => {
    u.proof = merkleTree.getHexProof(elements[i]);
    u.amount = ethers.utils.formatUnits(u.amount);
    return u;
  }), null, 2));

  const Contract = await hre.ethers.getContractFactory("SaleTiers");
  const now = (Date.now() / 1000) | 0;
  const args = [
    '0x829c97092c0cc92efe7397dd3ddb831cc5835bae', // offering token
    root, // merkle tree root
    1637852400, // start time
    1637859600, // end time
    parseUnits("15000000"), // offerring amount
    parseUnits("35.7142857143"), // raising amount
  ];
  const contract = await Contract.deploy(...args, {
    // gasLimit: 5000000,
    gasPrice: parseUnits("200", "gwei"),
  });
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
