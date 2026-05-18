"use client";

import { useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import { useAccount } from "wagmi";
import { useApp } from "@/lib/store";

const LS_BANNER_DISMISSED = "vara-banner-dismissed";

export function WalletConnectBanner() {
  const { isConnected } = useAccount();
  const { openOnboardingModal } = useApp();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem(LS_BANNER_DISMISSED) === "1";
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(LS_BANNER_DISMISSED, "1");
    setDismissed(true);
  };

  if (!mounted || isConnected || dismissed) return null;

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-accent/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
            <Wallet className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Connect your wallet to get started</p>
            <p className="text-xs text-secondary">
              Post, like, comment, and earn rewards on VaraSocial.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={openOnboardingModal}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Connect Wallet
          </button>
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-hover"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
