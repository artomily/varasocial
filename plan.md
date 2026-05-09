# VaraSocial — Integration Plan

This document lists every integration needed to ship VaraSocial as a production-ready Web4 social platform, tracks what is already done, and specifies exactly what each remaining integration requires.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Integrated and working |
| ⚠️ | Partially integrated — needs config or env var |
| 🔴 | Not yet started |
| 🔲 | UI page exists but is empty / mock-only |

---

## Integrations

### 1. Supabase — Auth + Database ✅

**What it does:** Stores users, posts, likes, reposts, comments, messages, notifications, and monetization data. Handles email/password auth for the demo seed account.

**Already done:**
- `lib/supabase.ts` — client initialised with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `lib/supabase-queries.ts` — `fetchPosts`, `fetchUserById`, `fetchUserLikes`, `fetchUserReposts`, `insertPost`, `insertComment`, `upsertLike`, `deleteLike`, `upsertRepost`, `deleteRepost`
- `lib/store.tsx` — bootstraps with `supabase.auth.signInWithPassword` using demo credentials; falls back to mock data when unavailable
- `supabase/migrations/` — 7 migration files covering all tables

**Still needed:**
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD` in `.env.local`
- Run `supabase db push` or apply migrations to your Supabase project
- Run `npx tsx scripts/seed.ts` to populate the demo user and sample posts

---

### 2. RainbowKit + Wagmi — Wallet Connect ⚠️

**What it does:** Lets users connect an EVM wallet (MetaMask, Coinbase Wallet, WalletConnect) to link their on-chain identity to their VaraSocial profile.

**Already done:**
- `lib/wagmi-config.ts` — configures chains + WalletConnect transport
- `app/providers.tsx` — wraps app in `WagmiProvider` + `RainbowKitProvider`
- `components/common/WalletButton.tsx` — renders `<ConnectButton>` or a disabled fallback

**Still needed:**
- Create a project at [cloud.walletconnect.com](https://cloud.walletconnect.com) and copy the Project ID
- Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`
- The button is currently disabled/greyed out without this key

---

### 3. 0G Storage — Decentralised Media Storage 🔴

**What it does:** Stores post media (images/videos) on [0G Storage](https://0g.ai) instead of centralised servers, fulfilling the "Web4" / "Powered by 0G Storage" claim in the footer.

**Not yet done:** SDK not installed, no calls anywhere in the codebase. Only referenced in footer text and `app/layout.tsx` metadata description.

**Integration steps:**
1. `npm install @0glabs/0g-ts-sdk`
2. Add `NEXT_PUBLIC_0G_RPC_URL` (0G Storage node endpoint) to `.env.local`
3. Create `lib/0g-storage.ts` — wrapper for `uploadFile` / `downloadFile`
4. Update `components/feed/ComposeBox.tsx` — upload selected media to 0G on post submit, store returned content hash in `post.media[].url`
5. Update `components/feed/PostCard.tsx` — resolve content hashes back to URLs via 0G gateway for render

**Reference:** [0G TS SDK docs](https://docs.0g.ai/build-with-0g/storage-sdk/ts-client)

---

### 4. Vara Network ($VARA) — Token Rewards 🔴

**What it does:** Distributes `$VARA` token rewards to creators whose posts score high on truth + virality. The `varaReward` field exists in `Post` type and the `VaraReward` component renders the amount, but no on-chain calls are made.

**Not yet done:** No `@gear-js/api` package installed, no contract address, no wallet signing flow.

**Integration steps:**
1. `npm install @gear-js/api @gear-js/react-hooks`
2. Set `NEXT_PUBLIC_VARA_CONTRACT_ADDRESS` and `NEXT_PUBLIC_VARA_RPC_URL` in `.env.local`
3. Create `lib/vara-reward.ts` — wraps Gear API message send to the reward contract
4. In `lib/store.tsx` → `addPost`: after a post is persisted, if `truthScore >= 80 && viralityScore >= 60`, trigger `distributeReward(postId, authorWalletAddress, amount)`
5. Update `app/(main)/monetize/page.tsx` — show earned rewards, claim history, and a "Claim" button that calls the contract

**Reference:** [Gear Protocol JS API](https://wiki.gear-tech.io/docs/api/getting-started)

---

### 5. AI Truth Scoring API 🔴

**What it does:** Analyses each new post's content and returns a `truthScore` (0–100) and `truthLevel` (`valid` | `suspicious` | `hoax`) using an LLM. Currently these values are randomly generated in `store.tsx → addPost`.

**Not yet done:** No API route, no LLM call. `truthScore: Math.floor(Math.random() * 30) + 70` is a placeholder.

**Integration steps:**
1. Set `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env.local`
2. Create `app/api/truth-score/route.ts`:
   ```ts
   POST { content: string }
   → { score: number; level: "valid" | "suspicious" | "hoax"; explanation: string }
   ```
   Prompt the LLM: given the post content, rate its factual plausibility 0–100. Map score to level: `>=70 valid`, `40–69 suspicious`, `<40 hoax`.
3. In `lib/store.tsx → addPost`: after optimistic insert, call `/api/truth-score` and update the post with real values via `setPosts`
4. In `supabase-queries.ts → insertPost`: accept optional `truthScore` + `truthLevel` params and persist to DB

---

### 6. Supabase Realtime — Live Feed, DMs, Notifications 🔴

**What it does:** Pushes new posts, direct messages, and notification events to connected clients without polling. Currently all three are local state only.

**Not yet done:** No Supabase Realtime channels subscribed anywhere.

**Integration steps:**

**Feed (new posts from other users):**
```ts
supabase.channel('posts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
  setPosts(prev => [mapDbPost(payload.new), ...prev]);
}).subscribe();
```

**Direct messages:**
```ts
supabase.channel(`dm:${currentUser.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler).subscribe();
```

**Notifications:**
```ts
supabase.channel(`notif:${currentUser.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handler).subscribe();
```

Add subscription setup + cleanup (`return () => supabase.removeAllChannels()`) inside the `useEffect` in `lib/store.tsx`.

---

## Placeholder Pages

These routes exist but render empty or stub content. Implementation is tracked separately.

| Route | Status | Notes |
|-------|--------|-------|
| `/socialflow` | 🔲 Empty | Trending topics / viral post graph |
| `/ai-filter` | 🔲 Empty | Filter feed by truth level, topic, AI tags |
| `/proven-truth` | 🔲 Empty | Feed of posts with `truthLevel === "valid"` |
| `/mode-turu` | 🔲 Empty | "Sleep mode" / scheduled posting queue |
| `/monetize` | 🔲 Empty | $VARA earnings dashboard + claim flow |
| `/notifications` | 🔲 Mock data | Wire to Supabase Realtime (see §6) |
| `/messages` | 🔲 Local state | Wire to Supabase Realtime (see §6) |
| `/bookmarks` | 🔲 Local state | Persist bookmarks to Supabase `bookmarks` table |
| `/explore` | ⚠️ Partial | Search UI present, no full-text search backend |

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Demo seed account (required for auto-login)
NEXT_PUBLIC_DEMO_EMAIL=demo@varasocial.xyz
NEXT_PUBLIC_DEMO_PASSWORD=yourpassword

# WalletConnect (required for wallet connect button)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# 0G Storage (needed for §3)
NEXT_PUBLIC_0G_RPC_URL=https://rpc.0g.ai

# AI Truth Scoring (needed for §5)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# Vara Network (needed for §4)
NEXT_PUBLIC_VARA_RPC_URL=wss://rpc.vara.network
NEXT_PUBLIC_VARA_CONTRACT_ADDRESS=0x...
```

---

## Local Setup

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local   # fill in values above

# 3. Apply DB migrations
npx supabase db push

# 4. Seed demo data
npx tsx scripts/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Priority Order

1. **Supabase** env vars + seed (unlocks real data immediately)
2. **WalletConnect** project ID (unblocks wallet connect button)
3. **AI Truth Scoring** (core differentiator from Twitter — replace random scores)
4. **Supabase Realtime** (makes the platform feel live)
5. **0G Storage** (fulfils the Web4 / decentralised storage promise)
6. **Vara Network** (completes the tokenomics loop)
