"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useApp } from "@/lib/store";
import { MediaPreview } from "./MediaPreview";
import { ComposeToolbar } from "./ComposeToolbar";

interface ComposeFormProps {
  onSuccess: () => void;
}

export function ComposeForm({ onSuccess }: ComposeFormProps) {
  const { addPost, currentUser } = useApp();
  const [content, setContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingRouteHash, setPendingRouteHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setPendingRouteHash(null);
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingRouteHash(null);
  };

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed || !currentUser?.usernameSetAt) return;

    addPost(trimmed, {
      mediaItems: previewUrl ? [{ url: previewUrl, type: "image" }] : undefined,
      routeHash: pendingRouteHash ?? undefined,
    });

    setContent("");
    clearImage();
    onSuccess();
  };

  return (
    <div className="px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-3">
        <Avatar name={currentUser?.displayName ?? "You"} />

        <div className="flex-1">
          <textarea
            placeholder="What's happening in Web4?"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            className="w-full resize-none bg-transparent text-xl leading-relaxed outline-none placeholder:text-secondary"
          />

          {previewUrl && (
            <MediaPreview
              previewUrl={previewUrl}
              uploading={uploading}
              pendingRouteHash={pendingRouteHash}
              onClear={clearImage}
            />
          )}

          <ComposeToolbar
            charCount={content.length}
            canPost={content.trim().length > 0}
            uploading={uploading}
            onImageClick={handleImageClick}
            onPost={handlePost}
          />
        </div>
      </div>
    </div>
  );
}
