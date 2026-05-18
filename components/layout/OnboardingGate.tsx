"use client";

import { useEffect, useState } from "react";
import { Wallet, AtSign, X } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useApp } from "@/lib/store";

const LS_KEY = "vara-onboarding-complete";
const LS_DISMISSED = "vara-onboarding-dismissed";

export function OnboardingGate() {
  const { address, isConnected, status } = useAccount();
  const { connect } = useConnect();
  const { currentUser, completeUsername, loading, showOnboardingModal, closeOnboardingModal, openOnboardingModal } = useApp();
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open modal for first-time visitors who haven't connected
  useEffect(() => {
    if (!mounted) return;
    const alreadyDismissed = localStorage.getItem(LS_DISMISSED) === "1";
    const alreadyOnboarded = localStorage.getItem(LS_KEY) === "1";
    if (!alreadyDismissed && !alreadyOnboarded && status === "disconnected") {
      openOnboardingModal();
    }
  }, [mounted, status, openOnboardingModal]);

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

  // Close modal automatically once onboarding is fully complete
  useEffect(() => {
    if (currentUser?.usernameSetAt && showOnboardingModal) {
      closeOnboardingModal();
    }
  }, [currentUser?.usernameSetAt, showOnboardingModal, closeOnboardingModal]);

  const handleDismissModal = () => {
    localStorage.setItem(LS_DISMISSED, "1");
    closeOnboardingModal();
  };

  if (!mounted) return null;

  const alreadyOnboarded = localStorage.getItem(LS_KEY) === "1";

  const needsConnect = status === "disconnected";
  const waitingForProfile =
    !alreadyOnboarded && isConnected && !!address && loading && !currentUser;
  const needsUsername =
    isConnected && !!address && !loading && !!currentUser && !currentUser.usernameSetAt;

  // Show modal when explicitly opened by the user OR when they've connected
  // but still need to set a username (auto-prompt so they can't skip it).
  const isOpen = showOnboardingModal || needsUsername;

  if (!isOpen) return null;

  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };

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
      <div className="relative w-full max-w-md rounded-[28px] border border-border bg-gradient-to-b from-accent/20 to-accent/5 p-8 shadow-2xl shadow-black/30">
        {/* Close button */}
        {needsConnect && !needsUsername && (
          <button
            onClick={handleDismissModal}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-secondary/60 transition-colors hover:bg-surface-hover hover:text-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {needsConnect && (
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VaraSocial" className="h-14 w-14 object-contain" />
            </div>

            {/* Heading */}
            <h2 className="mb-2 text-3xl font-bold">Welcome to VaraSocial</h2>
            <p className="mb-8 text-sm text-secondary">
              Connect your wallet to start posting, earning rewards, and exploring Web4.
            </p>

            {/* Connect Wallet Button */}
            <button
              onClick={handleConnectWallet}
              className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {waitingForProfile && (
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VaraSocial" className="h-14 w-14 object-contain" />
            </div>

            <h2 className="mb-2 text-3xl font-bold">Setting up your profile</h2>
            <p className="text-sm text-secondary">
              Wallet connected. We are creating your account...
            </p>
          </div>
        )}

        {needsUsername && (
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VaraSocial" className="h-14 w-14 object-contain" />
            </div>

            <h2 className="mb-2 text-3xl font-bold">Choose your username</h2>
            <p className="mb-6 text-sm text-secondary">
              Pick a unique handle for your public profile.
            </p>

            <div className="w-full">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-3">
                <AtSign className="h-5 w-5 text-secondary" />
                <input
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="your-handle"
                  className="w-full bg-transparent text-base outline-none placeholder:text-secondary"
                />
              </div>
              <button
                onClick={submitUsername}
                disabled={submitting || !handle.trim()}
                className="mt-4 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:bg-accent-hover disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
