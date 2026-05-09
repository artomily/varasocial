import 'dotenv/config';
import { Command } from 'commander';
import fs from 'fs';
import { uploadData, getConfig } from '../src/index.js';

const program = new Command();

program
  .name('upload-data')
  .description('Upload a string or file contents as raw data to 0G Storage (via MemData)')
  .option('-d, --data <string>', 'String data to upload')
  .option('-f, --file <path>', 'File whose raw bytes will be uploaded')
  .option('-n, --network <name>', 'Network: testnet or mainnet')
  .option('-m, --mode <mode>', 'Storage mode: turbo or standard (default: turbo)')
  .option('-k, --key <key>', 'Private key for signing (overrides PRIVATE_KEY in .env)')
  .action(
    async (opts: { data?: string; file?: string; network?: string; mode?: string; key?: string }) => {
      try {
        if (!opts.data && !opts.file) {
          console.error('Error: provide --data <string> or --file <path>');
          process.exit(1);
        }

        const config = getConfig({ network: opts.network, mode: opts.mode, privateKey: opts.key });

        let payload: Uint8Array | string;
        if (opts.file) {
          payload = fs.readFileSync(opts.file);
          console.log(`Uploading file contents (${payload.length} bytes) to ${config.network.name} (${config.network.mode})...`);
        } else {
          payload = opts.data!;
          console.log(`Uploading string data to ${config.network.name} (${config.network.mode})...`);
        }

        const result = await uploadData(payload, config);

        console.log('\nUpload successful!');
        console.log('Root Hash:', result.rootHash);
        console.log('Tx Hash: ', result.txHash);
        console.log(`Explorer:  ${config.network.explorerUrl}/tx/${result.txHash}`);
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program.parse();
