import 'dotenv/config';
import { Command } from 'commander';
import { batchUpload, getConfig } from '../src/index.js';

const program = new Command();

program
  .name('batch-upload')
  .description('Upload multiple files sequentially to 0G Storage')
  .argument('<files...>', 'Paths to files to upload')
  .option('-n, --network <name>', 'Network: testnet or mainnet')
  .option('-m, --mode <mode>', 'Storage mode: turbo or standard (default: turbo)')
  .option('-k, --key <key>', 'Private key for signing (overrides PRIVATE_KEY in .env)')
  .action(async (files: string[], opts: { network?: string; mode?: string; key?: string }) => {
    try {
      const config = getConfig({ network: opts.network, mode: opts.mode, privateKey: opts.key });
      console.log(`Batch uploading ${files.length} file(s) to ${config.network.name} (${config.network.mode})...`);

      const results = await batchUpload(files, config);

      console.log(`\nAll ${results.length} file(s) uploaded successfully!\n`);
      results.forEach((r, i) => {
        console.log(`[${i + 1}] ${files[i]}`);
        console.log('     Root Hash:', r.rootHash);
        console.log('     Tx Hash: ', r.txHash);
        console.log(`     Explorer:  ${config.network.explorerUrl}/tx/${r.txHash}`);
      });
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
