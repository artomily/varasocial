/**
 * Seed script — inserts users + posts via service role key
 * Run: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hoursAgo(h: number) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

const USERS = [
  { id: "00000000-0000-0000-0000-000000000001", email: process.env.NEXT_PUBLIC_DEMO_EMAIL || "satoshi@varasocial.dev", handle: "satoshi_web4", display_name: "Satoshi Nakamura", bio: "Building the decentralized future. Web4 maximalist.", wallet_address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", verified: true, followers: 12400, following: 340 },
  { id: "00000000-0000-0000-0000-000000000002", email: "aira@varasocial.dev", handle: "aira_deai", display_name: "Aira Chen", bio: "DeAI researcher @ 0G Labs. Content authenticity advocate.", wallet_address: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4", verified: true, followers: 8900, following: 512 },
  { id: "00000000-0000-0000-0000-000000000003", email: "varabuilder@varasocial.dev", handle: "vara_builder", display_name: "VaraDev.eth", bio: "Open source contributor. Building on VaraSocial.", wallet_address: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7", verified: false, followers: 3200, following: 890 },
  { id: "00000000-0000-0000-0000-000000000004", email: "maya@varasocial.dev", handle: "truthseeker99", display_name: "Maya Truth", bio: "Journalist. Fact-checker. Proven Truth early adopter.", wallet_address: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2", verified: true, followers: 21000, following: 180 },
  { id: "00000000-0000-0000-0000-000000000005", email: "riku@varasocial.dev", handle: "crypto_creative", display_name: "Riku Tanaka", bio: "SocialFi creator. Earning $VARA daily.", wallet_address: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6", verified: false, followers: 5600, following: 720 },
  { id: "00000000-0000-0000-0000-000000000006", email: "zara@varasocial.dev", handle: "zara_web3", display_name: "Zara Okonkwo", bio: "Web3 product designer. Data portability advocate.", wallet_address: "0xab12cd34ef56ab78cd90ef12ab34cd56ef78ab90", verified: true, followers: 15300, following: 290 },
];

const POSTS = [
  { author_id: USERS[1].id, content: "Just deployed my first AI content filter on 0G Compute. The latency is surprisingly low — under 200ms for real-time feed curation. DeAI is finally ready for production. 🚀", created_at: hoursAgo(1), truth_score: 92, truth_level: "valid", virality_score: 78, vara_reward: 12.5, likes_count: 342, reposts_count: 89, replies_count: 23 },
  { author_id: USERS[3].id, content: "THREAD: I fact-checked the top 50 viral posts this week using Proven Truth. Results:\n\n🟢 62% verified true\n🟡 24% partially accurate\n🔴 14% outright false\n\nThe truth score system is working. Transparency matters.", created_at: hoursAgo(2), truth_score: 95, truth_level: "valid", virality_score: 94, vara_reward: 45.2, likes_count: 1203, reposts_count: 456, replies_count: 78 },
  { author_id: USERS[4].id, content: "Earned 230 $VARA this month just from my photography posts. SocialFlow's virality scoring actually rewards quality content, not just engagement bait. This is how creator monetization should work.", created_at: hoursAgo(3), truth_score: 88, truth_level: "valid", virality_score: 82, vara_reward: 8.3, likes_count: 567, reposts_count: 123, replies_count: 45 },
  { author_id: USERS[2].id, content: "New open-source connector for importing your Twitter data into VaraSocial is live! Your posts, followers, preferences — all portable via 0G Storage. Data freedom is here.", created_at: hoursAgo(5), truth_score: 85, truth_level: "valid", virality_score: 71, vara_reward: 15.0, likes_count: 890, reposts_count: 234, replies_count: 56 },
  { author_id: USERS[5].id, content: "Hot take: Web4 isn't just about decentralization. It's about giving users the CHOICE of how their data is used. VaraSocial lets me pick my own AI algorithm for my feed. That's the real revolution.", created_at: hoursAgo(6), truth_score: 72, truth_level: "valid", virality_score: 65, vara_reward: null, likes_count: 445, reposts_count: 167, replies_count: 89 },
  { author_id: USERS[0].id, content: "Mode Turu handled 47 collaboration requests while I was sleeping. Approved 3 brand deals, scheduled 12 posts across platforms, and sent me a morning summary. The future of creator automation is autonomous agents.", created_at: hoursAgo(8), truth_score: 80, truth_level: "valid", virality_score: 76, vara_reward: 22.1, likes_count: 678, reposts_count: 201, replies_count: 34 },
  { author_id: USERS[3].id, content: "⚠️ FLAGGED: A viral post claiming '0G Storage lost user data' has been debunked. Truth Score: 8/100. The original incident was a testnet issue from 6 months ago being recirculated as current news.", created_at: hoursAgo(10), truth_score: 8, truth_level: "hoax", virality_score: 91, vara_reward: 30.0, likes_count: 2100, reposts_count: 890, replies_count: 156 },
  { author_id: USERS[1].id, content: "Interesting experiment: I ran the same post through 3 different DeAI filters (DeepSeek, Llama, Mistral). Each gave different rankings. This is why user-controlled algorithms matter — no single AI should dictate what you see.", created_at: hoursAgo(12), truth_score: 90, truth_level: "valid", virality_score: 58, vara_reward: null, likes_count: 334, reposts_count: 78, replies_count: 41 },
  { author_id: USERS[4].id, content: "Some people say creator tokens are just hype. My $VARA earnings this quarter say otherwise. Transparent smart contracts, no middleman, instant payouts. Show me another platform that does this.", created_at: hoursAgo(15), truth_score: 55, truth_level: "suspicious", virality_score: 62, vara_reward: 5.0, likes_count: 445, reposts_count: 112, replies_count: 67 },
  { author_id: USERS[5].id, content: "Just exported my entire social graph from VaraSocial and imported it into another Web4 app. Same followers, same content, same preferences. One wallet key. Zero vendor lock-in. This is data portability done right.", created_at: hoursAgo(18), truth_score: 87, truth_level: "valid", virality_score: 85, vara_reward: 18.7, likes_count: 923, reposts_count: 345, replies_count: 90 },
  { author_id: USERS[4].id, content: "Shot this at golden hour using my phone — the 0G IPFS gateway served this image to 12k people in under 80ms. Decentralized media delivery is real. 📸", media: [{ type: "image", url: "https://picsum.photos/seed/vara1/800/450" }], created_at: hoursAgo(3), truth_score: 90, truth_level: "valid", virality_score: 83, vara_reward: 14.8, likes_count: 891, reposts_count: 178, replies_count: 54 },
  { author_id: USERS[5].id, content: "Behind the scenes of our Web4 design sprint. Two days, six screens, zero central servers. 🎨", media: [{ type: "image", url: "https://picsum.photos/seed/vara2/800/450" }, { type: "image", url: "https://picsum.photos/seed/vara3/800/450" }], created_at: hoursAgo(7), truth_score: 88, truth_level: "valid", virality_score: 70, vara_reward: 9.2, likes_count: 623, reposts_count: 105, replies_count: 38 },
];

async function main() {
  console.log("🌱 Seeding VaraSocial...\n");

  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Seed123!@#";

  // Step 1: Create auth users  
  console.log("🔑 Creating auth users...");  
  for (const u of USERS) {
    process.stdout.write(`  → ${u.handle}... `);
    const { error } = await supabase.auth.admin.createUser({
      user_metadata: { handle: u.handle },
      email: u.email,
      password: demoPassword,
      email_confirm: true,
    });
    
    if (error) {
      if (error.message.toLowerCase().includes("already been registered")) {
        console.log("already exists");
      } else {
        console.log(`⚠ ${error.message}`);
      }
    } else {
      console.log("✓");
    }
  }

  // Step 2: Fetch all auth users and map by email
  console.log("\n🔍 Fetching auth users...");
  const { data: allAuthUsers, error: listErr } = await supabase.auth.admin.listUsers();
  
  if (listErr || !allAuthUsers?.users) {
    console.error("⚠ Could not fetch auth users:", listErr?.message);
    process.exit(1);
  }

  const authUserIds: Record<string, string> = {};
  for (const authUser of allAuthUsers.users) {
    const handle = authUser.user_metadata?.handle as string | undefined;
    if (handle && authUser.id) {
      authUserIds[authUser.email!] = authUser.id;
    }
  }
  console.log(`  ✓ Found ${Object.keys(authUserIds).length} auth users`);

  // Step 3: Upsert profile rows into public.users
  console.log("\n👤 Upserting public.users...");
  for (const u of USERS) {
    process.stdout.write(`  → ${u.handle}... `);
    const authId = authUserIds[u.email];
    
    if (!authId) {
      console.log("⚠ auth user not found");
      continue;
    }

    const { id, email, ...profile } = u; // eslint-disable-line @typescript-eslint/no-unused-vars
    const { error } = await supabase.from("users").upsert(
      { id: authId, ...profile },
      { onConflict: "id" }
    );
    console.log(error ? `⚠ ${error.message}` : "✓");
  }

  // Step 4: Insert posts (update author_id references to auth IDs)
  console.log("\n📝 Creating posts...");
  let count = 0;
  for (const p of POSTS) {
    // Find the original user for this post and get their auth ID
    const originalUser = USERS.find(u => u.id === p.author_id);
    const authorId = originalUser ? authUserIds[originalUser.email] : p.author_id;
    
    const preview = p.content.slice(0, 55).replace(/\n/g, " ");
    process.stdout.write(`  → "${preview}..."  `);
    const { error } = await supabase.from("posts").insert({ ...p, author_id: authorId });
    if (error) {
      console.log(`⚠ ${error.message}`);
    } else {
      console.log("✓");
      count++;
    }
  }

  console.log(`\n✅ Done! Seeded ${USERS.length} users + ${count} posts.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
