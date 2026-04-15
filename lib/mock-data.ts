import type { User, Post, Trend, Comment, Conversation } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    handle: "satoshi_web4",
    displayName: "Satoshi Nakamura",
    avatar: "",
    verified: true,
    walletAddress: "0x1a2b...3c4d",
    bio: "Building the decentralized future. Web4 maximalist.",
    followers: 12400,
    following: 340,
  },
  {
    id: "u2",
    handle: "aira_deai",
    displayName: "Aira Chen",
    avatar: "",
    verified: true,
    walletAddress: "0x5e6f...7g8h",
    bio: "DeAI researcher @ 0G Labs. Content authenticity advocate.",
    followers: 8900,
    following: 512,
  },
  {
    id: "u3",
    handle: "vara_builder",
    displayName: "VaraDev.eth",
    avatar: "",
    verified: false,
    walletAddress: "0x9i0j...1k2l",
    bio: "Open source contributor. Building on VaraSocial.",
    followers: 3200,
    following: 890,
  },
  {
    id: "u4",
    handle: "truthseeker99",
    displayName: "Maya Truth",
    avatar: "",
    verified: true,
    walletAddress: "0x3m4n...5o6p",
    bio: "Journalist. Fact-checker. Proven Truth early adopter.",
    followers: 21000,
    following: 180,
  },
  {
    id: "u5",
    handle: "crypto_creative",
    displayName: "Riku Tanaka",
    avatar: "",
    verified: false,
    walletAddress: "0x7q8r...9s0t",
    bio: "SocialFi creator. Earning $VARA daily.",
    followers: 5600,
    following: 720,
  },
  {
    id: "u6",
    handle: "zara_web3",
    displayName: "Zara Okonkwo",
    avatar: "",
    verified: true,
    walletAddress: "0xab12...cd34",
    bio: "Web3 product designer. Data portability advocate.",
    followers: 15300,
    following: 290,
  },
];

export const CURRENT_USER: User = MOCK_USERS[0];

function timeAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    author: MOCK_USERS[1],
    content:
      "Just deployed my first AI content filter on 0G Compute. The latency is surprisingly low — under 200ms for real-time feed curation. DeAI is finally ready for production. 🚀",
    timestamp: timeAgo(1),
    likes: 342,
    reposts: 89,
    replies: 23,
    truthScore: 92,
    truthLevel: "valid",
    viralityScore: 78,
    varaReward: 12.5,
  },
  {
    id: "p2",
    author: MOCK_USERS[3],
    content:
      "THREAD: I fact-checked the top 50 viral posts this week using Proven Truth. Results:\n\n🟢 62% verified true\n🟡 24% partially accurate\n🔴 14% outright false\n\nThe truth score system is working. Transparency matters.",
    timestamp: timeAgo(2),
    likes: 1203,
    reposts: 456,
    replies: 78,
    truthScore: 95,
    truthLevel: "valid",
    viralityScore: 94,
    varaReward: 45.2,
  },
  {
    id: "p3",
    author: MOCK_USERS[4],
    content:
      "Earned 230 $VARA this month just from my photography posts. SocialFlow's virality scoring actually rewards quality content, not just engagement bait. This is how creator monetization should work.",
    timestamp: timeAgo(3),
    likes: 567,
    reposts: 123,
    replies: 45,
    truthScore: 88,
    truthLevel: "valid",
    viralityScore: 82,
    varaReward: 8.3,
  },
  {
    id: "p4",
    author: MOCK_USERS[2],
    content:
      "New open-source connector for importing your Twitter data into VaraSocial is live! Your posts, followers, preferences — all portable via 0G Storage. Data freedom is here.\n\ngithub.com/varasocial/twitter-connector",
    timestamp: timeAgo(5),
    likes: 890,
    reposts: 234,
    replies: 56,
    truthScore: 85,
    truthLevel: "valid",
    viralityScore: 71,
    varaReward: 15.0,
  },
  {
    id: "p5",
    author: MOCK_USERS[5],
    content:
      "Hot take: Web4 isn't just about decentralization. It's about giving users the CHOICE of how their data is used. VaraSocial lets me pick my own AI algorithm for my feed. That's the real revolution.",
    timestamp: timeAgo(6),
    likes: 445,
    reposts: 167,
    replies: 89,
    truthScore: 72,
    truthLevel: "valid",
    viralityScore: 65,
  },
  {
    id: "p6",
    author: MOCK_USERS[0],
    content:
      "Mode Turu handled 47 collaboration requests while I was sleeping. Approved 3 brand deals, scheduled 12 posts across platforms, and sent me a morning summary. The future of creator automation is autonomous agents.",
    timestamp: timeAgo(8),
    likes: 678,
    reposts: 201,
    replies: 34,
    truthScore: 80,
    truthLevel: "valid",
    viralityScore: 76,
    varaReward: 22.1,
  },
  {
    id: "p7",
    author: MOCK_USERS[3],
    content:
      "⚠️ FLAGGED: A viral post claiming '0G Storage lost user data' has been debunked. Truth Score: 8/100. The original incident was a testnet issue from 6 months ago being recirculated as current news.",
    timestamp: timeAgo(10),
    likes: 2100,
    reposts: 890,
    replies: 156,
    truthScore: 8,
    truthLevel: "hoax",
    viralityScore: 91,
    varaReward: 30.0,
  },
  {
    id: "p8",
    author: MOCK_USERS[1],
    content:
      "Interesting experiment: I ran the same post through 3 different DeAI filters (DeepSeek, Llama, Mistral). Each gave different feed rankings. This is why user-controlled algorithms matter — no single AI should dictate what you see.",
    timestamp: timeAgo(12),
    likes: 334,
    reposts: 78,
    replies: 41,
    truthScore: 90,
    truthLevel: "valid",
    viralityScore: 58,
  },
  {
    id: "p9",
    author: MOCK_USERS[4],
    content:
      "Some people say creator tokens are just hype. My $VARA earnings this quarter say otherwise. Transparent smart contracts, no middleman, instant payouts. Show me another platform that does this.",
    timestamp: timeAgo(15),
    likes: 445,
    reposts: 112,
    replies: 67,
    truthScore: 55,
    truthLevel: "suspicious",
    viralityScore: 62,
    varaReward: 5.0,
  },
  {
    id: "p10",
    author: MOCK_USERS[5],
    content:
      "Just exported my entire social graph from VaraSocial and imported it into another Web4 app. Same followers, same content, same preferences. One wallet key. Zero vendor lock-in. This is data portability done right.",
    timestamp: timeAgo(18),
    likes: 923,
    reposts: 345,
    replies: 90,
    truthScore: 87,
    truthLevel: "valid",
    viralityScore: 85,
    varaReward: 18.7,
  },
  {
    id: "p11",
    author: MOCK_USERS[2],
    content:
      "PSA: If you're building on VaraSocial, check out the new JSON-LD data schema docs. Makes cross-platform data portability seamless. The identity/ and posts/ structures are elegant.",
    timestamp: timeAgo(22),
    likes: 189,
    reposts: 56,
    replies: 12,
    truthScore: 91,
    truthLevel: "valid",
    viralityScore: 42,
  },
  {
    id: "p12",
    author: MOCK_USERS[0],
    content:
      "Unpopular opinion: most 'decentralized' social platforms are still centralized where it matters — the algorithm. VaraSocial is the first platform where I genuinely control what AI curates my feed. That's the difference.",
    timestamp: timeAgo(24),
    likes: 756,
    reposts: 289,
    replies: 103,
    truthScore: 68,
    truthLevel: "suspicious",
    viralityScore: 73,
  },
  {
    id: "p13",
    author: MOCK_USERS[4],
    content:
      "Shot this at golden hour using my phone — the 0G IPFS gateway served this image to 12k people in under 80ms. Decentralized media delivery is real. 📸",
    media: [
      { type: "image", url: "https://picsum.photos/seed/vara1/800/450" },
    ],
    timestamp: timeAgo(3),
    likes: 891,
    reposts: 178,
    replies: 54,
    truthScore: 90,
    truthLevel: "valid",
    viralityScore: 83,
    varaReward: 14.8,
  },
  {
    id: "p14",
    author: MOCK_USERS[5],
    content:
      "Behind the scenes of our Web4 design sprint. Two days, six screens, zero central servers. 🎨",
    media: [
      { type: "image", url: "https://picsum.photos/seed/vara2/800/450" },
      { type: "image", url: "https://picsum.photos/seed/vara3/800/450" },
    ],
    timestamp: timeAgo(7),
    likes: 623,
    reposts: 105,
    replies: 38,
    truthScore: 88,
    truthLevel: "valid",
    viralityScore: 70,
    varaReward: 9.2,
  },
  {
    id: "p15",
    author: MOCK_USERS[1],
    content:
      "Demo of our real-time AI truth verification pipeline running on 0G Compute. Latency under 150ms end-to-end. Full walkthrough 👇",
    media: [
      {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ],
    timestamp: timeAgo(10),
    likes: 1450,
    reposts: 312,
    replies: 97,
    truthScore: 94,
    truthLevel: "valid",
    viralityScore: 89,
    varaReward: 38.5,
  },
];

export const MOCK_TRENDS: Trend[] = [
  { id: "t1", topic: "Web4", postCount: 12500, category: "Technology" },
  { id: "t2", topic: "0G Storage", postCount: 8900, category: "Blockchain" },
  {
    id: "t3",
    topic: "Data Portability",
    postCount: 6700,
    category: "Privacy",
  },
  { id: "t4", topic: "$VARA", postCount: 5400, category: "Crypto" },
  {
    id: "t5",
    topic: "DeAI Filtering",
    postCount: 4200,
    category: "AI",
  },
  {
    id: "t6",
    topic: "Proven Truth",
    postCount: 3800,
    category: "Fact-Check",
  },
  { id: "t7", topic: "Mode Turu", postCount: 2100, category: "Automation" },
];

export const SUGGESTED_FOLLOWS: User[] = [
  MOCK_USERS[2],
  MOCK_USERS[4],
  MOCK_USERS[5],
];

export const VARA_AI_USER: User = {
  id: "vara-ai",
  handle: "VaraAI",
  displayName: "VaraAI",
  avatar: "",
  verified: true,
  walletAddress: "0G-Compute",
  bio: "Decentralized AI analysis powered by 0G Compute.",
  followers: 0,
  following: 0,
};

function generateAIComment(post: Post): Comment {
  const truthLabel =
    post.truthLevel === "valid"
      ? "✅ Verified"
      : post.truthLevel === "suspicious"
        ? "⚠️ Suspicious"
        : "🚫 Hoax Detected";

  let analysis: string;
  if (post.truthLevel === "hoax") {
    analysis = `${truthLabel} — Truth Score: ${post.truthScore}/100\n\nThis post contains claims that have been debunked by multiple verified sources. The content appears to reference outdated or fabricated information. Exercise caution before sharing.\n\nVirality: ${post.viralityScore}/100 · Sources cross-referenced: 12`;
  } else if (post.truthLevel === "suspicious") {
    analysis = `${truthLabel} — Truth Score: ${post.truthScore}/100\n\nThis post contains partially verifiable claims. Some statements lack sufficient evidence or contain subjective assertions presented as facts. Recommend verifying key claims independently.\n\nVirality: ${post.viralityScore}/100 · Sources cross-referenced: 8`;
  } else {
    analysis = `${truthLabel} — Truth Score: ${post.truthScore}/100\n\nThis post's claims align with verified data from multiple decentralized sources. Content authenticity has been validated through 0G Compute cross-referencing.\n\nVirality: ${post.viralityScore}/100 · Sources cross-referenced: 15`;
  }

  return {
    id: `ai-${post.id}`,
    postId: post.id,
    author: VARA_AI_USER,
    content: analysis,
    timestamp: post.timestamp,
    likes: Math.floor(post.likes * 0.3),
    isAI: true,
  };
}

export const MOCK_COMMENTS: Comment[] = [
  // AI comments (one per post, generated)
  ...MOCK_POSTS.map(generateAIComment),
  // User comments
  {
    id: "c1",
    postId: "p1",
    author: MOCK_USERS[3],
    content: "200ms latency is impressive! What model are you running on 0G Compute?",
    timestamp: timeAgo(0.5),
    likes: 24,
  },
  {
    id: "c2",
    postId: "p1",
    author: MOCK_USERS[0],
    content: "This is the kind of performance we need for mainstream adoption. Great work Aira!",
    timestamp: timeAgo(0.8),
    likes: 18,
  },
  {
    id: "c3",
    postId: "p2",
    author: MOCK_USERS[1],
    content: "Really solid analysis. The 14% false rate is still concerning though — we need to improve detection.",
    timestamp: timeAgo(1.5),
    likes: 45,
  },
  {
    id: "c4",
    postId: "p2",
    author: MOCK_USERS[5],
    content: "Transparency like this is why I moved to VaraSocial. No other platform publishes these stats.",
    timestamp: timeAgo(1.8),
    likes: 33,
  },
  {
    id: "c5",
    postId: "p3",
    author: MOCK_USERS[2],
    content: "Congrats! The SocialFlow algorithm really does reward quality over spam.",
    timestamp: timeAgo(2.5),
    likes: 12,
  },
  {
    id: "c6",
    postId: "p4",
    author: MOCK_USERS[0],
    content: "Just tested the connector — imported 3 years of Twitter data in under 2 minutes. Incredible.",
    timestamp: timeAgo(4),
    likes: 67,
  },
  {
    id: "c7",
    postId: "p7",
    author: MOCK_USERS[5],
    content: "This is exactly why we need Proven Truth. Misinformation spreading unchecked is dangerous.",
    timestamp: timeAgo(9),
    likes: 89,
  },
  {
    id: "c8",
    postId: "p7",
    author: MOCK_USERS[2],
    content: "I almost shared the original post before checking the truth score. The badge system works.",
    timestamp: timeAgo(9.5),
    likes: 56,
  },
  {
    id: "c9",
    postId: "p5",
    author: MOCK_USERS[4],
    content: "Exactly! Choice is the keyword. Web4 is about sovereignty, not just decentralization.",
    timestamp: timeAgo(5.5),
    likes: 28,
  },
  {
    id: "c10",
    postId: "p6",
    author: MOCK_USERS[1],
    content: "Mode Turu is a game changer for creators. How do you configure the approval thresholds?",
    timestamp: timeAgo(7),
    likes: 15,
  },
  {
    id: "c11",
    postId: "p10",
    author: MOCK_USERS[3],
    content: "This is the dream. True data portability. No more platform lock-in.",
    timestamp: timeAgo(17),
    likes: 41,
  },
  {
    id: "c12",
    postId: "p12",
    author: MOCK_USERS[4],
    content: "Hard agree. The algorithm is where the real power lies, and users should control it.",
    timestamp: timeAgo(23),
    likes: 37,
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    userId: "u2",
    messages: [
      { id: "dm1", senderId: "u2", text: "Hey! Saw your post about Mode Turu. Impressive numbers!", timestamp: timeAgo(3) },
      { id: "dm2", senderId: "u1", text: "Thanks Aira! The agent handled everything while I slept 😴", timestamp: timeAgo(2.8) },
      { id: "dm3", senderId: "u2", text: "I'd love to integrate it with my DeAI filter. Want to collab?", timestamp: timeAgo(2.5) },
      { id: "dm4", senderId: "u1", text: "Absolutely! Let's set up a call this week.", timestamp: timeAgo(2) },
      { id: "dm5", senderId: "u2", text: "Sure, let's collab on the DeAI article!", timestamp: timeAgo(0.03) },
    ],
  },
  {
    userId: "u4",
    messages: [
      { id: "dm6", senderId: "u4", text: "Your truth score thread was amazing. Can I reference it in my article?", timestamp: timeAgo(5) },
      { id: "dm7", senderId: "u1", text: "Of course! Happy to help with fact-checking too.", timestamp: timeAgo(4.5) },
      { id: "dm8", senderId: "u4", text: "The truth score data is ready for review", timestamp: timeAgo(1) },
    ],
  },
  {
    userId: "u5",
    messages: [
      { id: "dm9", senderId: "u5", text: "How's your $VARA earnings this month?", timestamp: timeAgo(8) },
      { id: "dm10", senderId: "u1", text: "Pretty good! SocialFlow is paying out well for quality content.", timestamp: timeAgo(7) },
      { id: "dm11", senderId: "u5", text: "Got the $VARA payment. Thanks!", timestamp: timeAgo(3) },
    ],
  },
  {
    userId: "u6",
    messages: [
      { id: "dm12", senderId: "u6", text: "Hi! I'm interested in data portability features.", timestamp: timeAgo(10) },
      { id: "dm13", senderId: "u1", text: "It's the core of VaraSocial. What questions do you have?", timestamp: timeAgo(9) },
      { id: "dm14", senderId: "u6", text: "Would love to discuss data portability", timestamp: timeAgo(5) },
    ],
  },
  {
    userId: "u3",
    messages: [
      { id: "dm15", senderId: "u3", text: "The Twitter connector is live! Check it out.", timestamp: timeAgo(26) },
      { id: "dm16", senderId: "u1", text: "Just tested it — works great! Imported everything.", timestamp: timeAgo(25) },
      { id: "dm17", senderId: "u3", text: "New connector is deployed 🚀", timestamp: timeAgo(24) },
    ],
  },
];
