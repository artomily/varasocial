"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Post, Comment, Conversation } from "@/lib/types";
import {
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_CONVERSATIONS,
  CURRENT_USER,
} from "@/lib/mock-data";

interface AppState {
  posts: Post[];
  comments: Comment[];
  conversations: Conversation[];
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
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
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

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + (likedPosts.has(postId) ? -1 : 1) }
          : p
      )
    );
  }, [likedPosts]);

  const toggleRepost = useCallback((postId: string) => {
    setRepostedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reposts: p.reposts + (repostedPosts.has(postId) ? -1 : 1),
            }
          : p
      )
    );
  }, [repostedPosts]);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
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
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        postId,
        author: CURRENT_USER,
        content,
        timestamp: new Date().toISOString(),
        likes: 0,
      };
      setComments((prev) => [...prev, newComment]);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, replies: p.replies + 1 } : p
        )
      );
    },
    []
  );

  const addPost = useCallback((content: string) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author: CURRENT_USER,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      replies: 0,
      truthScore: Math.floor(Math.random() * 30) + 70,
      truthLevel: "valid",
      viralityScore: Math.floor(Math.random() * 40) + 10,
    };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const sendMessage = useCallback(
    (userId: string, text: string) => {
      const msg = {
        id: `dm-${Date.now()}`,
        senderId: CURRENT_USER.id,
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
    []
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
