"use client";

import { Megaphone, X } from "lucide-react";
import { useState } from "react";

interface AdSlotCardProps {
  placement?: "feed" | "explore" | "profile";
}

const AD_EXAMPLES = [
  {
    brand: "VaraProtocol",
    handle: "@varaprotocol",
    headline: "Earn more with staking on VaraChain",
    body: "Stake your VARA tokens and earn up to 18% APY. Trusted by 50,000+ holders.",
    cta: "Start Staking",
    ctaHref: "#",
    pill: "DeFi",
  },
  {
    brand: "Web4 Studio",
    handle: "@web4studio",
    headline: "Build your next dApp in minutes",
    body: "Templates, tools, and one-click deployment for Vara ecosystem builders.",
    cta: "Try Free",
    ctaHref: "#",
    pill: "Dev Tools",
  },
  {
    brand: "CryptoAcademy",
    handle: "@cryptoacademy",
    headline: "Learn blockchain development — cohort open",
    body: "Join 12-week intensive program taught by top Solana & Vara engineers.",
    cta: "Apply Now",
    ctaHref: "#",
    pill: "Education",
  },
];

let adIndex = 0;

export function AdSlotCard({ placement = "feed" }: AdSlotCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const ad = AD_EXAMPLES[adIndex % AD_EXAMPLES.length];
  // Cycle ads per render mount so different slots show different ads
  adIndex++;

  if (dismissed) return null;

  return (
    <div className="relative border-b border-border px-4 py-3 bg-surface/30">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-full p-1 text-secondary hover:bg-surface-hover hover:text-foreground"
        aria-label="Dismiss ad"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Sponsored label */}
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-secondary">
        <Megaphone className="h-3 w-3" />
        <span>Sponsored · {placement}</span>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium">
          {ad.pill}
        </span>
      </div>

      {/* Brand row */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
          {ad.brand[0]}
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">{ad.brand}</p>
          <p className="text-xs text-secondary">{ad.handle}</p>
        </div>
      </div>

      {/* Copy */}
      <p className="mb-0.5 text-[15px] font-semibold">{ad.headline}</p>
      <p className="text-[14px] text-secondary">{ad.body}</p>

      {/* CTA */}
      <a
        href={ad.ctaHref}
        className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent/90"
      >
        {ad.cta}
      </a>

      {/* Upgrade nudge */}
      <p className="mt-2 text-[11px] text-secondary">
        Get{" "}
        <a href="/monetize" className="text-accent hover:underline">
          Blue Plan
        </a>{" "}
        to remove ads.
      </p>
    </div>
  );
}
