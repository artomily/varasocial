import 'dotenv/config';
import { Command } from 'commander';
import { kvSet, getConfig } from '../src/index.js';

const program = new Command();

program
  .name('kv-set')
  .description('Write a key-value pair to a 0G-KV stream')
  .argument('<streamId>', '0x-prefixed 32-byte hex stream ID')
  .argument('<key>', 'Key string')
  .argument('<value>', 'Value string')
  .option('-n, --network <name>', 'Network: testnet or mainnet')
  .option('-m, --mode <mode>', 'Storage mode: turbo or standard (default: turbo)')
  .option('-k, --key <key>', 'Private key for signing (overrides PRIVATE_KEY in .env)')
  .action(
    async (
      streamId: string,
      kvKey: string,
      kvValue: string,
      opts: { network?: string; mode?: string; key?: string },
    ) => {
      try {
        const config = getConfig({ network: opts.network, mode: opts.mode, privateKey: opts.key });
        console.log(`Writing KV to stream ${streamId} on ${config.network.name} (${config.network.mode})...`);
        console.log(`  Key:   ${kvKey}`);
        console.log(`  Value: ${kvValue}`);

        const result = await kvSet(streamId, kvKey, kvValue, config);

        console.log('\nKV write successful!');
        if (result.txHash) {
          console.log('Tx Hash:  ', result.txHash);
        }
        console.log('Root Hash:', result.rootHash);
        console.log('\nNote: use Root Hash above to verify the KV entry on the storage explorer.');
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program.parse();
