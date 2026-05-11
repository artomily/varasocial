# Setup & Test Guide — VaraSocial AI Validator

Panduan lengkap untuk menyiapkan environment, menyeed data dummy ke Supabase, dan menjalankan tes end-to-end untuk dua alur utama:

1. **Subscription Validation** — user minta "blue check" → AI moderasi konten → on-chain decision
2. **Ad Validation** — user upload iklan → AI cek SARA → on-chain approval/rejection
3. **Mode Turu (AI Clone)** — user aktifkan mode tidur → AI auto-reply komentar di persona mereka

---

## Prasyarat

| Komponen | Keterangan |
|---|---|
| Node.js ≥ 20 | Runtime service |
| Redis | BullMQ queue (`redis://localhost:6379`) |
| Supabase project | URL + Service Role Key |
| OpenRouter API Key | LLM moderation (Gemini 2.0 Flash) |
| 0G Galileo Testnet RPC | `https://evmrpc-testnet.0g.ai` |
| Operator wallet | Private key + address, minimal saldo 0.05 A0GI |

### Install dependencies

```bash
cd ai-agent/ai-validator
npm install
```

### File `.env`

Salin `env.example` (jika ada) atau buat manual:

```env
# Blockchain
RPC_URL=https://evmrpc-testnet.0g.ai
CONTRACT_ADDRESS=0xFf89776BddC0501394aa5c86215c774c360DeDE2
OPERATOR_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI
OPENROUTER_API_KEY=sk-or-v1-...
LLM_MODEL=google/gemini-2.0-flash-exp   # opsional, ini defaultnya

# Redis
REDIS_URL=redis://localhost:6379

# Clone webhook
WEBHOOK_PORT=3100
WEBHOOK_SECRET=test-secret-123
```

---

## Langkah 0 — Jalankan migrasi database

Jalankan di **SQL Editor** Supabase atau via `supabase db push`:

```sql
-- File: ai-agent/ai-validator/db/migration.sql
-- Menambahkan kolom ai_status, ai_report, tx_hash ke users dan ad_campaigns

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ai_status  TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_report  TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash    TEXT;

ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS users_ai_status_check
    CHECK (ai_status IN ('pending', 'processing', 'approved', 'rejected'));

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS ai_status  TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_report  TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash    TEXT;

ALTER TABLE public.ad_campaigns
  ADD CONSTRAINT IF NOT EXISTS ad_campaigns_ai_status_check
    CHECK (ai_status IN ('pending', 'processing', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS ad_campaigns_route_hash_idx
  ON public.ad_campaigns (route_hash)
  WHERE route_hash IS NOT NULL;
```

---

## Langkah 1 — Seed Data Dummy di Supabase

Jalankan SQL berikut di **SQL Editor** Supabase. Seed ini mencakup semua skenario tes.

### 1a. Users (wallet address + mode turu)

```sql
-- User 1: konten aman, untuk tes subscription approved
-- UUID harus match dengan auth.users jika RLS aktif; pakai service key untuk bypass.
INSERT INTO public.users (id, handle, display_name, wallet_address, is_turu, persona, ai_status)
VALUES
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'budi_aman',
    'Budi Santoso',
    '0x1111111111111111111111111111111111111111',
    false,
    null,
    'pending'
  ),
  -- User 2: konten SARA, untuk tes subscription rejected
  (
    'aaaaaaaa-0002-0002-0002-000000000002',
    'akun_sara',
    'Akun SARA',
    '0x2222222222222222222222222222222222222222',
    false,
    null,
    'pending'
  ),
  -- User 3: mode turu aktif, untuk tes AI clone auto-reply
  (
    'aaaaaaaa-0003-0003-0003-000000000003',
    'turu_user',
    'Citra Tidur',
    '0x3333333333333333333333333333333333333333',
    true,
    'Perempuan muda dari Bandung, suka K-pop dan kopi susu. Gaya bahasa santai, sering pakai "sih", "dong", "kuy".',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;
```

### 1b. Posts

```sql
-- Post aman milik user 1 (untuk subscription validation)
INSERT INTO public.posts (id, author_id, content, truth_score, truth_level)
VALUES
  (
    'bbbbbbbb-0001-0001-0001-000000000001',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Selamat pagi semua! Hari ini cuaca cerah banget di Jakarta. Yuk semangat bekerja!',
    80, 'valid'
  ),
  (
    'bbbbbbbb-0002-0001-0001-000000000001',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Baru selesai baca buku tentang ketahanan pangan Indonesia. Sangat menarik dan informatif.',
    75, 'valid'
  );

-- Post SARA milik user 2 (untuk subscription validation rejected)
INSERT INTO public.posts (id, author_id, content, truth_score, truth_level)
VALUES
  (
    'bbbbbbbb-0001-0002-0002-000000000002',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Orang dari suku X memang malas semua, tidak ada yang bisa dipercaya.',
    10, 'hoax'
  ),
  (
    'bbbbbbbb-0002-0002-0002-000000000002',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Agama Y adalah agama yang menyesatkan, semua pengikutnya perlu diwaspadai.',
    5, 'hoax'
  );

-- Post mode turu milik user 3 (yang akan menerima komentar)
INSERT INTO public.posts (id, author_id, content, truth_score, truth_level)
VALUES
  (
    'bbbbbbbb-0001-0003-0003-000000000003',
    'aaaaaaaa-0003-0003-0003-000000000003',
    'Lagi nyobain café baru di Dago, kopinya enak banget sih! Ada yang pernah ke sini?',
    70, 'valid'
  );
```

### 1c. Ad Campaigns (dengan `route_hash` untuk tes ad validation)

`route_hash` harus cocok dengan `adRootHash` yang akan di-emit oleh smart contract saat `requestAdPlacement()`.
Untuk tes lokal, kita gunakan bytes32 dummy yang kita tentukan sendiri.

```sql
-- Iklan aman: produk minuman
INSERT INTO public.ad_campaigns (id, owner_id, title, objective, budget, route_hash, ai_status)
VALUES
  (
    'cccccccc-0001-0001-0001-000000000001',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Promo Kopi Nusantara',
    'Tingkatkan penjualan kopi arabika premium dari petani lokal Aceh dan Toraja.',
    0.001,
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'pending'
  );

-- Iklan SARA: produk dengan klaim diskriminatif
INSERT INTO public.ad_campaigns (id, owner_id, title, objective, budget, route_hash, ai_status)
VALUES
  (
    'cccccccc-0002-0002-0002-000000000002',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Produk Eksklusif Ras Pilihan',
    'Hanya untuk golongan tertentu. Orang dari ras X tidak layak menggunakan produk kami.',
    0.001,
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'pending'
  );
```

---

## Langkah 2 — Jalankan Service

```bash
# Terminal 1: pastikan Redis berjalan
redis-server

# Terminal 2: jalankan AI validator
cd ai-agent/ai-validator
npm run dev
```

Output startup yang diharapkan:
```
━━━ VaraSocial AI Validator ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Operator wallet balance OK  { address: '0x...', balance: '0.5 ETH' }
Blockchain listener started { rpc: 'https://evmrpc-testnet.0g.ai', contract: '0xFf89776BddC0501394aa5c86215c774c360DeDE2' }
AI Validator + AI Clone are live — listening for events
```

---

## Langkah 3 — Tes Subscription Validation

### Skenario A: User dengan konten aman → harus APPROVED

Trigger dari blockchain: panggil `requestSubscription()` dengan wallet `0x1111...1111`.

**Cara mudah test tanpa transaksi blockchain** — inject job langsung ke BullMQ queue via script Node.js:

```js
// scripts/test-subscription-safe.mjs
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis("redis://localhost:6379", { maxRetriesPerRequest: null });
const queue = new Queue("validation", { connection });

await queue.add(
  "subscription-validation",
  {
    type: "SUBSCRIPTION",
    user: "0x1111111111111111111111111111111111111111",
    rootHash: null,
  },
  { attempts: 1 }
);

console.log("Job injected: subscription safe user");
await connection.quit();
```

```bash
node scripts/test-subscription-safe.mjs
```

**Log yang diharapkan:**
```
Job started        { jobId: '...', type: 'SUBSCRIPTION', user: '0x1111...1111' }
AI decision        { type: 'SUBSCRIPTION', is_safe: true, reason: '' }
Tx submitted       { type: 'SUBSCRIPTION', user: '0x1111...', isApproved: true, hash: '0x...' }
Tx confirmed       { hash: '0x...', block: 12345 }
Job complete       { is_safe: true, txHash: '0x...' }
```

**Verifikasi Supabase:**
```sql
SELECT wallet_address, ai_status, ai_report, tx_hash
FROM public.users
WHERE wallet_address ILIKE '0x1111111111111111111111111111111111111111';
-- Expected: ai_status = 'approved', tx_hash = '0x...'
```

---

### Skenario B: User dengan konten SARA → harus REJECTED

```js
// scripts/test-subscription-sara.mjs
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis("redis://localhost:6379", { maxRetriesPerRequest: null });
const queue = new Queue("validation", { connection });

await queue.add(
  "subscription-validation",
  {
    type: "SUBSCRIPTION",
    user: "0x2222222222222222222222222222222222222222",
    rootHash: null,
  },
  { attempts: 1 }
);

console.log("Job injected: subscription SARA user");
await connection.quit();
```

**Verifikasi Supabase:**
```sql
SELECT wallet_address, ai_status, ai_report
FROM public.users
WHERE wallet_address ILIKE '0x2222222222222222222222222222222222222222';
-- Expected: ai_status = 'rejected', ai_report = 'Konten mengandung...'
```

---

## Langkah 4 — Tes Ad Validation

### Skenario A: Iklan aman → APPROVED

Trigger dari blockchain: `requestAdPlacement(0xaaaa...aaaa)` dengan wallet `0x1111...1111`.

**Atau inject job langsung:**

```js
// scripts/test-ad-safe.mjs
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis("redis://localhost:6379", { maxRetriesPerRequest: null });
const queue = new Queue("validation", { connection });

await queue.add(
  "ad-validation",
  {
    type: "AD",
    user: "0x1111111111111111111111111111111111111111",
    rootHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  },
  { attempts: 1 }
);

console.log("Job injected: ad safe");
await connection.quit();
```

**Verifikasi Supabase:**
```sql
SELECT title, route_hash, ai_status, ai_report, tx_hash
FROM public.ad_campaigns
WHERE route_hash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
-- Expected: ai_status = 'approved'
```

---

### Skenario B: Iklan SARA → REJECTED

```js
// scripts/test-ad-sara.mjs
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis("redis://localhost:6379", { maxRetriesPerRequest: null });
const queue = new Queue("validation", { connection });

await queue.add(
  "ad-validation",
  {
    type: "AD",
    user: "0x2222222222222222222222222222222222222222",
    rootHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  },
  { attempts: 1 }
);

console.log("Job injected: ad SARA");
await connection.quit();
```

**Verifikasi Supabase:**
```sql
SELECT title, ai_status, ai_report
FROM public.ad_campaigns
WHERE route_hash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
-- Expected: ai_status = 'rejected', ai_report berisi alasan penolakan
```

---

## Langkah 5 — Tes Mode Turu (AI Clone Auto-Reply)

Mode Turu dipicu ketika ada komentar baru di postingan user yang `is_turu = true`.

### 5a. Tambah komentar dummy (pemicu)

```sql
-- Komentar dari user lain di postingan si "turu_user"
INSERT INTO public.comments (id, post_id, author_id, content, is_ai)
VALUES
  (
    'dddddddd-0001-0001-0001-000000000001',
    'bbbbbbbb-0001-0003-0003-000000000003',  -- post milik turu_user
    'aaaaaaaa-0001-0001-0001-000000000001',  -- dikirim oleh budi_aman
    'Café apa ini kak? Boleh share lokasinya?',
    false
  );
```

### 5b. Trigger webhook clone listener

```bash
curl -X POST http://localhost:3100/webhook/comment \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: test-secret-123" \
  -d '{
    "post_id":    "bbbbbbbb-0001-0003-0003-000000000003",
    "comment_id": "dddddddd-0001-0001-0001-000000000001",
    "author_id":  "aaaaaaaa-0001-0001-0001-000000000001"
  }'
```

Response yang diharapkan: `{"ok":true}`

**Log yang diharapkan di service:**
```
Webhook: comment job enqueued { post_id: 'bbbb...', comment_id: 'dddd...' }
Clone job started              { jobId: '...', post_id: 'bbbb...' }
Clone job complete             { user: 'turu_user', replyPreview: 'Ada dong kak! ...' }
```

### 5c. Verifikasi reply AI di Supabase

```sql
SELECT content, is_ai, created_at
FROM public.comments
WHERE post_id = 'bbbbbbbb-0001-0003-0003-000000000003'
ORDER BY created_at;
-- Baris kedua harus: is_ai = true, content = balasan AI dalam persona Citra
```

---

## Langkah 6 — Tes Deploy Kontrak (opsional, untuk dev)

Kontrak sudah deploy di testnet: `0xFf89776BddC0501394aa5c86215c774c360DeDE2`

Untuk re-deploy atau tes kontrak baru:

```bash
cd contracts

# Copy env
cp env.example .env
# Isi: DEPLOYER_PRIVATE_KEY, OPERATOR_ADDRESS, TREASURY_ADDRESS

# Deploy ke 0G Galileo Testnet
forge script script/Deploy.s.sol \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --broadcast \
  --legacy \
  -vvvv
```

### Tes fungsi kontrak secara manual (cast)

```bash
# Set RPC dan contract address
export RPC=https://evmrpc-testnet.0g.ai
export CONTRACT=0xFf89776BddC0501394aa5c86215c774c360DeDE2

# Cek subscription price
cast call $CONTRACT "subscriptionPrice()(uint256)" --rpc-url $RPC

# Cek ad price
cast call $CONTRACT "adPrice()(uint256)" --rpc-url $RPC

# Cek operator address
cast call $CONTRACT "operator()(address)" --rpc-url $RPC

# Request subscription (dari user wallet, perlu private key + saldo A0GI)
cast send $CONTRACT "requestSubscription()" \
  --value 0.01ether \
  --private-key $USER_PRIVATE_KEY \
  --rpc-url $RPC \
  --legacy

# Lihat event yang di-emit (tunggu 1 block)
cast logs --rpc-url $RPC \
  --address $CONTRACT \
  "SubscriptionRequested(address,uint256)" \
  --from-block latest
```

---

## Ringkasan Alur Data

```
[User Wallet]
    │
    │ requestSubscription() / requestAdPlacement(rootHash)
    ▼
[StorageGatekeeper.sol] ── emit SubscriptionRequested / AdRequested ──►
                                                                        │
                                                                [listener.js]
                                                                        │
                                                               enqueue BullMQ
                                                                        │
                                                                [worker.js]
                                                                   │       │
                                                         getAdContent()  getUserPosts()
                                                         [supabase.js]  [supabase.js]
                                                                        │
                                                                  [checkSARA()]
                                                                    [ai.js]
                                                                        │
                                                             sendDecision() on-chain
                                                              [operator.js]
                                                                        │
                                                        updateAdStatus() / updateUserStatus()
                                                                [supabase.js]

[Komentar baru] ─► POST /webhook/comment ─► [clone-listener.js]
                                                     │
                                             enqueue clone-reply
                                                     │
                                           [clone-worker.js]
                                                     │
                                         generateCloneReply() [clone-ai.js]
                                                     │
                                           insertAiReply() [supabase.js]
                                                     │
                                       comments (is_ai=true) di Supabase
```

---

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `supabase.getAdContent: ...single()` error | `route_hash` tidak ada di `ad_campaigns` | Pastikan seed data di-insert dengan `route_hash` yang benar |
| `supabase.getUserPosts (user lookup)` error | `wallet_address` tidak cocok | Cek case — query pakai `ilike`, pastikan address valid |
| `OpenRouter 429` | Rate limit | Tambah delay atau ganti model ke yang lebih murah |
| `Tx failed: nonce too low` | Job jalan paralel | `concurrency = 1` sudah diset, pastikan hanya 1 instance running |
| Webhook `401 Unauthorized` | Secret tidak cocok | Cek `WEBHOOK_SECRET` di `.env` vs header `x-webhook-secret` |
| Clone reply tidak muncul | `is_turu = false` atau `commenter_id = author_id` | Cek kolom `is_turu` di users dan pastikan commenter bukan pemilik post |
| Redis connection error | Redis tidak jalan | `redis-server` atau `docker run -p 6379:6379 redis` |
