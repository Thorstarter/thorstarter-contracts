const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { bn, ADDRESS_ZERO } = require("../test/utilities");

const allocations = `0x41B720be5796ECb7BEB5f712e1cC57dE631240c0,0,0,10,,,
0x69539C1c678dFd26E626f109149b7cEBDd5E4768,0,0,1000,,,
`;

const parseUnits = ethers.utils.parseUnits;

async function main() {
  // const signer = await ethers.getSigner();
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
  // return;

  const Contract = await hre.ethers.getContractFactory("SaleTiers");
  const now = (Date.now() / 1000) | 0;
  const args = [
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // payment token
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // offering token
    root, // merkle tree root
    1651591800, // start time
    1651678200, // end time
    parseUnits("25000000"), // offerring amount
    parseUnits("300000", 6), // raising amount
    1652542200, // vesting start
    parseUnits("0.1", 12), // vesting initial
    parseUnits("7776000", 0), // vesting duration
  ];
  //const contract = await Contract.deploy(...args, {
    // gasLimit: 2500000,
    // gasPrice: parseUnits("9000", "gwei")
  //});
  //await contract.deployed();
  const contract = { address: "0x798d0d1716ed93306d7576D595A16658f1Fba31e" };
  console.log(contract.address, args);
  if (hre.network.name !== "hardhat") {
    //await new Promise((resolve) => setTimeout(resolve, 30000));
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
