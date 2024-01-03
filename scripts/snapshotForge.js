const ethers = require("ethers");

const ONE = ethers.utils.parseUnits("1", 18);
const ONE6 = ethers.utils.parseUnits("1", 6);
const ONE12 = ethers.utils.parseUnits("1", 12);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const rpc = "https://rpcapi.fantom.network";
const provider = new ethers.providers.StaticJsonRpcProvider(rpc, 250);

function call(address, fn, ...args) {
  //console.log("call", address, fn, args);
  let [name, params, returns] = fn.split("-");
  const rname = name[0] === "+" ? name.slice(1) : name;
  let efn = `function ${rname}(${params}) external`;
  if (name[0] !== "+") efn += " view";
  if (returns) efn += ` returns (${returns})`;
  const contract = new ethers.Contract(address, [efn], provider);
  return contract[rname](...args);
}

(async () => {
  const forge = "0x2D23039c1bA153C6afcF7CaB9ad4570bCbF80F56";

  const usersLength = (await call(forge, "usersLength--uint256")).toNumber();
  let users = [];
  for (let i = 0; i < usersLength; i += 100) {
    users = users.concat(
      await call(forge, "usersPage-uint256,uint256-address[]", i / 100, 100)
    );
  }
  users = users.filter(u => u !== ZERO_ADDRESS);

  for (let i in users) {
    const u = users[i];
    const [amount] = await call(
      forge,
      "getUserInfo-address-uint256,uint256,uint256",
      u
    );
    if (amount.gt("0")) {
      console.log(i, +"," + u + "," + amount);
    }
  }
})();
