import 'dotenv/config';
import { Command } from 'commander';
import { kvGet, getConfig } from '../src/index.js';

const program = new Command();

program
  .name('kv-get')
  .description('Read a value from a 0G-KV stream by key')
  .argument('<streamId>', '0x-prefixed 32-byte hex stream ID')
  .argument('<key>', 'Key string')
  .option('-n, --network <name>', 'Network: testnet or mainnet')
  .option('-m, --mode <mode>', 'Storage mode: turbo or standard (default: turbo)')
  .option('--kv-rpc <url>', 'KV node RPC URL (overrides KV_RPC_URL in .env)')
  .option('--version <number>', 'Specific version to read', parseInt)
  .action(
    async (
      streamId: string,
      key: string,
      opts: { network?: string; mode?: string; kvRpc?: string; version?: number },
    ) => {
      try {
        const config = getConfig({ network: opts.network, mode: opts.mode, kvRpcUrl: opts.kvRpc });
        console.log(`Reading KV from stream ${streamId} on ${config.network.name}...`);
        console.log(`  Key: ${key}`);

        const result = await kvGet(streamId, key, config, opts.version);

        if (result.value === null) {
          console.log('\nKey not found.');
        } else {
          console.log('\nKV read successful!');
          console.log('Value:  ', result.value);
          console.log('Size:   ', result.size, 'bytes');
          console.log('Version:', result.version);
        }
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program.parse();
