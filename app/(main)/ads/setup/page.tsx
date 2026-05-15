"use client";

import { useState } from "react";
import { Megaphone, Target, Coins, Sparkles, CircleDollarSign, Upload, ExternalLink, Loader2 } from "lucide-react";
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
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativePreview, setCreativePreview] = useState<string | null>(null);
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const [creativeRouteHash, setCreativeRouteHash] = useState<string | null>(null);

  const handleCreativeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreativeFile(file);
    setCreativePreview(URL.createObjectURL(file));
    setCreativeRouteHash(null);
    setUploadingCreative(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setCreativeRouteHash(json.rootHash ?? null);
      }
    } catch {
      // silent fail
    } finally {
      setUploadingCreative(false);
    }
  };

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
      creativeRouteHash ?? undefined,
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
            {/* Ad Creative Upload */}
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Ad Creative</span>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-6 transition-colors hover:bg-surface">
                {creativePreview ? (
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={creativePreview} alt="Creative" className="max-h-40 w-full rounded-xl object-cover" />
                    {uploadingCreative && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-secondary" />
                    <span className="text-sm text-secondary">Click to upload — stored on 0G</span>
                  </>
                )}
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleCreativeChange} />
              </label>
              {creativeRouteHash && (
                <a
                  href={`https://storagescan-galileo.0g.ai/tx/${creativeRouteHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {creativeFile?.name} saved on 0G
                </a>
              )}
            </div>

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