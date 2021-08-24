## Mainnet Deployment

- XRUNE: https://etherscan.io/token/0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c
- Faucet: https://etherscan.io/address/0x87CF821bc517b6e54EEC96c324ABae82E8285E7C
- Staking: https://etherscan.io/address/0x93F5Dc8bC383BB5381a67A67516A163d1E56012a
- SushiRewarder: https://etherscan.io/address/0xb373f716FdC84447B1C7e2e1C4333c4A7C558148
- Voters: https://etherscan.io/address/0x2c246bE2419602C34CB2Ae5BdF53962d7b70C9a1

### Logs

**XRUNE**

```
21:08 thorstarter-contracts (main) hh run scripts/deployToken.js --network mainnet
Token deployed to: 0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c

21:14 thorstarter-contracts (main) hh verify --network mainnet 0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c 0x69539c1c678dfd26e626f109149b7cebdd5e4768
Nothing to compile

Successfully submitted source code for contract
contracts/XRUNE.sol:XRUNE at 0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c
for verification on Etherscan. Waiting for verification result...

Successfully verified contract XRUNE on Etherscan.
https://etherscan.io/address/0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c#code
```

**Faucet**

```
10:58 thorstarter-contracts (main) hh run scripts/deployFaucet.js --network mainnet
Faucet deployed to: 0x87CF821bc517b6e54EEC96c324ABae82E8285E7C
Faucet approved for 100000 tokens

11:00 thorstarter-contracts (main) hh verify --network mainnet 0x87CF821bc517b6e54EEC96c324ABae82E8285E7C 0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c 0x42A5Ed456650a09Dc10EBc6361A7480fDd61f27B
Nothing to compile

Successfully submitted source code for contract
contracts/Faucet.sol:Faucet at 0x87CF821bc517b6e54EEC96c324ABae82E8285E7C
for verification on Etherscan. Waiting for verification result...

Successfully verified contract Faucet on Etherscan.
https://etherscan.io/address/0x87CF821bc517b6e54EEC96c324ABae82E8285E7C#code
```

**Staking**

```
11:01 thorstarter-contracts (main) hh run scripts/deployStaking.js --network mainnet
Staking deployed to: 0x93F5Dc8bC383BB5381a67A67516A163d1E56012a
Staking XRUNE pool added
Staking approved for 1000000 tokens

11:07 thorstarter-contracts (main) hh verify --network mainnet 0x93F5Dc8bC383BB5381a67A67516A163d1E56012a 0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c 0x69539c1c678dfd26e626f109149b7cebdd5e4768 0
Nothing to compile

Successfully submitted source code for contract
contracts/Staking.sol:Staking at 0x93F5Dc8bC383BB5381a67A67516A163d1E56012a
for verification on Etherscan. Waiting for verification result...

Successfully verified contract Staking on Etherscan.
https://etherscan.io/address/0x93F5Dc8bC383BB5381a67A67516A163d1E56012a#code
```
