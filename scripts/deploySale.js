const hre = require("hardhat");
const { bn, ADDRESS_ZERO } = require("../test/utilities");

/*
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const allocations = `0x41B720be5796ECb7BEB5f712e1cC57dE631240c0,0,0,10,,,
0x69539C1c678dFd26E626f109149b7cEBDd5E4768,0,0,1000,,,
`;
const usersMap = {};
for (let allocation of allocations.trim().split("\n")) {
  const parts = allocation.split(",");
  if (!parseFloat(parts[3])) continue;
  if (!usersMap[parts[0]]) {
    usersMap[parts[0]] = { address: parts[0], amount: bn("0") };
  }
  usersMap[parts[0]].amount = usersMap[parts[0]].amount.add(bn(parts[3], 6));
}
const users = Object.values(usersMap);
const elements = users.map((x) =>
  ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [x.address, x.amount]
  )
);
const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
const root = merkleTree.getHexRoot();
console.log("merkle tree root", root);
require("fs").writeFileSync(
  "allocations.json",
  JSON.stringify(
    users.map((u, i) => {
      u.proof = merkleTree.getHexProof(elements[i]);
      u.amount = ethers.utils.formatUnits(u.amount, 6);
      return u;
    }),
    null,
    2
  )
);
// */

const parseUnits = ethers.utils.parseUnits;

async function main() {
  const Contract = await hre.ethers.getContractFactory("SaleShare");
  const now = (Date.now() / 1000) | 0;
  const args = [
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // payment token
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // offering token
    "0xe33f4f08b2aa308962a603c106b4ce57b1961960", // server signer
    1658173535, // start time
    1659210332, // end time
    parseUnits("25000000"), // offerring amount
    parseUnits("300000", 6), // raising amount
    1659210332, // vesting start
    parseUnits("0.1", 12), // vesting initial
    parseUnits("7776000", 0) // vesting duration
  ];
  const contract = await Contract.deploy(...args, {
    //gasLimit: 2500000,
    //gasPrice: parseUnits("20", "gwei")
  });
  await contract.deployed();
  //const contract = { address: "0x798d0d1716ed93306d7576D595A16658f1Fba31e" };
  console.log(contract.address, args);
  if (hre.network.name !== "hardhat") {
    await new Promise(resolve => setTimeout(resolve, 30000));
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
