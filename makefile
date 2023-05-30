RPC_URL_MAINNET := "https://rpc.ankr.com/eth"
RPC_URL_ZKSYNC := "https://mainnet.era.zksync.io"

test:
	forge test

clean:
	rm -rf broadcast cache

deploy:
	forge script contracts/scripts/Deploy.s.sol:Deploy \
		--rpc-url $(RPC_URL_MAINNET)  \
		--etherscan-api-key $(THORSTARTER_ETHERSCAN_KEY) \
		--private-key $(THORSTARTER_DEPLOYER_PRIVATE_KEY) \
		#--broadcast --verify -vvvv

deployzk:
	zkforge zkb --contracts zk
	zkforge zkc zk/SaleFcfsSimple.sol:SaleFcfsSimple \
		--constructor-args \
		  "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" \
		  "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" \
		  "75000000000" \
		  "$(shell cast --to-wei 1250000)" \
			"1685458800" \
			"1685545200" \
		  "$(shell cast --to-wei 0.1)" \
			"31104000" \
		--chain 324 \
		--rpc-url $(RPC_URL_ZKSYNC) \
		--private-key $(THORSTARTER_DEPLOYER_PRIVATE_KEY)

c:
	zkcast call 0x860b22C9d78C935dc5E6eA9699B5F0E162615911 "amountVesting() view returns (uint)" \
		--chain 324 \
		--rpc-url $(RPC_URL_ZKSYNC)

call:
	zkcast zks 0x313f9bf711351eae2c34d00bb36fb5de0b197e5b "withdrawToken(address,uint)" "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" "2500000" \
		--chain 324 \
		--rpc-url $(RPC_URL_ZKSYNC) \
		--private-key $(THORSTARTER_DEPLOYER_PRIVATE_KEY)
