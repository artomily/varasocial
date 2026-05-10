// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StorageGatekeeper} from "../src/StorageGatekeeper.sol";

/**
 * @title Deploy
 * @notice Foundry deployment script for StorageGatekeeper on 0G Chain.
 *
 * Usage:
 *   # Testnet (Galileo)
 *   forge script script/Deploy.s.sol --rpc-url og_testnet --broadcast --legacy -vvvv
 *
 *   # Mainnet
 *   forge script script/Deploy.s.sol --rpc-url og_mainnet --broadcast --legacy -vvvv
 *
 * Required environment variables (copy .env.example → .env and fill in):
 *   DEPLOYER_PRIVATE_KEY   — private key of the deploying wallet (with 0G tokens)
 *   OPERATOR_ADDRESS       — server hot wallet address that will call setHashFor() and processValidation()
 *   TREASURY_ADDRESS       — company wallet/multisig that receives approved subscription payments
 *   OG_TESTNET_RPC_URL     — https://evmrpc-testnet.0g.ai
 *   OG_MAINNET_RPC_URL     — https://evmrpc.0g.ai
 *   OG_ETHERSCAN_API_KEY   — API key from chainscan (can be a placeholder)
 */
contract Deploy is Script {
    function run() external returns (StorageGatekeeper gatekeeper) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address operatorAddress    = vm.envAddress("OPERATOR_ADDRESS");
        address treasuryAddress    = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        gatekeeper = new StorageGatekeeper(operatorAddress, treasuryAddress);

        vm.stopBroadcast();

        console.log("StorageGatekeeper deployed at:", address(gatekeeper));
        console.log("Operator (hot wallet):", operatorAddress);
        console.log("Treasury:", treasuryAddress);
        console.log("Network chain ID:", block.chainid);
    }
}
