# AI Validator & AI Clone — VaraSocial

Node.js service yang menjalankan **dua modul AI secara paralel** dalam satu proses dan satu Docker container untuk efisiensi RAM.

---

## Modul

### A — AI Validator (Moderasi Konten)

Memantau event dari smart contract 0G dan memvalidasi konten iklan/akun terhadap unsur SARA.

- Mendeteksi konten **SARA** dan ujaran kebencian via LLM
- Memvalidasi **iklan** sebelum tayang — approve/reject + refund otomatis ke blockchain
- Memvalidasi **akun premium** (blue-check) berdasarkan riwayat 10 postingan terakhir
- Mengeksekusi keputusan langsung ke **smart contract** dengan wallet operator
- Menyinkronkan hasil (status, alasan, tx hash) kembali ke **Supabase**

### B — AI Clone (Mode Turu / Auto-Reply)

Membalas komentar secara otomatis dengan persona user ketika `is_turu = true`, dipicu via HTTP webhook.

- Menerima trigger dari **Supabase Database Webhook** (POST `/webhook/comment`)
- Mengambil konteks: post asli + 5 komentar terakhir (thread) + persona user
- Menghasilkan balasan **maksimal 1 kalimat** yang fluid dan sesuai karakter user
- Menyimpan balasan sebagai komentar dengan flag `is_ai = true`
- **Redis caching** untuk user profile (10 menit) dan post content (30 menit)

---

## Arsitektur Paralel

```
┌─────────────────────────────────────────────────────────────────┐
│                     ai-validator container                       │
│                                                                  │
│  [ 0G Blockchain ] ──── AdRequested / SubscriptionRequested ──► │
│  [ listener.js   ]  ──────────────────────────────────────────► │
│                                            │                     │
│                             ┌──────────────┘                     │
│                             ▼                                    │
│                   [ Redis Queue: "validation" ]                  │
│                             │                                    │
│                             ▼  concurrency=1 (nonce-safe)        │
│                       [ worker.js ]                              │
│                             │                                    │
│              ┌──────────────┼──────────────┐                     │
│              ▼              ▼              ▼                     │
│         Supabase       OpenRouter     Operator Wallet            │
│       (fetch konten)  (SARA check)  (on-chain tx)               │
│                                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                  │
│  [ Supabase DB Webhook ] ── POST /webhook/comment ────────────► │
│  [ clone-listener.js   ]  ─────────────────────────────────►   │
│                                            │                     │
│                             ┌──────────────┘                     │
│                             ▼                                    │
│                   [ Redis Queue: "clone-reply" ]                 │
│                             │                                    │
│                             ▼  concurrency=1 (hemat RAM)         │
│                     [ clone-worker.js ]                          │
│                             │                                    │
│              ┌──────────────┼──────────────┐                     │
│              ▼              ▼              ▼                     │
│      Redis Cache       Supabase       OpenRouter                 │
│    (user/post 10-30m) (post+thread)  (persona reply)            │
│                             │                                    │
│                             ▼                                    │
│                    Supabase (insert comment, is_ai=true)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow Teknis

### A — AI Validator

1. **Listen** — `listener.js` memantau event `AdRequested` dan `SubscriptionRequested` dari smart contract
2. **Enqueue** — event di-push ke Redis queue `validation` (retry 3x, exponential backoff)
3. **Fetch** — `supabase.js` ambil teks iklan atau 10 postingan terakhir user
4. **AI Check** — `ai.js` kirim ke OpenRouter → `{ is_safe: bool, reason: string }`
5. **On-chain** — `operator.js` sign & broadcast tx ke 0G (gas ceiling 10 gwei)
6. **Sync** — hasil ditulis ke `ad_campaigns` atau `users` di Supabase

### B — AI Clone (Mode Turu)

1. **Webhook** — `clone-listener.js` terima `POST /webhook/comment` dari Supabase DB Webhook
2. **Enqueue** — payload minimal `{ post_id, comment_id, commenter_id }` masuk ke queue `clone-reply`
3. **Guard** — worker cek `is_turu = true` dan pastikan commenter bukan post owner (hindari self-reply loop)
4. **Fetch Context** — ambil post content (Redis cache), user persona (Redis cache), 5 komentar thread terbaru
5. **AI Reply** — `clone-ai.js` rakit prompt persona → OpenRouter → balasan max 1 kalimat
6. **Insert** — balasan disimpan ke tabel `comments` dengan `is_ai = true`

---

## Skema Database

Jalankan migration di Supabase SQL Editor atau via `supabase db push`.

### Kolom `users` (tambahan Mode Turu)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `is_turu` | `boolean` | Toggle auto-reply. Default `false` |
| `persona` | `text` | Deskripsi karakter user untuk prompt AI |
| `operator_wallet` | `text` | Alamat wallet untuk verifikasi on-chain |

### Kolom `ad_campaigns` & `users` (AI Validator)

| Kolom | Keterangan |
|---|---|
| `ai_status` | `pending` → `processing` → `approved` / `rejected` |
| `ai_report` | Alasan penolakan dari LLM |
| `tx_hash` | Bukti transaksi operator di blockchain |

### Kolom `comments` (AI Clone)

| Kolom | Keterangan |
|---|---|
| `is_ai` | `true` jika komentar dibuat oleh AI clone |

---

## Stack

| Komponen | Teknologi |
|---|---|
| Blockchain listener | ethers v6 (`contract.on`) |
| Webhook server | Node.js built-in `http` (0 deps tambahan) |
| Queue / job worker | BullMQ + Redis |
| Caching | ioredis (shared connection, TTL 10–30 menit) |
| Database | Supabase (service-role client) |
| AI moderasi & clone | OpenRouter — `google/gemini-2.0-flash-exp` |
| Runtime | Node.js 20, Docker Compose |

---

## Menjalankan

```bash
cp .env.example .env      # isi semua variabel (lihat komentar di .env.example)
docker compose up --build -d
docker compose logs -f ai-validator
```

Atau tanpa Docker (butuh Redis lokal):

```bash
npm install
node src/index.js
```

### Setup Supabase Database Webhook (untuk Mode Turu)

Di **Supabase Dashboard → Database → Webhooks → Create**:

| Field | Nilai |
|---|---|
| Table | `comments` |
| Event | `INSERT` |
| URL | `http://<server-ip>:3100/webhook/comment` |
| Header | `x-webhook-secret: <WEBHOOK_SECRET>` |

---

## Variabel Lingkungan

Lihat [.env.example](.env.example) untuk daftar lengkap. Wajib diisi:

| Variabel | Keterangan |
|---|---|
| `RPC_URL` | Endpoint RPC node 0G |
| `CONTRACT_ADDRESS` | Alamat smart contract StorageGatekeeper |
| `OPERATOR_PRIVATE_KEY` | Private key wallet operator (role `operator` di contract) |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key (bukan anon key) |
| `OPENROUTER_API_KEY` | API key OpenRouter |
| `WEBHOOK_SECRET` | Secret untuk validasi header webhook |

---

## Keamanan

- **Private key** disimpan di `.env` server, tidak pernah di-commit ke Git
- **Webhook secret** divalidasi via header `x-webhook-secret` di setiap request
- **Operator wallet** hanya berisi sedikit ETH untuk gas (0.05–0.1 ETH), top-up manual
- **Service-role key** hanya digunakan server-side, tidak pernah expose ke client
- **is_ai flag** mencegah AI membalas komentar AI lain (loop prevention)

