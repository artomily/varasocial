import { ethers } from "ethers";
import "dotenv/config";
import { ABI } from "./abi.js";
import { logger } from "./logger.js";

// Lazily initialised singletons — re-used across all jobs in the process.
let _provider = null;
let _wallet = null;
let _contract = null;

function getContract() {
  if (_contract) return _contract;
  _provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  _wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, _provider);
  _contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, _wallet);
  return _contract;
}

/**
 * Broadcast an on-chain validation decision and wait for 1 confirmation.
 *
 * Gas price is fetched dynamically with a +10 % buffer (capped at 10 gwei)
 * so transactions go through cheaply on the 0G testnet.
 *
 * @param {string}  userAddress  Wallet address of the user being validated
 * @param {boolean} isApproved   AI decision
 * @param {'AD' | 'SUBSCRIPTION'} type
 * @returns {Promise<string>}    Confirmed transaction hash
 */
export async function sendDecision(userAddress, isApproved, type) {
  const contract = getContract();

  // Dynamic gas with a safety ceiling
  const feeData = await _provider.getFeeData();
  const rawGasPrice = feeData.gasPrice ?? ethers.parseUnits("5", "gwei");
  const ceiling = ethers.parseUnits("10", "gwei");
  const gasPrice =
    ((rawGasPrice * 110n) / 100n) < ceiling
      ? (rawGasPrice * 110n) / 100n
      : ceiling;

  const overrides = { gasPrice };

  const tx =
    type === "AD"
      ? await contract.processAdValidation(userAddress, isApproved, overrides)
      : await contract.processValidation(userAddress, isApproved, overrides);

  logger.info("Tx submitted", {
    type,
    user: userAddress,
    isApproved,
    hash: tx.hash,
  });

  const receipt = await tx.wait(1);
  logger.info("Tx confirmed", { hash: receipt.hash, block: receipt.blockNumber });

  return receipt.hash;
}

/**
 * Log a warning if the operator wallet balance drops below 0.05 ETH.
 * Called on startup and can be scheduled periodically.
 */
export async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  const threshold = ethers.parseEther("0.05");

  if (balance < threshold) {
    logger.warn("⚠️  Operator wallet balance LOW — please top up", {
      address: wallet.address,
      balance: ethers.formatEther(balance) + " ETH",
      threshold: "0.05 ETH",
    });
  } else {
    logger.info("Operator wallet balance OK", {
      address: wallet.address,
      balance: ethers.formatEther(balance) + " ETH",
    });
  }
}
