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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fetchSubscriptionPlans } from "@/lib/supabase-queries";
import type { SubscriptionPlan } from "@/lib/types";

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    slug: "starter",
    title: "Starter Blue",
    price: 25,
    billingCycle: "month",
    benefits: ["Blue check", "VaraAI access"],
    featured: false,
    active: true,
  },
  {
    id: "creator",
    slug: "creator",
    title: "Creator Blue",
    price: 50,
    billingCycle: "month",
    benefits: ["Blue check", "VaraAI", "AI filter agent", "Ad filter", "Creator earnings"],
    featured: true,
    active: true,
  },
  {
    id: "studio",
    slug: "studio",
    title: "Studio Blue",
    price: 100,
    billingCycle: "month",
    benefits: ["All Creator benefits", "Priority support", "Advanced ad controls"],
    featured: false,
    active: true,
  },
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

export default function MonetizePage() {
  const { currentUser, userSubscription, subscribePlan, saveAdPreference } = useApp();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);

  useEffect(() => {
    fetchSubscriptionPlans().then((loadedPlans) => {
      if (loadedPlans.length > 0) setPlans(loadedPlans);
    });
  }, []);

  const isVerified = Boolean(currentUser?.verified || userSubscription);

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
                <h2 className="text-xl font-bold">Choose your Blue plan</h2>
                <p className="text-sm text-secondary">
                  Non-subscribers will see ads. Blue users unlock VaraAI, AI filter agent, ad filter, and earning eligibility.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-3xl border p-4 ${plan.featured ? "border-accent bg-accent/10" : "border-border bg-background/50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{plan.title}</p>
                        {plan.featured && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary">{plan.price} VARA / {plan.billingCycle}</p>
                    </div>
                    <button
                      onClick={() => subscribePlan(plan.id)}
                      className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                    >
                      Subscribe
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary">
                    {plan.benefits.map((benefit) => (
                      <span key={benefit} className="rounded-full border border-border bg-background/70 px-2.5 py-1">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
