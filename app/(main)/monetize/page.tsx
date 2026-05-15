"use client";

import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { zeroGTestnet } from "@/lib/wagmi-config";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Info,
  Loader2,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useApp } from "@/lib/store";

const PLAN_BENEFITS = [
  "Blue check verification",
  "VaraAI feed scoring",
  "Mode Sleep AI agent",
  "Ad-free experience",
  "Creator earnings eligibility",
];

const AI_CRITERIA = [
  { label: "Content Originality", description: "AI checks for unique, non-plagiarised content", icon: CheckCircle2 },
  { label: "Engagement Quality", description: "Measures audience interaction depth, not just raw numbers", icon: TrendingUp },
  { label: "Truth Score ≥ 70", description: "Only verified or high-truth-score posts qualify for rewards", icon: BadgeCheck },
  { label: "Community Value", description: "AI evaluates educational and informational merit", icon: Bot },
];

const MOCK_PAYOUTS = [
  { id: 1, date: "Apr 1, 2026", amount: 45.2, posts: 3, status: "paid" },
  { id: 2, date: "Mar 15, 2026", amount: 28.7, posts: 2, status: "paid" },
  { id: 3, date: "Mar 1, 2026", amount: 12.5, posts: 1, status: "paid" },
  { id: 4, date: "Apr 14, 2026", amount: 38.1, posts: 4, status: "pending" },
];

export default function MonetizePage() {
  const { currentUser, userSubscription, subscribePlan, saveAdPreference } = useApp();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending: isTxPending, error: txError } = useSendTransaction();
  const [showSuccess, setShowSuccess] = useState(false);
  const subscribeCalledRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [txTimedOut, setTxTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disable the receipt watcher once timed out so it stops polling the RPC
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash: txHash,
    chainId: zeroGTestnet.id,
    query: { enabled: !!txHash && !txTimedOut },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Start a 60-second timeout as soon as we have a txHash and are waiting for confirmation
  useEffect(() => {
    if (txHash && !isSuccess) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTxTimedOut(false);
      timeoutRef.current = setTimeout(() => {
        setTxTimedOut(true);
      }, 60_000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash]);

  useEffect(() => {
    if (isSuccess && txHash && !subscribeCalledRef.current) {
      subscribeCalledRef.current = true;
      setShowSuccess(true);
      subscribePlan("blue", txHash);
    }
  }, [isSuccess, txHash, subscribePlan]);

  const isSubscribed = Boolean(userSubscription);
  // Defer chain-dependent state until after hydration to avoid server/client mismatch
  const isWrongChain = mounted && chainId !== zeroGTestnet.id;
  const isLoading = !txTimedOut && (isTxPending || isConfirming || isSwitching);

  const handlePay = async () => {
    if (!currentUser) return;
    if (isWrongChain) {
      try {
        // Try switching first; if the chain doesn't exist in wallet yet, add it
        await switchChain({ chainId: zeroGTestnet.id });
      } catch {
        try {
          await (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x40DA", // 16602 in hex
              chainName: "0G Newton Testnet",
              nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
              rpcUrls: ["https://evmrpc-testnet.0g.ai"],
              blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
            }],
          });
        } catch (addErr) {
          console.error("Failed to add 0G network:", addErr);
        }
      }
      return;
    }
    const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    if (!treasury) {
      console.error("NEXT_PUBLIC_TREASURY_ADDRESS env var not set");
      return;
    }
    setTxTimedOut(false);
    subscribeCalledRef.current = false;
    sendTransaction({ to: treasury as `0x${string}`, value: parseEther("0.05"), chainId: zeroGTestnet.id });
  };

  return (
    <div className="relative">
      {/* Success modal */}
      {showSuccess && txHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl ring-1 ring-border">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-truth-valid/20">
              <CheckCircle2 className="h-8 w-8 text-truth-valid" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Payment Successful!</h2>
            <p className="mb-5 text-sm text-secondary">
              You&apos;re now a VaraSocial Blue member. VaraAI and Mode Sleep are unlocked.
            </p>
            <p className="mb-5 break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-secondary">
              {txHash}
            </p>
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-hover"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full rounded-full bg-accent py-3 font-bold text-white transition-colors hover:bg-accent-hover"
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Monetize</h1>
        <p className="text-sm text-secondary">Earn $VARA from your content</p>
      </div>

      {/* Not subscribed — payment card */}
      {!isSubscribed && (
        <div className="border-b border-border px-4 py-6">
          <div className="rounded-[28px] border border-accent/30 bg-accent/5 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">VaraSocial Blue</h2>
                <p className="text-sm text-secondary">One-time payment on 0G testnet</p>
              </div>
            </div>

            <div className="mb-5 flex items-baseline gap-2">
              <span className="text-4xl font-bold">0.05</span>
              <span className="text-xl font-semibold text-accent">0G</span>
            </div>

            <ul className="mb-6 space-y-2">
              {PLAN_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-truth-valid" />
                  {b}
                </li>
              ))}
            </ul>

            {(txError || txTimedOut) && (
              <p className="mb-3 rounded-xl bg-truth-hoax/10 px-3 py-2 text-xs text-truth-hoax">
                {txTimedOut
                  ? `Transaction not confirmed after 60s — it may be stuck or dropped. ${txHash ? `Check explorer: https://chainscan-galileo.0g.ai/tx/${txHash}` : ""}`
                  : txError?.message?.slice(0, 120)}
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={isLoading || !currentUser}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSwitching ? "Switching network…" : isConfirming ? "Confirming…" : "Waiting for wallet…"}
                </>
              ) : isWrongChain ? (
                "Switch to 0G Testnet"
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  {txTimedOut ? "Retry Payment" : "Pay 0.05 0G"}
                </>
              )}
            </button>

            {!currentUser && (
              <p className="mt-2 text-center text-xs text-secondary">Connect your wallet first</p>
            )}
          </div>
        </div>
      )}

      {/* Subscribed state */}
      {isSubscribed && (
        <div className="divide-y divide-border">
          {/* Status card */}
          <div className="p-4">
            <div className="flex items-center justify-between rounded-2xl bg-accent/10 p-4 ring-1 ring-accent">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-bold">Monetization Active</p>
                  <p className="text-sm text-secondary">VaraAI is evaluating your posts</p>
                </div>
              </div>
              <div className="h-6 w-11 rounded-full bg-accent p-0.5">
                <div className="h-5 w-5 translate-x-5 rounded-full bg-white transition-transform" />
              </div>
            </div>
            {userSubscription?.ogTxHash && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${userSubscription.ogTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-secondary hover:text-accent"
              >
                <ExternalLink className="h-3 w-3" />
                View payment on 0G Explorer
              </a>
            )}
          </div>

          {/* Pending payout */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Current Cycle</h2>
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-vara-reward" />
                <div>
                  <p className="text-sm text-secondary">Pending payout</p>
                  <p className="text-xl font-bold text-vara-reward">38.1 $VARA</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-secondary">4 qualifying posts</p>
                <p className="text-xs text-secondary">Pays out Apr 30</p>
              </div>
            </div>
          </div>

          {/* Payout wallet */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Payout Wallet</h2>
            <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
              <Wallet className="h-5 w-5 text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-secondary">Connected wallet</p>
                <p className="truncate font-mono text-sm">{currentUser?.walletAddress ?? "Connect wallet first"}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary">Minimum payout threshold: 10 $VARA</p>
          </div>

          {/* AI evaluation criteria */}
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-bold">AI Evaluation Criteria</h2>
              <Info className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex flex-col gap-2">
              {AI_CRITERIA.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex items-start gap-3 rounded-xl bg-surface p-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-bold">{c.label}</p>
                      <p className="text-sm text-secondary">{c.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => saveAdPreference({ hideAds: true, filterAiAds: true })}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-hover"
              >
                <Megaphone className="h-4 w-4" /> Hide ads
              </button>
              <button
                onClick={() => saveAdPreference({ hideAds: false, filterAiAds: true })}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-hover"
              >
                <Bot className="h-4 w-4" /> AI filter ads
              </button>
            </div>
          </div>

          {/* Payout history */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Payout History</h2>
            <div className="overflow-hidden rounded-xl bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-normal text-secondary">Date</th>
                    <th className="px-4 py-3 text-left font-normal text-secondary">Posts</th>
                    <th className="px-4 py-3 text-right font-normal text-secondary">Amount</th>
                    <th className="px-4 py-3 text-right font-normal text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PAYOUTS.map((p, i) => (
                    <tr key={p.id} className={i < MOCK_PAYOUTS.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3">{p.date}</td>
                      <td className="px-4 py-3 text-secondary">{p.posts}</td>
                      <td className="px-4 py-3 text-right font-bold text-vara-reward">{p.amount} $VARA</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "paid" ? "bg-truth-valid/20 text-truth-valid" : "bg-truth-suspicious/20 text-truth-suspicious"}`}>
                          {p.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
