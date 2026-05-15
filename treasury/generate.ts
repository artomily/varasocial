/**
 * treasury/generate.ts
 *
 * Generate a new treasury wallet for VaraSocial.
 * Writes NEXT_PUBLIC_TREASURY_ADDRESS and TREASURY_PRIVATE_KEY to .env.local.
 *
 * Usage:
 *   npx tsx treasury/generate.ts
 *
 * ⚠️  Only run this ONCE.  Keep TREASURY_PRIVATE_KEY secret — never commit it.
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ENV_FILE = resolve(process.cwd(), ".env.local");

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("\n✅  Treasury wallet generated");
console.log("   Address     :", account.address);
console.log("   Private key :", privateKey);
console.log("\n⚠️  Save the private key somewhere safe. It won't be shown again.\n");

// ── Update / create .env.local ──────────────────────────────────────────────

let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf-8") : "";

function setEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  return regex.test(content) ? content.replace(regex, line) : `${content}\n${line}`.trimStart();
}

env = setEnvVar(env, "NEXT_PUBLIC_TREASURY_ADDRESS", account.address);
env = setEnvVar(env, "TREASURY_PRIVATE_KEY", privateKey);

writeFileSync(ENV_FILE, env.endsWith("\n") ? env : env + "\n");

console.log(`📝  Written to .env.local`);
console.log(`   NEXT_PUBLIC_TREASURY_ADDRESS=${account.address}`);
console.log(`   TREASURY_PRIVATE_KEY=<hidden>\n`);
