/**
 * treasury/balance.ts
 *
 * Check the 0G testnet balance of the treasury wallet.
 *
 * Usage:
 *   npx tsx treasury/balance.ts
 */

import { createPublicClient, http, formatEther } from "viem";
import { defineChain } from "viem";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const zeroGTestnet = defineChain({
  id: 16602,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
});

const address = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}` | undefined;

if (!address) {
  console.error("❌  NEXT_PUBLIC_TREASURY_ADDRESS not set in .env.local");
  console.error("    Run: npx tsx treasury/generate.ts");
  process.exit(1);
}

const client = createPublicClient({
  chain: zeroGTestnet,
  transport: http(),
});

const balance = await client.getBalance({ address });

console.log(`\n💰  Treasury balance on 0G Testnet`);
console.log(`    Address : ${address}`);
console.log(`    Balance : ${formatEther(balance)} 0G`);
console.log(`    Explorer: https://chainscan-galileo.0g.ai/address/${address}\n`);
