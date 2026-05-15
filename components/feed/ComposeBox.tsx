"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Smile, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { useApp } from "@/lib/store";

export function ComposeBox() {
  const { addPost, currentUser } = useApp();
  const [content, setContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingRouteHash, setPendingRouteHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBlocked = !currentUser || !currentUser.usernameSetAt;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setPendingRouteHash(null);

    // Upload to 0G
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setPendingRouteHash(json.rootHash ?? null);
      }
    } catch {
      // Upload failed silently — post will still work without route hash
    } finally {
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingRouteHash(null);
  };

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed || isBlocked) return;
    addPost(trimmed, {
      mediaItems: previewUrl
        ? [{ url: previewUrl, type: "image" }]
        : undefined,
      routeHash: pendingRouteHash ?? undefined,
    });
    setContent("");
    clearImage();
  };

  if (isBlocked) {
    return (
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm text-secondary">
          {!currentUser ? (
            <>Connect your wallet to start posting.</>
          ) : (
            <>
              Create a username first.{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Go to Settings
              </Link>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-4 py-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-3">
        <Avatar name={currentUser.displayName ?? "You"} />
        <div className="flex-1">
          <textarea
            placeholder="What's happening in Web4?"
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none bg-transparent text-xl leading-relaxed outline-none placeholder:text-secondary"
          />

          {/* Image preview */}
          {previewUrl && (
            <div className="relative mb-3 overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 w-full object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
              {uploading && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading to 0G…
                </div>
              )}
              {!uploading && pendingRouteHash && (
                <div className="absolute bottom-2 right-2 rounded-full bg-truth-valid/80 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                  Saved on 0G ✓
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handleImageClick}
                className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10"
                title="Attach image (uploads to 0G Storage)"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10">
                <Smile className="h-5 w-5" />
              </button>
              <button
                className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10"
                title="AI Filter"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={!content.trim() || uploading}
              className="rounded-full bg-accent px-5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
