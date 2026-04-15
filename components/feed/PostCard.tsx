"use client";

import Link from "next/link";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  Bookmark,
} from "lucide-react";
import type { Post } from "@/lib/types";
import { Avatar } from "@/components/common/Avatar";
import { TruthBadge } from "@/components/common/TruthBadge";
import { ViralityScore } from "@/components/common/ViralityScore";
import { VaraReward } from "@/components/common/VaraReward";
import { useApp } from "@/lib/store";

function formatTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n > 0 ? String(n) : "";
}

export function PostCard({ post }: { post: Post }) {
  const {
    likedPosts,
    repostedPosts,
    bookmarkedPosts,
    toggleLike,
    toggleRepost,
    toggleBookmark,
  } = useApp();

  const isLiked = likedPosts.has(post.id);
  const isReposted = repostedPosts.has(post.id);
  const isBookmarked = bookmarkedPosts.has(post.id);

  return (
    <article className="flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50">
      <Link href={`/user/${post.author.handle}`}>
        <Avatar name={post.author.displayName} />
      </Link>

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-1 text-sm">
          <Link
            href={`/user/${post.author.handle}`}
            className="truncate font-bold hover:underline"
          >
            {post.author.displayName}
          </Link>
          {post.author.verified && (
            <svg
              viewBox="0 0 22 22"
              className="h-4.5 w-4.5 shrink-0 text-accent"
              fill="currentColor"
            >
              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.852-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.144.271.587.702 1.087 1.24 1.44.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.893.143.636-.13 1.222-.434 1.69-.88.445-.47.75-1.055.88-1.69.131-.636.084-1.294-.139-1.9.588-.269 1.088-.698 1.443-1.232.355-.535.554-1.163.574-1.81z" />
              <path
                d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                fill="#000"
              />
            </svg>
          )}
          <Link
            href={`/user/${post.author.handle}`}
            className="text-secondary hover:underline"
          >
            @{post.author.handle}
          </Link>
          <span className="text-secondary">·</span>
          <Link href={`/post/${post.id}`} className="text-secondary hover:underline">
            {formatTime(post.timestamp)}
          </Link>
        </div>

        {/* Content — clickable to post detail */}
        <Link href={`/post/${post.id}`} className="block">
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
            {post.content}
          </p>
        </Link>

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
                  style={{ maxHeight: post.media!.length > 1 ? "200px" : "400px" }}
                />
              ) : (
                <video
                  key={idx}
                  src={item.url}
                  controls
                  className="w-full rounded-2xl"
                  style={{ maxHeight: "400px" }}
                />
              )
            )}
          </div>
        )}


        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TruthBadge level={post.truthLevel} score={post.truthScore} />
          <ViralityScore score={post.viralityScore} />
          {post.varaReward && <VaraReward amount={post.varaReward} />}
        </div>

        {/* Action bar */}
        <div className="-ml-2 mt-2 flex items-center justify-between max-w-md">
          <Link
            href={`/post/${post.id}`}
            className="group flex items-center gap-1.5 rounded-full p-2 text-secondary transition-colors hover:text-accent"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="text-xs">{formatCount(post.replies)}</span>
          </Link>

          <button
            onClick={() => toggleRepost(post.id)}
            className={`group flex items-center gap-1.5 rounded-full p-2 transition-colors ${
              isReposted ? "text-truth-valid" : "text-secondary hover:text-truth-valid"
            }`}
          >
            <Repeat2 className="h-4.5 w-4.5" />
            <span className="text-xs">{formatCount(post.reposts)}</span>
          </button>

          <button
            onClick={() => toggleLike(post.id)}
            className={`group flex items-center gap-1.5 rounded-full p-2 transition-colors ${
              isLiked ? "text-truth-hoax" : "text-secondary hover:text-truth-hoax"
            }`}
          >
            <Heart
              className="h-4.5 w-4.5"
              fill={isLiked ? "currentColor" : "none"}
            />
            <span className="text-xs">{formatCount(post.likes)}</span>
          </button>

          <button className="group flex items-center gap-1.5 rounded-full p-2 text-secondary transition-colors hover:text-accent">
            <Share className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => toggleBookmark(post.id)}
            className={`group flex items-center gap-1.5 rounded-full p-2 transition-colors ${
              isBookmarked ? "text-accent" : "text-secondary hover:text-accent"
            }`}
          >
            <Bookmark
              className="h-4.5 w-4.5"
              fill={isBookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
