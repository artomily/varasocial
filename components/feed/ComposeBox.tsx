"use client";

import { ImageIcon, Smile, SlidersHorizontal } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { CURRENT_USER } from "@/lib/mock-data";

export function ComposeBox() {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex gap-3">
        <Avatar name={CURRENT_USER.displayName} />
        <div className="flex-1">
          <textarea
            placeholder="What's happening in Web4?"
            rows={2}
            className="w-full resize-none bg-transparent text-xl leading-relaxed outline-none placeholder:text-secondary"
          />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <button className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10">
                <ImageIcon className="h-5 w-5" />
              </button>
              <button className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10">
                <Smile className="h-5 w-5" />
              </button>
              <button className="rounded-full p-2 text-accent transition-colors hover:bg-accent/10" title="AI Filter">
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
            <button className="rounded-full bg-accent px-5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
