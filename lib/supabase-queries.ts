import { supabase } from "./supabase";
import type {
  AdCampaign,
  MediaItem,
  Post,
  PostStorageRoute,
  SubscriptionPlan,
  User,
  UserAdPreference,
  UserSubscription,
  Comment,
  TruthLevel,
} from "./types";

// ─── DB row types ────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  wallet_address: string;
  bio: string | null;
  wallet_connected_at: string | null;
  username_set_at: string | null;
};

type PostRow = {
  id: string;
  author_id: string;
  content: string;
  media: MediaItem[] | null;
  created_at: string;
  truth_score: number;
  truth_level: string;
  virality_score: number;
  vara_reward: number | null;
  likes_count: number;
  reposts_count: number;
  replies_count: number;
  route_hash: string | null;
  users: UserRow;
};

type SubscriptionPlanRow = {
  id: string;
  slug: string;
  title: string;
  price: string;
  billing_cycle: string;
  benefits: string[];
  featured: boolean;
  active: boolean;
};

type UserSubscriptionRow = {
  user_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

type UserAdPreferenceRow = {
  user_id: string;
  hide_ads: boolean;
  filter_ai_ads: boolean;
  sponsored_feed_interval: number;
};

type AdCampaignRow = {
  id: string;
  owner_id: string;
  title: string;
  objective: string;
  budget: string;
  placements: string[];
  status: string;
  route_hash: string | null;
};

type PostStorageRouteRow = {
  post_id: string;
  storage_provider: string;
  storage_route: string;
  preview_url: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_ai: boolean;
  users: UserRow;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatar: row.avatar_url ?? "",
    verified: row.verified,
    walletAddress: row.wallet_address,
    bio: row.bio ?? undefined,
    walletConnectedAt: row.wallet_connected_at ?? undefined,
    usernameSetAt: row.username_set_at ?? undefined,
  };
}

function mapPostRow(row: PostRow): Post {
  return {
    id: row.id,
    author: mapUserRow(row.users),
    content: row.content,
    media: row.media ?? undefined,
    timestamp: row.created_at,
    likes: row.likes_count,
    reposts: row.reposts_count,
    replies: row.replies_count,
    truthScore: row.truth_score,
    truthLevel: row.truth_level as TruthLevel,
    viralityScore: row.virality_score,
    varaReward: row.vara_reward ?? undefined,
    routeHash: row.route_hash ?? undefined,
  };
}

function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    author: mapUserRow(row.users),
    content: row.content,
    timestamp: row.created_at,
    likes: row.likes_count,
    isAI: row.is_ai,
  };
}

function mapSubscriptionPlanRow(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    billingCycle: row.billing_cycle,
    benefits: row.benefits ?? [],
    featured: row.featured,
    active: row.active,
  };
}

function mapUserSubscriptionRow(row: UserSubscriptionRow): UserSubscription {
  return {
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
  };
}

function mapUserAdPreferenceRow(row: UserAdPreferenceRow): UserAdPreference {
  return {
    userId: row.user_id,
    hideAds: row.hide_ads,
    filterAiAds: row.filter_ai_ads,
    sponsoredFeedInterval: row.sponsored_feed_interval,
  };
}

function mapAdCampaignRow(row: AdCampaignRow): AdCampaign {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    objective: row.objective,
    budget: Number(row.budget),
    placements: row.placements ?? [],
    status: row.status,
    routeHash: row.route_hash ?? undefined,
  };
}

function mapPostStorageRouteRow(row: PostStorageRouteRow): PostStorageRoute {
  return {
    postId: row.post_id,
    storageProvider: row.storage_provider,
    storageRoute: row.storage_route,
    previewUrl: row.preview_url ?? undefined,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users!author_id(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error("fetchPosts:", error?.message);
    return [];
  }
  return (data as unknown as PostRow[]).map(mapPostRow);
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, users!author_id(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("fetchComments:", error?.message);
    return [];
  }
  return (data as unknown as CommentRow[]).map(mapCommentRow);
}

export async function fetchUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapUserRow(data as UserRow);
}

export async function fetchUserByWallet(
  walletAddress: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("wallet_address", walletAddress)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserRow(data as UserRow);
}

export async function ensureUserByWallet(
  walletAddress: string,
): Promise<User | null> {
  const existing = await fetchUserByWallet(walletAddress);
  if (existing) return existing;

  const suffix = walletAddress.slice(-6).toLowerCase();
  const handle = `user-${suffix}`;
  const displayName = `User ${suffix.toUpperCase()}`;

  const { data, error } = await supabase
    .from("users")
    .insert({
      handle,
      display_name: displayName,
      wallet_address: walletAddress,
      wallet_connected_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("ensureUserByWallet:", error?.message);
    return null;
  }

  return mapUserRow(data as UserRow);
}

export async function updateUsername(
  userId: string,
  handle: string,
): Promise<User | null> {
  const normalizedHandle = handle.trim().toLowerCase();
  const displayName = handle.trim();

  const { data, error } = await supabase
    .from("users")
    .update({
      handle: normalizedHandle,
      display_name: displayName,
      username_set_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("updateUsername:", error?.message);
    return null;
  }

  return mapUserRow(data as UserRow);
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true });

  if (error || !data) {
    console.error("fetchSubscriptionPlans:", error?.message);
    return [];
  }

  return (data as SubscriptionPlanRow[]).map(mapSubscriptionPlanRow);
}

export async function fetchUserSubscription(
  userId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserSubscriptionRow(data as UserSubscriptionRow);
}

export async function fetchUserAdPreference(
  userId: string,
): Promise<UserAdPreference | null> {
  const { data, error } = await supabase
    .from("user_ad_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserAdPreferenceRow(data as UserAdPreferenceRow);
}

export async function fetchAdCampaigns(
  ownerId: string,
): Promise<AdCampaign[]> {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchAdCampaigns:", error?.message);
    return [];
  }

  return (data as AdCampaignRow[]).map(mapAdCampaignRow);
}

export async function fetchPostStorageRoute(
  postId: string,
): Promise<PostStorageRoute | null> {
  const { data, error } = await supabase
    .from("post_storage_routes")
    .select("*")
    .eq("post_id", postId)
    .maybeSingle();

  if (error || !data) return null;
  return mapPostStorageRouteRow(data as PostStorageRouteRow);
}

export async function fetchUserLikes(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId);
  return new Set(data?.map((r: { post_id: string }) => r.post_id) ?? []);
}

export async function fetchUserReposts(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("reposts")
    .select("post_id")
    .eq("user_id", userId);
  return new Set(data?.map((r: { post_id: string }) => r.post_id) ?? []);
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function insertPost(
  authorId: string,
  content: string,
  media: MediaItem[] = [],
  storageRoute?: string,
): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: authorId,
      content,
      media: media.length > 0 ? media : null,
      truth_score: Math.floor(Math.random() * 30) + 70,
      truth_level: "valid",
      virality_score: Math.floor(Math.random() * 40) + 10,
    })
    .select("*, users!author_id(*)")
    .single();

  if (error || !data) {
    console.error("insertPost:", error?.message);
    return null;
  }

  if (storageRoute) {
    await supabase.from("post_storage_routes").upsert({
      post_id: (data as PostRow).id,
      storage_provider: "0g",
      storage_route: storageRoute,
    });
  }

  return mapPostRow(data as unknown as PostRow);
}

export async function saveUserSubscription(
  userId: string,
  planId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      starts_at: new Date().toISOString(),
      ends_at: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("saveUserSubscription:", error?.message);
    return null;
  }

  return mapUserSubscriptionRow(data as UserSubscriptionRow);
}

export async function saveUserAdPreference(
  userId: string,
  preference: Partial<Omit<UserAdPreference, "userId">>,
): Promise<UserAdPreference | null> {
  const { data, error } = await supabase
    .from("user_ad_preferences")
    .upsert({
      user_id: userId,
      hide_ads: preference.hideAds ?? false,
      filter_ai_ads: preference.filterAiAds ?? false,
      sponsored_feed_interval: preference.sponsoredFeedInterval ?? 7,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("saveUserAdPreference:", error?.message);
    return null;
  }

  return mapUserAdPreferenceRow(data as UserAdPreferenceRow);
}

export async function createAdCampaign(
  ownerId: string,
  title: string,
  objective: string,
  budget: number,
  placements: string[],
): Promise<AdCampaign | null> {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      owner_id: ownerId,
      title,
      objective,
      budget,
      placements,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createAdCampaign:", error?.message);
    return null;
  }

  return mapAdCampaignRow(data as AdCampaignRow);
}

export async function insertComment(
  postId: string,
  authorId: string,
  content: string,
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content })
    .select("*, users!author_id(*)")
    .single();

  if (error || !data) {
    console.error("insertComment:", error?.message);
    return null;
  }
  return mapCommentRow(data as unknown as CommentRow);
}

export async function upsertLike(
  postId: string,
  userId: string,
): Promise<void> {
  await supabase.from("likes").upsert({ post_id: postId, user_id: userId });
}

export async function deleteLike(
  postId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("likes")
    .delete()
    .match({ post_id: postId, user_id: userId });
}

export async function upsertRepost(
  postId: string,
  userId: string,
): Promise<void> {
  await supabase.from("reposts").upsert({ post_id: postId, user_id: userId });
}

export async function deleteRepost(
  postId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("reposts")
    .delete()
    .match({ post_id: postId, user_id: userId });
}
