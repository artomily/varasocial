import {
  BadgeCheck,
  DollarSign,
  Bot,
  TrendingUp,
  Lock,
  CheckCircle2,
  Zap,
  Info,
  Wallet,
} from "lucide-react";
import { CURRENT_USER } from "@/lib/mock-data";

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

export default function MonetizePage() {
  const isVerified = CURRENT_USER.verified;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Monetize</h1>
        <p className="text-sm text-secondary">Earn $VARA from your content</p>
      </div>

      {/* Locked state — shown to unverified users */}
      {!isVerified && (
        <div className="flex flex-col items-center gap-6 px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <Lock className="h-10 w-10 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Verification Required</h2>
            <p className="mt-2 max-w-sm text-secondary">
              To monetize your content, you need a blue checkmark. Verified
              creators can earn $VARA based on AI-evaluated post quality.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-bold text-white transition-colors hover:bg-accent-hover">
            <BadgeCheck className="h-5 w-5" />
            Get Verified — 50 $VARA
          </button>
          <p className="text-xs text-secondary">
            One-time fee · Non-refundable · Processed via smart contract
          </p>
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
                  {CURRENT_USER.walletAddress}
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
