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
  walletConnectedAt?: string;
  usernameSetAt?: string;
}

export type MediaItem = { type: "image" | "video"; url: string };

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: MediaItem[];
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

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  isAI?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  userId: string;
  messages: DirectMessage[];
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

export interface SubscriptionPlan {
  id: string;
  slug: string;
  title: string;
  price: number;
  billingCycle: string;
  benefits: string[];
  featured: boolean;
  active: boolean;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: string;
  startsAt: string;
  endsAt?: string;
}

export interface UserAdPreference {
  userId: string;
  hideAds: boolean;
  filterAiAds: boolean;
  sponsoredFeedInterval: number;
}

export interface AdCampaign {
  id: string;
  ownerId: string;
  title: string;
  objective: string;
  budget: number;
  placements: string[];
  status: string;
}

export interface PostStorageRoute {
  postId: string;
  storageProvider: string;
  storageRoute: string;
  previewUrl?: string;
}

export interface OnboardingState {
  walletConnected: boolean;
  usernameSet: boolean;
}
