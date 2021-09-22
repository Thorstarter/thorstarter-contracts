const hre = require("hardhat");
const ethers = hre.ethers;
const parseUnits = ethers.utils.parseUnits;

async function main() {
  const signer = await ethers.getSigner();
  const gasPrice = (await signer.getGasPrice()).mul(125).div(100);

  const Contract = await hre.ethers.getContractFactory("Voters");
  const contract = Contract.attach(
    "0xEBCD3922A199cd1358277C6458439C13A93531eD"
  );
  const gas = await contract.estimateGas.updateTclp(
    ["0x2b0A6d28CE1d149201323971a8BDC544795cf7eB"],
    [0],
    [0]
  );
  console.log(gas.toNumber());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/* verify
  await hre.run("verify:verify", {
    address: "0xd6fe0135feA614Ddd0c83507fE5a0AD5c92672d2",
    constructorArguments: [
      "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c",
      1627789788,
      "0xda4f15016dcc70f048e647339d2065f91b9f658c",
      "0x0000000000000000000000000000000000000001",
      "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE",
      "0x0000000000000000000000000000000000000002"
    ]
  });
  */

/* approve
  const tokenAddress = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet
  const XRUNE = await hre.ethers.getContractFactory("XRUNE");
  const token = XRUNE.attach(tokenAddress);
  await token.approve(
    "0x87CF821bc517b6e54EEC96c324ABae82E8285E7C",
    ethers.utils.parseEther("100000"),
    { gasPrice }
  );
  console.log("Faucet approved for 100000 tokens");
  */
