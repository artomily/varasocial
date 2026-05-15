"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";
import { ComposeForm } from "./ComposeForm";

export function ComposeModal() {
  const { composeOpen, closeCompose } = useApp();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (composeOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [composeOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!composeOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCompose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [composeOpen, closeCompose]);

  if (!composeOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-sm"
      onClick={closeCompose}
      aria-modal="true"
      role="dialog"
      aria-label="Create post"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <button
            onClick={closeCompose}
            type="button"
            aria-label="Close"
            className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ComposeForm onSuccess={closeCompose} />
      </div>
    </div>
  );
}
