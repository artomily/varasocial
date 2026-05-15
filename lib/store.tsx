"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import type { Post, User, Comment, Conversation, MediaItem } from "@/lib/types";
import {
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_CONVERSATIONS,
} from "@/lib/mock-data";
import {
  fetchPosts,
  ensureUserByWallet,
  fetchUserLikes,
  fetchUserReposts,
  fetchUserSubscription,
  fetchUserAdPreference,
  insertPost,
  insertComment,
  saveUserSubscription,
  saveUserAdPreference,
  updateUsername,
  upsertLike,
  deleteLike,
  upsertRepost,
  deleteRepost,
  insertNotification,
} from "@/lib/supabase-queries";
import type { UserAdPreference, UserSubscription } from "@/lib/types";

interface AppState {
  posts: Post[];
  comments: Comment[];
  conversations: Conversation[];
  currentUser: User | null;
  userSubscription: UserSubscription | null;
  adPreference: UserAdPreference | null;
  loading: boolean;
  likedPosts: Set<string>;
  repostedPosts: Set<string>;
  followingUsers: Set<string>;
  varaAIEnabled: boolean;
  sidebarCollapsed: boolean;
}

interface AppActions {
  toggleLike: (postId: string, postAuthorId?: string) => void;
  toggleRepost: (postId: string, postAuthorId?: string) => void;
  toggleFollow: (userId: string) => void;
  toggleVaraAI: () => void;
  toggleSidebar: () => void;
  addComment: (postId: string, content: string, postAuthorId?: string) => void;
  addPost: (content: string, options?: { mediaItems?: MediaItem[]; routeHash?: string }) => void;
  completeUsername: (handle: string) => Promise<void>;
  subscribePlan: (planId: string, txHash?: string) => Promise<void>;
  saveAdPreference: (
    preference: Partial<Omit<UserAdPreference, "userId">>,
  ) => Promise<void>;
  sendMessage: (userId: string, text: string) => void;
  likeComment: (commentId: string) => void;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

function AppProviderWithWallet({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected } = useAccount();
  return (
    <AppProviderCore address={mounted ? address : undefined} isConnected={mounted ? isConnected : false}>
      {children}
    </AppProviderCore>
  );
}

function AppProviderCore({
  children,
  address,
  isConnected,
}: {
  children: ReactNode;
  address?: string;
  isConnected: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [adPreference, setAdPreference] = useState<UserAdPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(
    new Set()
  );
  const [varaAIEnabled, setVaraAIEnabled] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Bootstrap: load public data and resolve the wallet-linked profile when connected
  useEffect(() => {
    let canceled = false;

    async function init() {
      setLoading(true);
      try {
        const dbPosts = await fetchPosts();
        if (canceled) return;

        setPosts(dbPosts.length > 0 ? dbPosts : MOCK_POSTS);

        if (!isConnected || !address) {
          setCurrentUser(null);
          setUserSubscription(null);
          setAdPreference(null);
          return;
        }

        console.debug("[AppProvider] Ensuring user for wallet:", address);
        const profile = await ensureUserByWallet(address);
        if (canceled) return;

        if (profile) {
          console.debug("[AppProvider] Profile resolved:", profile.id, "handle:", profile.handle);
          const [liked, reposted, subscription, preference] = await Promise.all([
            fetchUserLikes(profile.id),
            fetchUserReposts(profile.id),
            fetchUserSubscription(profile.id),
            fetchUserAdPreference(profile.id),
          ]);

          setCurrentUser(profile);
          setLikedPosts(liked);
          setRepostedPosts(reposted);
          setUserSubscription(subscription);
          setAdPreference(preference);
        } else {
          console.error("[AppProvider] Failed to ensure user for wallet:", address);
        }
      } catch (error) {
        console.error("[AppProvider] Init error:", error);
        setPosts(MOCK_POSTS);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    init();
    return () => {
      canceled = true;
    };
  }, [address, isConnected]);

  const toggleLike = useCallback((postId: string, postAuthorId?: string) => {
    const isLiked = likedPosts.has(postId);

    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + (isLiked ? -1 : 1) }
          : p
      )
    );

    if (currentUser) {
      if (isLiked) {
        deleteLike(postId, currentUser.id);
      } else {
        upsertLike(postId, currentUser.id);
        if (postAuthorId && postAuthorId !== currentUser.id) {
          insertNotification(postAuthorId, currentUser.id, "like", postId);
        }
      }
    }
  }, [likedPosts, currentUser]);

  const toggleRepost = useCallback((postId: string, postAuthorId?: string) => {
    const isReposted = repostedPosts.has(postId);

    setRepostedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reposts: p.reposts + (isReposted ? -1 : 1) }
          : p
      )
    );

    if (currentUser) {
      if (isReposted) {
        deleteRepost(postId, currentUser.id);
      } else {
        upsertRepost(postId, currentUser.id);
        if (postAuthorId && postAuthorId !== currentUser.id) {
          insertNotification(postAuthorId, currentUser.id, "repost", postId);
        }
      }
    }
  }, [repostedPosts, currentUser]);

  const toggleFollow = useCallback((userId: string) => {
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const toggleVaraAI = useCallback(() => {
    setVaraAIEnabled((prev) => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const addComment = useCallback(
    (postId: string, content: string, postAuthorId?: string) => {
      if (!currentUser) return;

      const tempId = `temp-${Date.now()}`;
      const tempComment = {
        id: tempId,
        postId,
        author: currentUser,
        content,
        timestamp: new Date().toISOString(),
        likes: 0,
      };
      setComments((prev) => [...prev, tempComment]);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, replies: p.replies + 1 } : p
        )
      );

      insertComment(postId, currentUser.id, content).then((saved) => {
        if (saved) {
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? saved : c))
          );
          if (postAuthorId && postAuthorId !== currentUser.id) {
            insertNotification(postAuthorId, currentUser.id, "reply", postId);
          }
        }
      });
    },
    [currentUser]
  );

  const addPost = useCallback(
    (content: string, options?: { mediaItems?: MediaItem[]; routeHash?: string }) => {
      if (!currentUser || !currentUser.usernameSetAt) return;

      const tempId = `temp-${Date.now()}`;
      const tempPost: Post = {
        id: tempId,
        author: currentUser,
        content,
        media: options?.mediaItems,
        routeHash: options?.routeHash,
        timestamp: new Date().toISOString(),
        likes: 0,
        reposts: 0,
        replies: 0,
        truthScore: Math.floor(Math.random() * 30) + 70,
        truthLevel: "valid",
        viralityScore: Math.floor(Math.random() * 40) + 10,
      };
      setPosts((prev) => [tempPost, ...prev]);

      insertPost(currentUser.id, content, options?.mediaItems ?? [], options?.routeHash).then((saved) => {
        if (saved) {
          setPosts((prev) =>
            prev.map((p) => (p.id === tempId ? saved : p))
          );
        }
      });
    },
    [currentUser]
  );

  const completeUsername = useCallback(
    async (handle: string) => {
      if (!currentUser) {
        console.error("[completeUsername] No currentUser available");
        return;
      }
      console.debug("[completeUsername] Starting for user:", currentUser.id);
      const updated = await updateUsername(currentUser.id, handle);
      if (updated) {
        console.debug("[completeUsername] Successfully updated user:", updated.id);
        setCurrentUser(updated);
      } else {
        console.error("[completeUsername] Failed to update username for:", currentUser.id);
      }
    },
    [currentUser],
  );

  const subscribePlan = useCallback(
    async (planId: string, txHash?: string) => {
      if (!currentUser) return;
      const subscription = await saveUserSubscription(currentUser.id, planId, txHash);
      if (subscription) {
        setUserSubscription(subscription);
        setCurrentUser((prev) => (prev ? { ...prev, verified: true } : prev));
      }
    },
    [currentUser],
  );

  const saveAdPreference = useCallback(
    async (preference: Partial<Omit<UserAdPreference, "userId">>) => {
      if (!currentUser) return;
      const saved = await saveUserAdPreference(currentUser.id, preference);
      if (saved) setAdPreference(saved);
    },
    [currentUser],
  );

  const sendMessage = useCallback(
    (userId: string, text: string) => {
      const msg = {
        id: `dm-${Date.now()}`,
        senderId: currentUser?.id ?? "local",
        text,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === userId);
        if (existing) {
          return prev.map((c) =>
            c.userId === userId
              ? { ...c, messages: [...c.messages, msg] }
              : c
          );
        }
        return [...prev, { userId, messages: [msg] }];
      });
    },
    [currentUser]
  );

  const likeComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        posts,
        comments,
        conversations,
        currentUser,
        userSubscription,
        adPreference,
        loading,
        likedPosts,
        repostedPosts,
        followingUsers,
        varaAIEnabled,
        sidebarCollapsed,
        toggleLike,
        toggleRepost,
        toggleFollow,
        toggleVaraAI,
        toggleSidebar,
        addComment,
        addPost,
        completeUsername,
        subscribePlan,
        saveAdPreference,
        sendMessage,
        likeComment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppProviderWithWallet>{children}</AppProviderWithWallet>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
