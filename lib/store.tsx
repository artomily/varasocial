"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Post, User, Comment, Conversation } from "@/lib/types";
import {
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_CONVERSATIONS,
} from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import {
  fetchPosts,
  fetchUserById,
  fetchUserLikes,
  fetchUserReposts,
  insertPost,
  insertComment,
  upsertLike,
  deleteLike,
  upsertRepost,
  deleteRepost,
} from "@/lib/supabase-queries";

interface AppState {
  posts: Post[];
  comments: Comment[];
  conversations: Conversation[];
  currentUser: User | null;
  loading: boolean;
  likedPosts: Set<string>;
  repostedPosts: Set<string>;
  bookmarkedPosts: Set<string>;
  followingUsers: Set<string>;
  varaAIEnabled: boolean;
  sidebarCollapsed: boolean;
}

interface AppActions {
  toggleLike: (postId: string) => void;
  toggleRepost: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  toggleFollow: (userId: string) => void;
  toggleVaraAI: () => void;
  toggleSidebar: () => void;
  addComment: (postId: string, content: string) => void;
  addPost: (content: string) => void;
  sendMessage: (userId: string, text: string) => void;
  likeComment: (commentId: string) => void;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(
    new Set()
  );
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(
    new Set()
  );
  const [varaAIEnabled, setVaraAIEnabled] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Bootstrap: sign in as demo seed user + load real Supabase data
  useEffect(() => {
    async function init() {
      try {
        const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
        const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

        // Sign in as the seeded demo account
        if (demoEmail && demoPassword) {
          const { data: { user } } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

          if (user) {
            const [profile, dbPosts, liked, reposted] = await Promise.all([
              fetchUserById(user.id),
              fetchPosts(),
              fetchUserLikes(user.id),
              fetchUserReposts(user.id),
            ]);

            setCurrentUser(profile);
            setPosts(dbPosts.length > 0 ? dbPosts : MOCK_POSTS);
            setLikedPosts(liked);
            setRepostedPosts(reposted);
          } else {
            // Supabase unavailable — fall back to mock data
            setPosts(MOCK_POSTS);
          }
        } else {
          // Demo credentials not configured — use mock data
          setPosts(MOCK_POSTS);
        }
      } catch {
        setPosts(MOCK_POSTS);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const toggleLike = useCallback((postId: string) => {
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

    // Persist in background (fire-and-forget)
    if (currentUser) {
      if (isLiked) deleteLike(postId, currentUser.id);
      else upsertLike(postId, currentUser.id);
    }
  }, [likedPosts, currentUser]);

  const toggleRepost = useCallback((postId: string) => {
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
      if (isReposted) deleteRepost(postId, currentUser.id);
      else upsertRepost(postId, currentUser.id);
    }
  }, [repostedPosts, currentUser]);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

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
    (postId: string, content: string) => {
      if (!currentUser) return;

      // Optimistic local comment
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

      // Persist and replace temp with real row
      insertComment(postId, currentUser.id, content).then((saved) => {
        if (saved) {
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? saved : c))
          );
        }
      });
    },
    [currentUser]
  );

  const addPost = useCallback(
    (content: string) => {
      if (!currentUser) return;

      // Optimistic prepend
      const tempId = `temp-${Date.now()}`;
      const tempPost: Post = {
        id: tempId,
        author: currentUser,
        content,
        timestamp: new Date().toISOString(),
        likes: 0,
        reposts: 0,
        replies: 0,
        truthScore: Math.floor(Math.random() * 30) + 70,
        truthLevel: "valid",
        viralityScore: Math.floor(Math.random() * 40) + 10,
      };
      setPosts((prev) => [tempPost, ...prev]);

      // Persist and replace temp with real row
      insertPost(currentUser.id, content).then((saved) => {
        if (saved) {
          setPosts((prev) =>
            prev.map((p) => (p.id === tempId ? saved : p))
          );
        }
      });
    },
    [currentUser]
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
        loading,
        likedPosts,
        repostedPosts,
        bookmarkedPosts,
        followingUsers,
        varaAIEnabled,
        sidebarCollapsed,
        toggleLike,
        toggleRepost,
        toggleBookmark,
        toggleFollow,
        toggleVaraAI,
        toggleSidebar,
        addComment,
        addPost,
        sendMessage,
        likeComment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
