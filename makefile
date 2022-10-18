RPC_URL_MAINNET := "https://rpc.ankr.com/eth"

test:
	forge test

clean:
	rm -rf broadcast cache

deploy:
	forge script contracts/scripts/Deploy.s.sol:Deploy \
		--rpc-url $(RPC_URL_MAINNET)  \
		--etherscan-api-key $(THORSTARTER_ETHERSCAN_KEY) \
		--private-key $(THORSTARTER_PRIVATE_KEY_MAINNET) \
		--broadcast --verify -vvvv
