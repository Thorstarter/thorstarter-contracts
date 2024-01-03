const fs = require("fs");
const ethers = require("ethers");
const createHash = require("create-hash");
const stringify = require("json-stable-stringify");
const { BIP32Factory } = require("bip32");
const { bech32 } = require("bech32");
const { getSeed } = require("@xchainjs/xchain-crypto");
const ecc = require("tiny-secp256k1");

const bip32 = BIP32Factory(ecc);

const endpoint = "https://mayanode.mayachain.info";
const mnemonic = process.env.THORSTARTER_MAYA_MNEMONIC;
const keyPair = bip32.fromSeed(getSeed(mnemonic)).derivePath(`44'/931'/0'/0/0`);
const address = bech32.encode("maya", bech32.toWords(keyPair.identifier));
let sequence;

async function signAndBroadcastMessages(messages, memo = "") {
  const result = await fetch(endpoint + "/auth/accounts/" + address).then(r =>
    r.json()
  );
  const account = result.result.value;
  if (!sequence) {
    sequence = parseInt(account.sequence);
  } else {
    sequence++;
  }
  const tx = {
    msgs: messages,
    memo: memo,
    chain_id: "mayachain-mainnet-v1",
    sequence: String(sequence || "0"),
    account_number: account.account_number,
    fee: { gas: "10000000", amount: [] }
  };
  const hash = createHash("sha256")
    .update(stringify(tx))
    .digest();
  const signature = keyPair.sign(hash);
  const typedArrayToBase64 = a => btoa(String.fromCharCode.apply(null, a));

  const res = await fetch(endpoint + "/txs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "block",
      tx: {
        msg: messages,
        memo: memo,
        fee: { amount: [], gas: "10000000" },
        signatures: [
          {
            pub_key: {
              type: "tendermint/PubKeySecp256k1",
              value: typedArrayToBase64(keyPair.publicKey)
            },
            signature: typedArrayToBase64(signature),
            sequence: String(sequence || "0"),
            account_number: account.account_number
          }
        ]
      }
    })
  });
  const status = res.statusCode == null ? "" : res.statusCode;
  const body = await res.json();
  if (
    !res.ok &&
    body.error != "timed out waiting for tx to be included in a block"
  ) {
    throw new Error(`Error got non 2xx response code ${status}: ${body.error}`);
  }
  if (
    !body.logs &&
    body.error != "timed out waiting for tx to be included in a block"
  ) {
    throw new Error(
      "Error submiting transaction: " + (body.error || body.raw_log)
    );
  }
  if (!body.txhash) return "";
  return body.txhash;
}

async function transfer({ to, amount, asset, memo = "" }) {
  let assetName = (asset || "cacao").toLowerCase();
  if (assetName.startsWith("maya.")) {
    assetName = assetName.slice(5);
  }
  //let decimals = 1e8;
  //if (assetName === "maya") decimals = 1e4;
  //if (assetName === "cacao") decimals = 1e10;
  //const amountStr = (parseFloat(amount) * decimals).toFixed(0);
  const message = {
    type: "mayachain/MsgSend",
    value: {
      amount: [{ denom: assetName, amount: amount }],
      from_address: address,
      to_address: to
    }
  };
  return await signAndBroadcastMessages([message], memo);
}

(async () => {
  const entries = fs
    .readFileSync("forgecacao.csv", { encoding: "utf-8" })
    .split("\n")
    .filter(e => e)
    .map(e => e.split(","))
    .map(e => ({ address: e[0], maya: e[1], signature: e[2], amount: e[4] }))
    .filter(e => e.amount != "¤" && e.address != "address");

  const distributing = ethers.utils.parseUnits("15000", 10);
  const total = ethers.utils.parseUnits("11789900", 18);

  for (let e of entries) {
    const signatureAddress = ethers.utils.verifyMessage(
      "Linking forge wallet to maya address " + e.maya,
      ethers.utils.splitSignature(e.signature)
    );
    const valid = e.address == signatureAddress;
    if (!valid) return;
    const amount = ethers.utils
      .parseUnits(e.amount, 0)
      .mul(distributing)
      .div(total);
    console.log("-", e.maya, parseFloat(amount.toString()) / 1e10);
    const hash = await transfer({
      to: e.maya,
      amount: amount.toString()
    });
    console.log("!", e.maya, amount.toString(), hash);
  }
})();
