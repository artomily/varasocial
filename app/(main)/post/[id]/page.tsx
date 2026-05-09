"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { useApp } from "@/lib/store";
import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";
import { TruthBadge } from "@/components/common/TruthBadge";
import { ViralityScore } from "@/components/common/ViralityScore";
import { VaraReward } from "@/components/common/VaraReward";

function formatDate(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    posts,
    comments,
    likedPosts,
    repostedPosts,
    varaAIEnabled,
    toggleLike,
    toggleRepost,
    addComment,
    likeComment,
  } = useApp();
  const [newComment, setNewComment] = useState("");

  const post = posts.find((p) => p.id === id);
  if (!post) {
    return (
      <div className="p-8 text-center text-secondary">Post not found</div>
    );
  }

  const postComments = comments.filter((c) => c.postId === id);
  const aiComment = postComments.find((c) => c.isAI);
  const userComments = postComments.filter((c) => !c.isAI);
  const showAIAnalytics = varaAIEnabled;

  const isLiked = likedPosts.has(post.id);
  const isReposted = repostedPosts.has(post.id);

  const handleAddComment = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addComment(post.id, trimmed);
    setNewComment("");
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="rounded-full p-2 transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      {/* Post */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/user/${post.author.handle}`}>
            <Avatar name={post.author.displayName} />
          </Link>
          <div>
            <Link
              href={`/user/${post.author.handle}`}
              className="font-bold hover:underline"
            >
              {post.author.displayName}
            </Link>
            <p className="text-sm text-secondary">@{post.author.handle}</p>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">
          {post.content}
        </p>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div
            className={`mt-3 grid gap-1 overflow-hidden rounded-2xl border border-border ${
              post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {post.media.map((item, idx) =>
              item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={item.url}
                  alt="Post media"
                  className="w-full object-cover"
                  style={{ maxHeight: post.media!.length > 1 ? "280px" : "520px" }}
                />
              ) : (
                <video
                  key={idx}
                  src={item.url}
                  controls
                  className="w-full rounded-2xl"
                  style={{ maxHeight: "520px" }}
                />
              )
            )}
          </div>
        )}

        {/* Badges */}
        {showAIAnalytics && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TruthBadge level={post.truthLevel} score={post.truthScore} />
            <ViralityScore score={post.viralityScore} />
            {post.varaReward && <VaraReward amount={post.varaReward} />}
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-3 text-sm text-secondary">
          {formatDate(post.timestamp)}
        </p>

        {/* Stats */}
        <div className="mt-3 flex gap-4 border-t border-border pt-3 text-sm">
          <span>
            <span className="font-bold">{formatCount(post.reposts)}</span>{" "}
            <span className="text-secondary">Reposts</span>
          </span>
          <span>
            <span className="font-bold">{formatCount(post.likes)}</span>{" "}
            <span className="text-secondary">Likes</span>
          </span>
          <span>
            <span className="font-bold">{formatCount(post.replies)}</span>{" "}
            <span className="text-secondary">Replies</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around border-t border-border py-2">
          <button className="rounded-full p-2 text-secondary transition-colors hover:text-accent">
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => toggleRepost(post.id)}
            className={`rounded-full p-2 transition-colors ${
              isReposted
                ? "text-truth-valid"
                : "text-secondary hover:text-truth-valid"
            }`}
          >
            <Repeat2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => toggleLike(post.id)}
            className={`rounded-full p-2 transition-colors ${
              isLiked
                ? "text-truth-hoax"
                : "text-secondary hover:text-truth-hoax"
            }`}
          >
            <Heart
              className="h-5 w-5"
              fill={isLiked ? "currentColor" : "none"}
            />
          </button>
          <button className="rounded-full p-2 text-secondary transition-colors hover:text-accent">
            <Share className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Compose reply */}
      <div className="flex gap-3 border-b border-border px-4 py-3">
        <Avatar name={MOCK_USERS[0].displayName} />
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Post your reply"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-secondary"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      </div>

      {/* VaraAI Analysis — pinned at top of comments */}
      {showAIAnalytics && aiComment && (
        <div className="border-b border-border bg-accent/5 px-4 py-3">
          <div className="flex gap-3">
            <div className="relative">
              <Avatar name="VaraAI" />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent flex items-center justify-center">
                <svg
                  viewBox="0 0 22 22"
                  className="h-3 w-3 text-white"
                  fill="currentColor"
                >
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.852-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.144.271.587.702 1.087 1.24 1.44.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.893.143.636-.13 1.222-.434 1.69-.88.445-.47.75-1.055.88-1.69.131-.636.084-1.294-.139-1.9.588-.269 1.088-.698 1.443-1.232.355-.535.554-1.163.574-1.81z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-accent">VaraAI</span>
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  AI ANALYSIS
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-secondary">
                {aiComment.content}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => likeComment(aiComment.id)}
                  className="flex items-center gap-1 text-xs text-secondary transition-colors hover:text-truth-hoax"
                >
                  <Heart className="h-3.5 w-3.5" />
                  {aiComment.likes > 0 && aiComment.likes}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User comments */}
      {userComments.map((comment) => (
        <div
          key={comment.id}
          className="flex gap-3 border-b border-border px-4 py-3"
        >
          <Link href={`/user/${comment.author.handle}`}>
            <Avatar name={comment.author.displayName} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm">
              <Link
                href={`/user/${comment.author.handle}`}
                className="font-bold hover:underline"
              >
                {comment.author.displayName}
              </Link>
              <span className="text-secondary">@{comment.author.handle}</span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed">
              {comment.content}
            </p>
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => likeComment(comment.id)}
                className="flex items-center gap-1 text-xs text-secondary transition-colors hover:text-truth-hoax"
              >
                <Heart className="h-3.5 w-3.5" />
                {comment.likes > 0 && comment.likes}
              </button>
            </div>
          </div>
        </div>
      ))}

      {userComments.length === 0 && (!aiComment || !showAIAnalytics) && (
        <div className="p-8 text-center text-secondary">
          No comments yet. Be the first to reply!
        </div>
      )}
    </div>
  );
}
