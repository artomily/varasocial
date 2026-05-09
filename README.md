# VaraSocial

Web4 social platform powered by [0G Decentralized Storage](https://0g.ai), Vara Network token rewards ($VARA), and AI-driven truth scoring. Built with Next.js 16, Supabase, and RainbowKit.

---

## Features

| Feature | Status |
|---------|--------|
| Post feed (For You / Following / Truth Verified tabs) | ✅ Done |
| Compose posts with optimistic updates | ✅ Done |
| Like, repost, bookmark | ✅ Done |
| User profiles | ✅ Done |
| AI Truth Score badge on every post | ⚠️ Random placeholder — needs AI API |
| Virality Score | ✅ Done (mock) |
| $VARA reward display | ⚠️ Mock — needs Vara contract |
| Wallet connect (RainbowKit) | ⚠️ Needs WalletConnect project ID |
| Direct messages | ⚠️ Local state — needs Supabase Realtime |
| Notifications | ⚠️ Mock — needs Supabase Realtime |
| 0G decentralized media storage | 🔴 Not started |
| SocialFlow page | 🔲 Empty |
| AI Filter page | 🔲 Empty |
| Proven Truth page | 🔲 Empty |
| Mode Turu page | 🔲 Empty |
| Monetize / $VARA earnings dashboard | 🔲 Empty |

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in required values
npx supabase db push          # apply DB migrations
npx tsx scripts/seed.ts       # seed demo user + posts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `NEXT_PUBLIC_DEMO_EMAIL` | ✅ | Seed user email (auto-login) |
| `NEXT_PUBLIC_DEMO_PASSWORD` | ✅ | Seed user password |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ⚠️ | [cloud.walletconnect.com](https://cloud.walletconnect.com) project ID |
| `NEXT_PUBLIC_0G_RPC_URL` | 🔴 | 0G Storage node RPC endpoint |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | 🔴 | AI truth scoring |
| `NEXT_PUBLIC_VARA_RPC_URL` | 🔴 | Vara Network RPC (wss://rpc.vara.network) |
| `NEXT_PUBLIC_VARA_CONTRACT_ADDRESS` | 🔴 | $VARA reward contract address |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Database & Auth:** Supabase (PostgreSQL + RLS)
- **Wallet:** RainbowKit + Wagmi + viem
- **State:** React Context + `useCallback` (no external state lib)
- **Icons:** lucide-react

---

## Integration Roadmap

See [plan.md](./plan.md) for the full integration checklist with step-by-step instructions for:

1. Supabase (auth + database) — ✅ done, needs env vars
2. RainbowKit + Wagmi (wallet connect) — ⚠️ needs WalletConnect project ID
3. 0G Storage (decentralized media) — 🔴 not started
4. Vara Network ($VARA token rewards) — 🔴 not started
5. AI Truth Scoring API — 🔴 not started
6. Supabase Realtime (live feed, DMs, notifications) — 🔴 not started

---

## Project Structure

```
app/
  (main)/         # All authenticated routes (Sidebar + RightPanel layout)
    page.tsx      # Home feed
    explore/      # Search & discovery
    profile/      # Current user profile
    user/[handle] # Public user profiles
    post/[id]     # Single post + comments
    messages/     # DMs
    notifications/
    bookmarks/
    socialflow/   # 🔲 Viral trends graph
    ai-filter/    # 🔲 Feed filter by AI tags
    proven-truth/ # 🔲 Truth-verified feed
    mode-turu/    # 🔲 Scheduled post queue
    monetize/     # 🔲 $VARA earnings dashboard
    settings/
components/
  feed/           # Feed, PostCard, ComposeBox
  layout/         # Sidebar, RightPanel, MobileNav
  common/         # Avatar, Logo, TruthBadge, VaraReward, ViralityScore, WalletButton
lib/
  store.tsx       # Global React context (state + actions)
  supabase.ts     # Supabase client
  supabase-queries.ts # DB query helpers
  types.ts        # TypeScript interfaces
  constants.ts    # Nav items, brand config
  mock-data.ts    # Fallback data when Supabase unavailable
supabase/
  migrations/     # 7 SQL migration files
scripts/
  seed.ts         # Seeds demo user + sample posts
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Profiles: handle, displayName, avatar, walletAddress, bio, verified |
| `posts` | Content: authorId, content, media, truthScore, truthLevel, viralityScore, varaReward |
| `likes` | userId × postId join |
| `reposts` | userId × postId join |
| `comments` | postId, authorId, content |
| `messages` | senderId, receiverId, text |
| `notifications` | type (like/repost/reply/follow/reward), actorId, targetUserId, postId |
| `monetization` | userId, earnings, payouts |
