"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Wallet, AtSign } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useApp } from "@/lib/store";

export function OnboardingGate() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { currentUser, completeUsername } = useApp();
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.handle && !currentUser.usernameSetAt) {
      setHandle(currentUser.handle.replace(/^user-/, ""));
    }
  }, [currentUser]);

  const needsConnect = !isConnected || !address;
  const needsUsername = Boolean(address) && Boolean(currentUser) && !currentUser?.usernameSetAt;
  
  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };

  if (!needsConnect && !needsUsername) return null;

  const submitUsername = async () => {
    const nextHandle = handle.trim();
    if (!nextHandle || !currentUser) return;
    setSubmitting(true);
    try {
      await completeUsername(nextHandle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-lg">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface/95 p-6 shadow-2xl shadow-black/30">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold">Welcome to VaraSocial</p>
            <p className="text-sm text-secondary">Connect your wallet, then claim your username.</p>
          </div>
        </div>

        {needsConnect && (
          <div className="mb-4 rounded-2xl border border-border bg-background/60 p-4">
            <p className="mb-1 text-sm font-semibold">Step 1 · Connect wallet</p>
            <p className="text-sm text-secondary">Your wallet is your identity in VaraSocial.</p>
            <div className="mt-4">
              <button
                onClick={handleConnectWallet}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {needsUsername && (
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="mb-1 text-sm font-semibold">Step 2 · Create username</p>
            <p className="text-sm text-secondary">Pick a unique handle for your public profile.</p>
            <label className="mt-4 block text-xs font-medium text-secondary">Username</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2.5">
              <AtSign className="h-4 w-4 text-secondary" />
              <input
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="your-handle"
                className="w-full bg-transparent text-sm outline-none placeholder:text-secondary"
              />
            </div>
            <button
              onClick={submitUsername}
              disabled={submitting || !handle.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Saving..." : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}