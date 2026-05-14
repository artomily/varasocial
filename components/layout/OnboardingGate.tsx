"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Wallet, AtSign } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useApp } from "@/lib/store";

const LS_KEY = "vara-onboarding-complete";

export function OnboardingGate() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { currentUser, completeUsername, loading } = useApp();
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Once we confirm the user has a username, persist the flag so future
  // page loads don't flash the modal during the async init window.
  useEffect(() => {
    if (currentUser?.usernameSetAt) {
      localStorage.setItem(LS_KEY, "1");
    }
  }, [currentUser?.usernameSetAt]);

  useEffect(() => {
    if (currentUser?.handle && !currentUser.usernameSetAt) {
      setHandle(currentUser.handle.replace(/^user-/, ""));
    }
  }, [currentUser]);

  // Don't render anything on the server (wallet state is client-only).
  // This eliminates the hydration mismatch entirely.
  if (!mounted) return null;

  const alreadyOnboarded = localStorage.getItem(LS_KEY) === "1";

  const needsConnect = !isConnected || !address;
  // Only show the "creating profile…" spinner for users who haven't completed
  // onboarding yet.  For existing users it would just flash and disappear.
  const waitingForProfile =
    !alreadyOnboarded && isConnected && !!address && loading && !currentUser;
  const needsUsername =
    isConnected && !!address && !loading && !!currentUser && !currentUser.usernameSetAt;

  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };

  if (!needsConnect && !waitingForProfile && !needsUsername) return null;

  const submitUsername = async () => {
    const nextHandle = handle.trim();
    if (!nextHandle || !currentUser) return;
    setSubmitting(true);
    try {
      await completeUsername(nextHandle);
      localStorage.setItem(LS_KEY, "1");
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

        {waitingForProfile && (
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="mb-1 text-sm font-semibold">Step 2 · Preparing profile</p>
            <p className="text-sm text-secondary">Wallet connected. We are creating your account before you choose a username.</p>
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