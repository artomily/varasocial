export type TruthLevel = "valid" | "suspicious" | "hoax";

export interface User {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  walletAddress: string;
  bio?: string;
  followers: number;
  following: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: string;
  timestamp: string;
  likes: number;
  reposts: number;
  replies: number;
  truthScore: number;
  truthLevel: TruthLevel;
  viralityScore: number;
  varaReward?: number;
  parentId?: string;
}

export interface Trend {
  id: string;
  topic: string;
  postCount: number;
  category: string;
}

export interface Notification {
  id: string;
  type: "like" | "repost" | "reply" | "follow" | "reward";
  actor: User;
  postId?: string;
  timestamp: string;
  read: boolean;
}
