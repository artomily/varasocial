"use client";

import { useState } from "react";
import { X, Copy, Check, Database } from "lucide-react";

interface RootHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootHash: string;
}

export function RootHashModal({ isOpen, onClose, rootHash }: RootHashModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rootHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-lg">
      <div className="relative w-full max-w-lg rounded-[28px] border border-border bg-gradient-to-b from-accent/20 to-accent/5 p-8 shadow-2xl shadow-black/30">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-secondary/60 transition-colors hover:bg-surface-hover hover:text-secondary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20">
            <Database className="h-10 w-10 text-accent" />
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-2xl font-bold">Your 0G Storage Root Hash</h2>
          <p className="mb-6 text-sm text-secondary">
            This hash represents your data stored on 0G decentralized storage.
          </p>

          {/* Root Hash Display */}
          <div className="w-full rounded-2xl border border-border bg-background/60 p-4">
            <p className="mb-2 text-xs font-medium text-secondary">Root Hash</p>
            <div className="break-all font-mono text-sm text-foreground">
              {rootHash}
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copy Root Hash
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-sm text-secondary hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
