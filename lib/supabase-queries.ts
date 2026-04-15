import { supabase } from "./supabase";
import type { Post, User, Comment, TruthLevel, MediaItem } from "./types";

// ─── DB row types ────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  wallet_address: string;
  bio: string | null;
  followers: number;
  following: number;
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
  users: UserRow;
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
    followers: row.followers,
    following: row.following,
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
): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: authorId,
      content,
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
  return mapPostRow(data as unknown as PostRow);
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
