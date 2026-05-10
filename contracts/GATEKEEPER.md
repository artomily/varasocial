# StorageGatekeeper — Reference & Integration Guide

**Network:** 0G Chain Testnet (Galileo) — Chain ID `16602`  
**Contract:** `0xB76C9629C140A6eeFadd99f95DdFed95913629cd`  
**Explorer:** https://chainscan-galileo.0g.ai/address/0xB76C9629C140A6eeFadd99f95DdFed95913629cd

---

## Roles

| Role | Siapa | Kemampuan |
|---|---|---|
| `contractOwner` | Deployer / multisig | Rotasi operator & treasury, ubah harga subscription & iklan |
| `operator` | Server hot wallet (Node.js) | `setHashFor`, `processValidation`, `processAdValidation` |
| `user` | Wallet pengguna (browser) | Semua fungsi user + subscription + ad placement |

---

## Peta Fungsi — Dipanggil Dimana & Oleh Siapa

### Grup 1: Hash Management (Inti Gatekeeper)

#### `setHashFor(address user, bytes32 rootHash)`
- **Dipanggil oleh:** Server Node.js (Operator)
- **Kapan:** Setelah server selesai batch-upload data user ke 0G Storage dan mendapat `rootHash`
- **Node.js:**
```js
const tx = await contract.setHashFor(userWalletAddress, rootHashBytes32);
await tx.wait();
```

---

#### `setHash(bytes32 rootHash)`
- **Dipanggil oleh:** User langsung dari browser (jika sudah `claimOwnership`)
- **Kapan:** User self-manage datanya sendiri, upload sendiri ke 0G Storage
- **Browser (ethers v6 + MetaMask):**
```js
const tx = await contract.setHash(rootHashBytes32);
await tx.wait();
```

---

#### `getHash(address user) → bytes32`
- **Dipanggil oleh:** Server Node.js (untuk ambil hash lalu download dari 0G Storage)
- **Catatan:** `msg.sender` harus sama dengan `user` ATAU sudah di-`grantAccess`. Server perlu di-grant akses oleh user, atau rootHash disimpan juga di Supabase saat upload.
- **Node.js (eth_call, gratis):**
```js
// Operator harus sudah di-grantAccess oleh user
const hash = await contract.getHash(userWalletAddress, {
  from: operatorAddress
});
```

---

#### `hasHash(address user) → bool`
- **Dipanggil oleh:** Server atau frontend, siapa pun
- **Kapan:** Cek apakah user sudah pernah sync data ke 0G Storage
- **Node.js:**
```js
const exists = await contract.hasHash(userWalletAddress);
```

---

### Grup 2: Access Control (Whitelist Read)

#### `grantAccess(address reader)`
- **Dipanggil oleh:** User dari browser
- **Kapan:** User ingin memberi akses baca ke wallet lain (atau ke Operator agar server bisa `getHash`)
- **Browser:**
```js
const tx = await contract.grantAccess(readerWalletAddress);
await tx.wait();
```

---

#### `revokeAccess(address reader)`
- **Dipanggil oleh:** User dari browser
- **Kapan:** User ingin mencabut akses baca dari wallet tertentu
- **Browser:**
```js
const tx = await contract.revokeAccess(readerWalletAddress);
await tx.wait();
```

---

#### `hasReadAccess(address user, address reader) → bool`
- **Dipanggil oleh:** Server atau frontend, siapa pun (gratis)
- **Kapan:** Cek sebelum memanggil `getHash` agar tidak revert
- **Node.js:**
```js
const canRead = await contract.hasReadAccess(userWalletAddress, operatorAddress);
```

---

### Grup 3: Self-Management

#### `claimOwnership()`
- **Dipanggil oleh:** User dari browser
- **Kapan:** User ingin penuh mengontrol datanya — setelah ini server tidak bisa lagi panggil `setHashFor` untuk user ini
- **Browser:**
```js
const tx = await contract.claimOwnership();
await tx.wait();
```

---

#### `isSelfManaged(address user) → bool`
- **Dipanggil oleh:** Server atau frontend, siapa pun (gratis)
- **Kapan:** Server cek sebelum mencoba `setHashFor`, agar tidak buang gas sia-sia
- **Node.js:**
```js
const selfManaged = await contract.isSelfManaged(userWalletAddress);
if (!selfManaged) {
  await contract.setHashFor(userWalletAddress, rootHash);
}
```

---

### Grup 4: Escrow + AI Subscription Flow

> Sama polanya dengan Grup 5 (Iklan), bedanya ini untuk layanan premium/verifikasi akun.

#### `requestSubscription()` — payable
- **Dipanggil oleh:** User dari browser
- **Kapan:** User mendaftar layanan premium, ETH dikunci di kontrak (status: PENDING)
- **Browser:**
```js
const price = await contract.subscriptionPrice(); // dalam wei
const tx = await contract.requestSubscription({ value: price });
await tx.wait();
// Setelah ini, server akan mendengar event SubscriptionRequested
```

---

#### `processValidation(address user, bool approved)`
- **Dipanggil oleh:** Server Node.js (Operator), setelah AI selesai validasi
- **Kapan:** AI agent sudah memberi keputusan approve/reject
  - `true` → ETH dikirim ke `treasury`, status: COMPLETED
  - `false` → ETH dikembalikan ke `user`, status: REFUNDED
- **Node.js:**
```js
// Setelah AI validation selesai:
const approved = aiResult.score >= 80; // contoh threshold
const tx = await contract.processValidation(userWalletAddress, approved, {
  gasPrice: ethers.parseUnits("3", "gwei"),
});
await tx.wait();
```

---

#### `withdrawExpired()`
- **Dipanggil oleh:** User dari browser
- **Kapan:** Operator tidak merespons dalam 24 jam — user minta refund sendiri
- **Browser:**
```js
// Cek dulu apakah sudah expired
const req = await contract.requests(userWalletAddress);
const timeout = await contract.VALIDATION_TIMEOUT(); // 86400 detik
const expiredAt = req.requestedAt + timeout;
const now = BigInt(Math.floor(Date.now() / 1000));

if (req.status === 1n && now >= expiredAt) { // 1 = PENDING
  const tx = await contract.withdrawExpired();
  await tx.wait();
}
```

---

#### `requests(address user)` — public mapping
- **Dipanggil oleh:** Server atau frontend, siapa pun (gratis)
- **Return:** `{ amount, status, requestedAt }`
  - status: `0=NONE, 1=PENDING, 2=COMPLETED, 3=REFUNDED`
- **Node.js:**
```js
const req = await contract.requests(userWalletAddress);
console.log(req.amount, req.status, req.requestedAt);
```

---

### Grup 5: Ad Placement — Escrow + AI Content Moderation

> User upload konten iklan ke 0G Storage terlebih dahulu, lalu submit hash-nya ke kontrak bersama pembayaran. AI server menvalidasi konten (SARA, rasis, berbahaya) sebelum iklan dipasang.

#### `requestAdPlacement(bytes32 adRootHash)` — payable
- **Dipanggil oleh:** User dari browser
- **Kapan:** Setelah user upload konten iklan (gambar/video + caption) ke 0G Storage dan mendapat `adRootHash`
- **Browser:**
```js
// 1. Upload konten iklan ke 0G Storage terlebih dahulu
const adRootHash = await uploadToZeroGStorage(adFile);

// 2. Submit ke kontrak
const price = await contract.adPrice();
const tx = await contract.requestAdPlacement(adRootHash, { value: price });
await tx.wait();
// Server akan mendengar event AdRequested dan mulai validasi AI
```

---

#### `processAdValidation(address user, bool approved)`
- **Dipanggil oleh:** Server Node.js (Operator), setelah AI selesai moderasi konten
- **Kapan:** AI agent sudah memutuskan konten iklan aman atau tidak
  - `true` → ETH ke `treasury`, status: COMPLETED (iklan ditayangkan)
  - `false` → ETH dikembalikan ke `user`, status: REFUNDED (iklan ditolak)
- **Node.js:**
```js
// Setelah AI content moderation selesai:
const approved = !aiResult.containsHateSpeech && !aiResult.isSARA;
const tx = await contract.processAdValidation(userWalletAddress, approved, {
  gasPrice: ethers.parseUnits("3", "gwei"),
});
await tx.wait();
```

---

#### `withdrawExpiredAd()`
- **Dipanggil oleh:** User dari browser
- **Kapan:** Operator tidak merespons dalam 24 jam — user minta refund sendiri
- **Browser:**
```js
const req = await contract.adRequests(userWalletAddress);
const timeout = await contract.VALIDATION_TIMEOUT();
const now = BigInt(Math.floor(Date.now() / 1000));

if (req.status === 1n && now >= req.requestedAt + timeout) { // 1 = PENDING
  const tx = await contract.withdrawExpiredAd();
  await tx.wait();
}
```

---

#### `adRequests(address user)` — public mapping
- **Dipanggil oleh:** Server atau frontend, siapa pun (gratis)
- **Return:** `{ adRootHash, amount, status, requestedAt }`
  - status: `0=NONE, 1=PENDING, 2=COMPLETED, 3=REFUNDED`
- **Node.js:**
```js
const req = await contract.adRequests(userWalletAddress);
console.log(req.adRootHash, req.amount, req.status, req.requestedAt);
```

---

### Grup 6: Admin (contractOwner saja)

#### `setOperator(address newOperator)`
- **Dipanggil oleh:** contractOwner (CLI / aman dari multisig)
- **Kapan:** Rotasi hot wallet jika kunci server bocor
```bash
cast send $ADDR "setOperator(address)" 0xNewOperator \
  --rpc-url $RPC --private-key $OWNER_PK --legacy
```

---

#### `setTreasury(address newTreasury)`
- **Dipanggil oleh:** contractOwner
- **Kapan:** Pindah treasury ke multisig baru
```bash
cast send $ADDR "setTreasury(address)" 0xNewTreasury \
  --rpc-url $RPC --private-key $OWNER_PK --legacy
```

---

#### `setSubscriptionPrice(uint256 newPrice)`
- **Dipanggil oleh:** contractOwner
- **Kapan:** Ubah harga langganan
```bash
cast send $ADDR "setSubscriptionPrice(uint256)" 50000000000000000 \
  --rpc-url $RPC --private-key $OWNER_PK --legacy
# 50000000000000000 wei = 0.05 ETH
```

---

#### `setAdPrice(uint256 newPrice)`
- **Dipanggil oleh:** contractOwner
- **Kapan:** Ubah harga pasang iklan
```bash
cast send $ADDR "setAdPrice(uint256)" 10000000000000000 \
  --rpc-url $RPC --private-key $OWNER_PK --legacy
# 10000000000000000 wei = 0.01 ETH
```

---

#### `transferContractOwnership(address newOwner)`
- **Dipanggil oleh:** contractOwner
- **Kapan:** Serahkan ownership ke multisig setelah setup selesai
```bash
cast send $ADDR "transferContractOwnership(address)" 0xMultisig \
  --rpc-url $RPC --private-key $OWNER_PK --legacy
```

---

## ABI Lengkap (untuk Node.js)

```js
const ABI = [
  // Hash management
  "function setHashFor(address user, bytes32 rootHash) external",
  "function setHash(bytes32 rootHash) external",
  "function getHash(address user) external view returns (bytes32)",
  "function hasHash(address user) external view returns (bool)",
  // Access control
  "function grantAccess(address reader) external",
  "function revokeAccess(address reader) external",
  "function hasReadAccess(address user, address reader) external view returns (bool)",
  // Self-management
  "function claimOwnership() external",
  "function isSelfManaged(address user) external view returns (bool)",
  // Subscription / escrow
  "function requestSubscription() external payable",
  "function processValidation(address user, bool approved) external",
  "function withdrawExpired() external",
  "function requests(address) external view returns (uint256 amount, uint8 status, uint256 requestedAt)",
  "function subscriptionPrice() external view returns (uint256)",
  // Ad placement / escrow
  "function requestAdPlacement(bytes32 adRootHash) external payable",
  "function processAdValidation(address user, bool approved) external",
  "function withdrawExpiredAd() external",
  "function adRequests(address) external view returns (bytes32 adRootHash, uint256 amount, uint8 status, uint256 requestedAt)",
  "function adPrice() external view returns (uint256)",
  "function VALIDATION_TIMEOUT() external view returns (uint256)",
  // Admin
  "function setOperator(address newOperator) external",
  "function setTreasury(address newTreasury) external",
  "function setSubscriptionPrice(uint256 newPrice) external",
  "function setAdPrice(uint256 newPrice) external",
  "function transferContractOwnership(address newOwner) external",
  "function contractOwner() external view returns (address)",
  "function operator() external view returns (address)",
  "function treasury() external view returns (address)",
  // Events
  "event HashUpdated(address indexed user, bytes32 indexed newHash, uint256 updatedAt)",
  "event SubscriptionRequested(address indexed user, uint256 amount)",
  "event SubscriptionValidated(address indexed user, bool approved)",
  "event SubscriptionExpiredWithdrawn(address indexed user, uint256 amount)",
  "event AdRequested(address indexed user, bytes32 indexed adRootHash, uint256 amount)",
  "event AdValidated(address indexed user, bool approved)",
  "event AdExpiredWithdrawn(address indexed user, uint256 amount)",
];
```

---

## Setup Server Node.js (Boilerplate)

```js
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const operatorWallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, operatorWallet);

// === Subscription validation listener ===
contract.on("SubscriptionRequested", async (user, amount) => {
  console.log(`[Subscription] New request from ${user}, amount: ${ethers.formatEther(amount)} ETH`);
  
  // 1. Ambil rootHash dari Supabase (lebih andal daripada getHash on-chain)
  const rootHash = await getRootHashFromSupabase(user);

  // 2. Download data dari 0G Storage
  const data = await downloadFromZeroGStorage(rootHash);

  // 3. Validasi dengan AI
  const approved = await validateWithAI(data);

  // 4. Panggil kontrak
  const tx = await contract.processValidation(user, approved, {
    gasPrice: ethers.parseUnits("3", "gwei"),
  });
  await tx.wait();
  console.log(`processValidation(${user}, ${approved}) → ${tx.hash}`);
});

// === Ad content moderation listener ===
contract.on("AdRequested", async (user, adRootHash, amount) => {
  console.log(`[Ad] New request from ${user}, adRootHash: ${adRootHash}`);

  // 1. Download konten iklan dari 0G Storage pakai adRootHash
  const adContent = await downloadFromZeroGStorage(adRootHash);

  // 2. AI content moderation — cek SARA, rasis, kekerasan, dll
  const moderationResult = await moderateAdContent(adContent);
  const approved = !moderationResult.containsHateSpeech
    && !moderationResult.isSARA
    && !moderationResult.isViolent;

  // 3. Panggil kontrak
  const tx = await contract.processAdValidation(user, approved, {
    gasPrice: ethers.parseUnits("3", "gwei"),
  });
  await tx.wait();
  console.log(`processAdValidation(${user}, ${approved}) → ${tx.hash}`);
});
```

---

## Alur End-to-End

### Subscription (Verifikasi / Premium)
```
[Browser] requestSubscription() + ETH
          │
          ▼ emit SubscriptionRequested
[Server]  listener menangkap event
          │
          ├─ ambil rootHash (Supabase / getHash)
          ├─ download dari 0G Storage
          ├─ validasi AI (konten akun)
          │
          ├─ approved → processValidation(user, true)  → ETH ke treasury
          └─ rejected → processValidation(user, false) → ETH refund ke user

[Browser] Jika server tidak respons > 24 jam:
          withdrawExpired() → ETH kembali ke user
```

### Ad Placement (Iklan)
```
[Browser] upload konten iklan ke 0G Storage → dapat adRootHash
          │
          ▼
[Browser] requestAdPlacement(adRootHash) + ETH
          │
          ▼ emit AdRequested
[Server]  listener menangkap event
          │
          ├─ download konten iklan dari 0G Storage pakai adRootHash
          ├─ AI content moderation (SARA, rasis, kekerasan, dll)
          │
          ├─ aman    → processAdValidation(user, true)  → ETH ke treasury, iklan ditayangkan
          └─ berbaya → processAdValidation(user, false) → ETH refund ke user, iklan ditolak

[Browser] Jika server tidak respons > 24 jam:
          withdrawExpiredAd() → ETH kembali ke user
```
