import { ImageIcon, Smile, SlidersHorizontal } from "lucide-react";

const MAX_CHARS = 280;

interface ComposeToolbarProps {
  charCount: number;
  canPost: boolean;
  uploading: boolean;
  onImageClick: () => void;
  onPost: () => void;
}

export function ComposeToolbar({ charCount, canPost, uploading, onImageClick, onPost }: ComposeToolbarProps) {
  const remaining = MAX_CHARS - charCount;
  const isOverLimit = remaining < 0;

  return (
    <div className="flex items-center justify-between border-t border-border pt-3">
      <div className="flex items-center gap-1">
        <button
          onClick={onImageClick}
          type="button"
          title="Attach image (uploads to 0G Storage)"
          className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Emoji"
          className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="AI Filter"
          className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {charCount > 0 && (
          <span className={`text-sm tabular-nums ${isOverLimit ? "text-red-500" : "text-secondary"}`}>
            {remaining}
          </span>
        )}
        <button
          onClick={onPost}
          type="button"
          disabled={!canPost || isOverLimit || uploading}
          className="rounded-full bg-accent px-5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  );
}
