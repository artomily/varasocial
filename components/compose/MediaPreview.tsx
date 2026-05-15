import { Loader2, X } from "lucide-react";

interface MediaPreviewProps {
  previewUrl: string;
  uploading: boolean;
  pendingRouteHash: string | null;
  onClear: () => void;
}

export function MediaPreview({ previewUrl, uploading, pendingRouteHash, onClear }: MediaPreviewProps) {
  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-cover" />

      <button
        onClick={onClear}
        type="button"
        aria-label="Remove image"
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
  );
}
