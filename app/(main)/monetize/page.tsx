"use client";

import {
  BadgeCheck,
  DollarSign,
  Bot,
  TrendingUp,
  CheckCircle2,
  Zap,
  Info,
  Wallet,
  ShieldCheck,
  Megaphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { zeroGGalileo } from "@/lib/wagmi-config";
import { parseAbi } from "viem";

const CONTRACT_ADDRESS = "0x948F0ea80688E175d85D2B08418190AaB24db38d" as const;
const CONTRACT_ABI = parseAbi([
  "function subscriptionPrice() external view returns (uint256)",
  "function requestSubscription() external payable",
]);

const BLUE_PLAN_BENEFITS = [
  { label: "Blue check badge", icon: BadgeCheck },
  { label: "VaraAI access", icon: Bot },
  { label: "No ads", icon: Megaphone },
  { label: "Creator earnings", icon: DollarSign },
];

const MOCK_PAYOUTS = [
  { id: 1, date: "Apr 1, 2026", amount: 45.2, posts: 3, status: "paid" },
  { id: 2, date: "Mar 15, 2026", amount: 28.7, posts: 2, status: "paid" },
  { id: 3, date: "Mar 1, 2026", amount: 12.5, posts: 1, status: "paid" },
  { id: 4, date: "Apr 14, 2026", amount: 38.1, posts: 4, status: "pending" },
];

const AI_CRITERIA = [
  {
    label: "Content Originality",
    description: "AI checks for unique, non-plagiarized content",
    icon: CheckCircle2,
  },
  {
    label: "Engagement Quality",
    description: "Measures audience interaction depth, not just raw numbers",
    icon: TrendingUp,
  },
  {
    label: "Truth Score ≥ 70",
    description: "Only verified or high-truth-score posts qualify for rewards",
    icon: BadgeCheck,
  },
  {
    label: "Community Value",
    description: "AI evaluates educational and informational merit",
    icon: Bot,
  },
];

function SubscribeButton({ onSuccess }: { onSuccess: () => void }) {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [txError, setTxError] = useState<string | null>(null);

  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "subscriptionPrice",
    chainId: zeroGGalileo.id,
  });

  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: zeroGGalileo.id,
  });

  // Call onSuccess once tx is confirmed
  if (isSuccess) {
    onSuccess();
  }

  const onWrongChain = chainId !== zeroGGalileo.id;

  const handleClick = () => {
    setTxError(null);
    if (onWrongChain) {
      switchChain({ chainId: zeroGGalileo.id });
      return;
    }
    if (price === undefined) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "requestSubscription",
        value: price,
        chainId: zeroGGalileo.id,
      },
      {
        onError: (err) => setTxError(err.message.split("\n")[0]),
      }
    );
  };

  const busy = isSwitching || isWriting || isConfirming;
  const label = onWrongChain
    ? "Switch to 0G Network"
    : isWriting
    ? "Confirm in wallet…"
    : isConfirming
    ? "Confirming…"
    : price !== undefined
    ? `Subscribe · ${Number(price) / 1e18} OG`
    : "Loading price…";

  return (
    <div className="mt-5 space-y-2">
      <button
        onClick={handleClick}
        disabled={busy || price === undefined}
        className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </button>
      {txError && (
        <div className="flex items-start gap-2 rounded-xl bg-truth-hoax/10 p-3 text-xs text-truth-hoax">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{txError}</span>
        </div>
      )}
      {txHash && isConfirming && (
        <p className="text-center text-xs text-secondary break-all">
          Tx: {txHash}
        </p>
      )}
    </div>
  );
}

export default function MonetizePage() {
  const { currentUser, userSubscription, subscribePlan, saveAdPreference } = useApp();
  const [pendingOnChain, setPendingOnChain] = useState(false);

  const isVerified = Boolean(currentUser?.verified || userSubscription);

  // Called after on-chain tx confirmed — sync to Supabase
  const handleSubscribeSuccess = () => {
    if (!pendingOnChain) {
      setPendingOnChain(true);
      subscribePlan("blue");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Monetize</h1>
        <p className="text-sm text-secondary">Earn $VARA from your content</p>
      </div>

      {/* Locked state — shown to unverified users */}
      {!isVerified && (
        <div className="border-b border-border px-4 py-6">
          <div className="rounded-[28px] border border-border bg-surface/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Get Blue</h2>
                <p className="text-sm text-secondary">
                  Subscribe to unlock VaraAI, remove ads, and start earning from your content.
                </p>
              </div>
            </div>

            {/* Single Blue plan card */}
            <div className="mt-5 rounded-3xl border border-accent bg-accent/10 p-5">
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck className="h-5 w-5 text-accent" />
                <p className="font-bold text-lg">Blue</p>
              </div>
              <p className="text-sm text-secondary mb-4">
                One plan. Everything included.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BLUE_PLAN_BENEFITS.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-accent shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <SubscribeButton onSuccess={handleSubscribeSuccess} />
            </div>

            {pendingOnChain && (
              <p className="mt-4 text-center text-sm text-secondary">
                Transaction confirmed! Your subscription is being processed by the server…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Monetize settings — shown to verified users */}
      {isVerified && (
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
                  <p className="text-sm text-secondary">
                    VaraAI is evaluating your posts
                  </p>
                </div>
              </div>
              <div className="h-6 w-11 rounded-full bg-accent p-0.5">
                <div className="h-5 w-5 translate-x-5 rounded-full bg-white transition-transform" />
              </div>
            </div>
          </div>

          {/* Pending payout */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Current Cycle</h2>
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-vara-reward" />
                <div>
                  <p className="text-sm text-secondary">Pending payout</p>
                  <p className="text-xl font-bold text-vara-reward">
                    38.1 $VARA
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-secondary">4 qualifying posts</p>
                <p className="text-xs text-secondary">Pays out Apr 30</p>
              </div>
            </div>
          </div>

          {/* Connected wallet */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Payout Wallet</h2>
            <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
              <Wallet className="h-5 w-5 text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-secondary">Connected wallet</p>
                <p className="truncate font-mono text-sm">
                  {currentUser?.walletAddress ?? "Connect wallet first"}
                </p>
              </div>
              <button className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-hover">
                Change
              </button>
            </div>
            <p className="mt-2 text-xs text-secondary">
              Minimum payout threshold: 10 $VARA
            </p>
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
                  <div
                    key={c.label}
                    className="flex items-start gap-3 rounded-xl bg-surface p-4"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-bold">{c.label}</p>
                      <p className="text-sm text-secondary">{c.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-secondary">
              VaraAI automatically scores every post. No manual applications —
              qualifying posts receive $VARA at each monthly cycle.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => saveAdPreference({ hideAds: true, filterAiAds: true })}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-hover"
              >
                <Megaphone className="h-4 w-4" />
                Hide ads
              </button>
              <button
                onClick={() => saveAdPreference({ hideAds: false, filterAiAds: true })}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-hover"
              >
                <Bot className="h-4 w-4" />
                AI filter ads
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
                    <th className="px-4 py-3 text-left text-secondary font-normal">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-secondary font-normal">
                      Posts
                    </th>
                    <th className="px-4 py-3 text-right text-secondary font-normal">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-secondary font-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PAYOUTS.map((p, i) => (
                    <tr
                      key={p.id}
                      className={
                        i < MOCK_PAYOUTS.length - 1
                          ? "border-b border-border"
                          : ""
                      }
                    >
                      <td className="px-4 py-3">{p.date}</td>
                      <td className="px-4 py-3 text-secondary">{p.posts}</td>
                      <td className="px-4 py-3 text-right font-bold text-vara-reward">
                        {p.amount} $VARA
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "paid"
                              ? "bg-truth-valid/20 text-truth-valid"
                              : "bg-truth-suspicious/20 text-truth-suspicious"
                          }`}
                        >
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
