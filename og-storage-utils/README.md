# 0G Storage — TypeScript Starter Kit

Starter kit TypeScript untuk berinteraksi dengan jaringan **0G decentralized storage**, mendukung upload/download file, upload data in-memory, batch upload, enkripsi client-side, dan penyimpanan key-value (KV).

---

## Daftar Isi

- [Persyaratan](#persyaratan)
- [Setup & Deployment](#setup--deployment)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Panduan Penggunaan](#panduan-penggunaan)
  - [Upload File](#1-upload-file)
  - [Download File](#2-download-file)
  - [Upload Data String / Buffer](#3-upload-data-string--buffer)
  - [Batch Upload](#4-batch-upload)
  - [KV Store — Tulis Data](#5-kv-store--tulis-data-kv-set)
  - [KV Store — Baca Data](#6-kv-store--baca-data-kv-get)
- [Gunakan sebagai Library](#gunakan-sebagai-library)
- [Informasi Jaringan](#informasi-jaringan)
- [Catatan Penting](#catatan-penting)

---

## Persyaratan

- **Node.js** >= 18
- **npm** >= 9
- **Wallet EVM** dengan saldo 0G token (untuk upload — butuh gas fee)
- **Private key** wallet (export dari MetaMask: *Account Details → Show Private Key*)

---

## Setup & Deployment

### Langkah 1 — Clone & Install Dependensi

```bash
# Clone repository (atau download ZIP)
git clone <url-repo-ini>
cd "0g tes storage"

# Install semua dependensi
npm install
```

### Langkah 2 — Siapkan File Environment

```bash
# Salin template ke file .env
cp .env.example .env
```

Buka file `.env` dan isi nilai yang diperlukan (lihat bagian [Konfigurasi Environment](#konfigurasi-environment)).

> **PENTING:** Jangan pernah commit file `.env` ke version control. File ini sudah dimasukkan ke `.gitignore`.

### Langkah 3 — Dapatkan Token Testnet (jika menggunakan testnet)

- Kunjungi **https://faucet.0g.ai**
- Masukkan alamat wallet Anda
- Klaim 0.1 0G/hari (cukup untuk pengujian)

### Langkah 4 — Build Project (opsional)

```bash
# Compile TypeScript ke JavaScript (output ke ./dist)
npm run build

# Atau mode watch untuk development
npm run watch
```

> Build tidak wajib untuk menjalankan script — `tsx` menjalankan TypeScript langsung. Build diperlukan jika Anda menggunakan proyek ini sebagai library di proyek lain.

### Langkah 5 — Verifikasi Setup

```bash
# Coba upload file kecil untuk memastikan konfigurasi benar
echo "Hello 0G!" > test.txt
npm run upload -- ./test.txt
```

Jika berhasil, akan muncul **Root Hash** dan **Tx Hash**. Simpan Root Hash untuk download nanti.

---

## Konfigurasi Environment

Salin `.env.example` ke `.env`, lalu isi nilai berikut:

| Variabel | Wajib | Deskripsi |
|---|---|---|
| `NETWORK` | — | `testnet` atau `mainnet` (default: `testnet`) |
| `STORAGE_MODE` | — | `turbo` atau `standard` (default: `turbo`) |
| `PRIVATE_KEY` | **Ya** | Private key wallet EVM (untuk upload & KV write) |
| `GAS_PRICE` | — | Gas price manual dalam wei (opsional) |
| `GAS_LIMIT` | — | Gas limit manual (opsional) |
| `MAX_RETRIES` | — | Jumlah retry jika upload gagal (opsional) |
| `MAX_GAS_PRICE` | — | Batas maksimum gas price (opsional) |
| `KV_RPC_URL` | **Ya*** | URL node 0G-KV — wajib untuk `kv:get` |
| `KV_STREAM_ID` | — | Stream ID default untuk KV store (referensi) |
| `ENCRYPTION_MODE` | — | `aes256` atau `ecies` — aktifkan enkripsi upload |
| `ENCRYPTION_KEY` | — | Kunci AES-256 hex 32-byte (jika mode `aes256`) |
| `DECRYPTION_KEY` | — | Kunci dekripsi (jika mode `aes256`) |
| `RECIPIENT_PUBKEY` | — | Pubkey penerima compressed 33-byte (jika mode `ecies`) |
| `RECIPIENT_PRIVKEY` | — | Private key penerima untuk dekripsi ECIES |

> `KV_RPC_URL` wajib hanya untuk operasi baca KV (`kv:get`). Untuk tulis KV (`kv:set`) tidak diperlukan.

**Contoh `.env` minimal:**
```env
NETWORK=testnet
STORAGE_MODE=turbo
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
KV_RPC_URL=http://3.101.147.150:6789
```

---

## Panduan Penggunaan

### 1. Upload File

Upload file dari filesystem ke jaringan 0G Storage.

```bash
# Upload dengan konfigurasi default dari .env
npm run upload -- ./path/to/file.txt

# Pilih network secara eksplisit
npm run upload -- ./file.txt --network mainnet

# Pilih storage mode
npm run upload -- ./file.txt --mode standard

# Gunakan private key berbeda (tanpa ubah .env)
npm run upload -- ./file.txt --key 0xPRIVATE_KEY
```

**Output:**
```
Uploading file.txt to testnet (turbo)...

Upload successful!
Root Hash: 0xabc123...
Tx Hash:   0xdef456...
Explorer:  https://chainscan-galileo.0g.ai/tx/0xdef456...
```

> **Simpan Root Hash!** Ini adalah identifier permanen file Anda — dibutuhkan untuk download.

---

### 2. Download File

Download file dari jaringan 0G Storage menggunakan Root Hash.

```bash
# Download — disimpan ke ./downloads/<roothash>
npm run download -- 0xROOT_HASH

# Tentukan path output
npm run download -- 0xROOT_HASH --output ./hasil/file.txt

# Download dari network tertentu
npm run download -- 0xROOT_HASH --network mainnet --mode turbo
```

**Output:**
```
Downloading from testnet (turbo)...
Root Hash: 0xabc123...

Download successful!
Saved to: /home/user/project/downloads/0xabc123...
```

---

### 3. Upload Data String / Buffer

Upload data langsung dari memori tanpa menulis file ke disk terlebih dahulu.

```bash
# Upload string
npm run upload:data -- --data "Hello, 0G Storage!"

# Upload isi file sebagai raw buffer
npm run upload:data -- --file ./data.bin

# Dengan network custom
npm run upload:data -- --data "my data" --network mainnet
```

---

### 4. Batch Upload

Upload banyak file sekaligus secara berurutan.

```bash
npm run upload:batch -- file1.txt file2.jpg file3.pdf

# Dengan network custom
npm run upload:batch -- a.txt b.txt --network mainnet
```

**Output:**
```
Batch uploading 3 file(s) to testnet (turbo)...

All 3 file(s) uploaded successfully!

[1] file1.txt
     Root Hash: 0xaaa...
     Tx Hash:   0xbbb...
[2] file2.jpg
     Root Hash: 0xccc...
     ...
```

---

### 5. KV Store — Tulis Data (`kv:set`)

Simpan pasangan key-value ke dalam stream 0G-KV.

```bash
# Format: npm run kv:set -- <streamId> <key> <value>
npm run kv:set -- 0x<64-hex-chars> "username" "alice"

# Dengan network custom
npm run kv:set -- 0x<64-hex-chars> "config" "debug=true" --network mainnet

# Dengan private key eksplisit
npm run kv:set -- 0x<64-hex-chars> "score" "9999" --key 0xPRIVATE_KEY
```

**Stream ID** adalah string hex 64 karakter (0x + 32 byte). Contoh generate stream ID:
```bash
# Generate stream ID dari nama aplikasi (Node.js)
node -e "const {ethers} = await import('ethers'); console.log(ethers.id('nama-aplikasi-saya'))"
```

**Output:**
```
Writing KV to stream 0xabc... on testnet (turbo)...
  Key:   username
  Value: alice

KV write successful!
Tx Hash: 0xdef456...
```

---

### 6. KV Store — Baca Data (`kv:get`)

Baca nilai dari stream 0G-KV berdasarkan key.

```bash
# Format: npm run kv:get -- <streamId> <key>
npm run kv:get -- 0x<64-hex-chars> "username"

# Dengan KV RPC URL eksplisit (override .env)
npm run kv:get -- 0x<64-hex-chars> "username" --kv-rpc http://node-url:6789

# Baca versi spesifik
npm run kv:get -- 0x<64-hex-chars> "username" --version 1
```

**Output:**
```
Reading KV from stream 0xabc... on testnet...
  Key: username

KV read successful!
Value:   alice
Size:    5 bytes
Version: 1
```

---

## Gunakan sebagai Library

Import fungsi-fungsi ini langsung ke proyek TypeScript Anda:

```typescript
import {
  uploadFile,
  downloadFile,
  uploadData,
  batchUpload,
  kvSet,
  kvGet,
  getConfig,
} from './src/index.js';

// Konfigurasi (default: testnet + turbo dari .env)
const config = getConfig({
  network: 'testnet',
  mode: 'turbo',
  privateKey: '0xYOUR_PRIVATE_KEY',
  kvRpcUrl: 'http://3.101.147.150:6789',
});

// Upload file
const { rootHash, txHash } = await uploadFile('./photo.jpg', config);

// Download file
await downloadFile(rootHash, './downloaded-photo.jpg', config);

// Upload data in-memory
const result = await uploadData('Hello world!', config);

// Batch upload
const results = await batchUpload(['a.txt', 'b.txt'], config);

// KV — tulis
const streamId = '0x' + '0'.repeat(64); // stream ID Anda
await kvSet(streamId, 'myKey', 'myValue', config);

// KV — baca
const { value, size, version } = await kvGet(streamId, 'myKey', config);
console.log(value); // "myValue"
```

---

## Informasi Jaringan

### Testnet (Galileo)

| Parameter | Turbo | Standard |
|---|---|---|
| Chain ID | 16602 | 16602 |
| RPC URL | `https://evmrpc-testnet.0g.ai` | `https://evmrpc-testnet.0g.ai` |
| Indexer | `https://indexer-storage-testnet-turbo.0g.ai` | `https://indexer-storage-testnet-standard.0g.ai` |
| Explorer | `https://chainscan-galileo.0g.ai` | `https://chainscan-galileo.0g.ai` |
| Flow Contract | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` | sama |
| Faucet | `https://faucet.0g.ai` | — |

### Mainnet

| Parameter | Turbo | Standard |
|---|---|---|
| Chain ID | 16661 | 16661 |
| RPC URL | `https://evmrpc.0g.ai` | `https://evmrpc.0g.ai` |
| Indexer | `https://indexer-storage-turbo.0g.ai` | `https://indexer-storage.0g.ai` |
| Explorer | `https://chainscan.0g.ai` | `https://chainscan.0g.ai` |
| Flow Contract | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` | sama |

---

## Catatan Penting

- **Root Hash** adalah identifier permanen file — simpan baik-baik setelah upload. Tanpanya file tidak bisa didownload.
- **Private key** hanya diperlukan untuk operasi **tulis** (upload file, upload data, KV set). Download dan KV read tidak membutuhkan private key.
- **KV_RPC_URL** wajib diisi untuk operasi `kv:get`. Tanpanya pembacaan KV akan gagal.
- **Stream ID** harus konsisten — gunakan ID yang sama saat tulis dan baca. Disarankan generate dari `ethers.id('nama-unik-aplikasi')`.
- **Enkripsi** sepenuhnya di sisi client. Jika kunci hilang, data tidak dapat dipulihkan sama sekali — 0G tidak menyimpan kunci.
- **Standard mode** saat ini sedang dalam maintenance di beberapa network. Gunakan **turbo** untuk keandalan maksimal.
- **Biaya gas** diambil dari wallet Anda dalam token 0G. Pastikan saldo mencukupi sebelum melakukan upload.
- File yang diupload ke mode **turbo** tidak tersedia di mode **standard**, dan sebaliknya — keduanya adalah jaringan independen.
