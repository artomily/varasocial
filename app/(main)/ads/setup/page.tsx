"use client";

import { useState } from "react";
import { Megaphone, Target, Coins, Sparkles, CircleDollarSign } from "lucide-react";
import { useApp } from "@/lib/store";
import { createAdCampaign } from "@/lib/supabase-queries";

const placementOptions = ["feed", "explore", "profile"];

export default function AdsSetupPage() {
  const { currentUser } = useApp();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("traffic");
  const [budget, setBudget] = useState(100);
  const [placements, setPlacements] = useState<string[]>(["feed"]);
  const [status, setStatus] = useState<string | null>(null);

  const togglePlacement = (placement: string) => {
    setPlacements((prev) =>
      prev.includes(placement)
        ? prev.filter((item) => item !== placement)
        : [...prev, placement],
    );
  };

  const saveCampaign = async () => {
    if (!currentUser) return;
    const campaign = await createAdCampaign(
      currentUser.id,
      title || "Untitled campaign",
      objective,
      budget,
      placements,
    );
    setStatus(campaign ? "Campaign saved" : "Failed to save campaign");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Ads Setup</h1>
        <p className="text-sm text-secondary">Create sponsored placements for VaraSocial.</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-[28px] border border-border bg-surface/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Campaign draft</h2>
              <p className="text-sm text-secondary">Set objective, budget, and placements.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Campaign name</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Launch-week sponsor"
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-secondary"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Objective</span>
              <select
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
              >
                <option value="traffic">Traffic</option>
                <option value="awareness">Awareness</option>
                <option value="conversions">Conversions</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Budget</span>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <CircleDollarSign className="h-4 w-4 text-secondary" />
                <input
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Placements</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {placementOptions.map((placement) => (
                  <button
                    key={placement}
                    onClick={() => togglePlacement(placement)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${placements.includes(placement) ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-secondary"}`}
                  >
                    {placement}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveCampaign}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
            >
              <Sparkles className="h-4 w-4" />
              Save campaign
            </button>

            {status && <p className="text-sm text-secondary">{status}</p>}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <p className="font-semibold">Placement rules</p>
            </div>
            <p className="mt-2 text-sm text-secondary">Sponsored cards will be inserted only for non-Blue users unless ad filtering is disabled.</p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              <p className="font-semibold">Monetization scope</p>
            </div>
            <p className="mt-2 text-sm text-secondary">This page only stores setup data in Supabase. Server-side delivery and bidding come later.</p>
          </div>
        </div>
      </div>
    </div>
  );
}