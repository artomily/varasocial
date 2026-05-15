"use client";

import { useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { formatEther } from "viem";
import {
  Megaphone,
  Target,
  Coins,
  Sparkles,
  CircleDollarSign,
  Upload,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { createAdCampaign, fetchAdCampaignValidation } from "@/lib/supabase-queries";
import { zeroGTestnet } from "@/lib/wagmi-config";

// ---- Contract config -------------------------------------------------------

const GATEKEEPER_ADDRESS = process.env
  .NEXT_PUBLIC_GATEKEEPER_ADDRESS as `0x${string}` | undefined;

const GATEKEEPER_ABI = [
  {
    name: "adPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "requestAdPlacement",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "campaignId", type: "bytes32" }],
    outputs: [],
  },
] as const;

/** Encode a UUID string as bytes32 (16-byte UUID hex + 16 zero bytes). */
const uuidToBytes32 = (uuid: string): `0x${string}` =>
  `0x${uuid.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;

// ---- Step types ------------------------------------------------------------

type Step = "form" | "payment" | "validating";

const placementOptions = ["feed", "explore", "profile"];

// ---- Page ------------------------------------------------------------------

export default function AdsSetupPage() {
  const { currentUser } = useApp();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ---- Form state ----------------------------------------------------------

  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("traffic");
  const [budget, setBudget] = useState(100);
  const [placements, setPlacements] = useState<string[]>(["feed"]);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativePreview, setCreativePreview] = useState<string | null>(null);
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const [creativeRouteHash, setCreativeRouteHash] = useState<string | null>(null);

  // ---- Wizard state --------------------------------------------------------

  const [step, setStep] = useState<Step>("form");
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ---- Tx + AI result state ------------------------------------------------

  const [txTimedOut, setTxTimedOut] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiResult, setAiResult] = useState<{ approved: boolean; reason: string } | null>(null);
  const txCalledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Chain / contract hooks ----------------------------------------------

  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const { data: adPrice } = useReadContract({
    address: GATEKEEPER_ADDRESS,
    abi: GATEKEEPER_ABI,
    functionName: "adPrice",
    chainId: zeroGTestnet.id,
    query: { enabled: !!GATEKEEPER_ADDRESS },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    error: txError,
    reset: resetTx,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: zeroGTestnet.id,
    query: { enabled: !!txHash && !txTimedOut },
  });

  const isWrongChain = mounted && chainId !== zeroGTestnet.id;
  const isLoading = !txTimedOut && (isTxPending || isConfirming || isSwitching);

  // ---- 60-second tx timeout ------------------------------------------------

  useEffect(() => {
    if (txHash && !isSuccess) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTxTimedOut(false);
      timeoutRef.current = setTimeout(() => setTxTimedOut(true), 60_000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash]);

  // ---- Poll Supabase for AI result after tx confirmed ----------------------

  useEffect(() => {
    if (!isSuccess || !txHash || txCalledRef.current) return;
    if (!savedCampaignId) return;

    txCalledRef.current = true;
    setAiValidating(true);
    setStep("validating");

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 3 s = 3 min

    pollRef.current = setInterval(async () => {
      attempts++;
      const result = await fetchAdCampaignValidation(savedCampaignId);
      if (result) {
        if (pollRef.current) clearInterval(pollRef.current);
        setAiValidating(false);
        setAiResult({ approved: result.approved, reason: result.aiReport });
      } else if (attempts >= MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setAiValidating(false);
        setAiResult({
          approved: false,
          reason:
            "Validation timed out — the AI validator may be busy. Your payment will be refunded on-chain within 24 hours via the safety hatch.",
        });
      }
    }, 3_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, txHash]);

  // ---- Handlers ------------------------------------------------------------

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

  const togglePlacement = (placement: string) =>
    setPlacements((prev) =>
      prev.includes(placement) ? prev.filter((p) => p !== placement) : [...prev, placement],
    );

  /** Step 1 → Step 2: save draft to Supabase, get UUID, advance to payment. */
  const handleSaveDraft = async () => {
    if (!currentUser) return;
    setSavingCampaign(true);
    setSaveError(null);
    const campaign = await createAdCampaign(
      currentUser.id,
      title || "Untitled campaign",
      objective,
      budget,
      placements,
      creativeRouteHash ?? undefined,
    );
    setSavingCampaign(false);
    if (!campaign) {
      setSaveError("Failed to save campaign — please try again.");
      return;
    }
    setSavedCampaignId(campaign.id);
    setStep("payment");
  };

  /** Step 2: switch chain or submit requestAdPlacement on-chain. */
  const handlePay = async () => {
    if (!currentUser || !savedCampaignId) return;

    if (isWrongChain) {
      try {
        await switchChain({ chainId: zeroGTestnet.id });
      } catch {
        try {
          await (
            window as Window & {
              ethereum?: {
                request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
              };
            }
          ).ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x40DA", // 16602
                chainName: "0G Newton Testnet",
                nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
                rpcUrls: ["https://evmrpc-testnet.0g.ai"],
                blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
              },
            ],
          });
        } catch (err) {
          console.error("Failed to add 0G network:", err);
        }
      }
      return;
    }

    if (!GATEKEEPER_ADDRESS) {
      console.error("NEXT_PUBLIC_GATEKEEPER_ADDRESS env var not set");
      return;
    }
    if (!adPrice) {
      console.error("adPrice not loaded from contract yet");
      return;
    }

    setTxTimedOut(false);
    txCalledRef.current = false;
    setAiResult(null);
    setAiValidating(false);
    resetTx();

    writeContract({
      address: GATEKEEPER_ADDRESS,
      abi: GATEKEEPER_ABI,
      functionName: "requestAdPlacement",
      args: [uuidToBytes32(savedCampaignId)],
      value: adPrice,
      chainId: zeroGTestnet.id,
    });
  };

  const handleStartOver = () => {
    setAiResult(null);
    setTxTimedOut(false);
    txCalledRef.current = false;
    setSavedCampaignId(null);
    setSaveError(null);
    setStep("form");
    resetTx();
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div>
      {/* AI validating spinner overlay */}
      {aiValidating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl ring-1 ring-border">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Reviewing Your Ad</h2>
            <p className="mb-2 text-sm text-secondary">
              VaraAI is moderating your ad for SARA, racism, and harmful material. This usually
              takes 10–30 seconds.
            </p>
            {txHash && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-xs text-secondary hover:text-accent"
              >
                <ExternalLink className="h-3 w-3" />
                View tx on 0G Explorer
              </a>
            )}
          </div>
        </div>
      )}

      {/* AI rejected modal */}
      {!aiValidating && aiResult && !aiResult.approved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl ring-1 ring-border">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <ShieldCheck className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Ad Not Approved</h2>
            <p className="mb-4 text-sm text-secondary">
              VaraAI rejected your ad content. Your payment has been{" "}
              <span className="font-semibold text-green-500">refunded on-chain</span>.
            </p>
            <div className="mb-5 rounded-xl bg-red-500/10 px-4 py-3 text-left text-xs text-red-500">
              <p className="mb-1 font-semibold">AI Reason:</p>
              <p>{aiResult.reason}</p>
            </div>
            {txHash && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface"
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </a>
            )}
            <button
              onClick={handleStartOver}
              className="w-full rounded-full bg-accent py-3 font-bold text-white"
            >
              Edit & Resubmit
            </button>
          </div>
        </div>
      )}

      {/* AI approved modal */}
      {!aiValidating && aiResult && aiResult.approved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl ring-1 ring-border">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Ad Approved!</h2>
            <p className="mb-3 text-sm text-secondary">
              Your ad passed AI moderation and is now active. It will appear in your selected
              placements.
            </p>
            {aiResult.reason && (
              <div className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-left text-xs text-green-500">
                <p className="mb-1 font-semibold">AI Verdict:</p>
                <p>{aiResult.reason}</p>
              </div>
            )}
            {txHash && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface"
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </a>
            )}
            <button
              onClick={handleStartOver}
              className="w-full rounded-full bg-accent py-3 font-bold text-white"
            >
              Create Another Ad
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("form")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">Ads Setup</h1>
            <p className="text-sm text-secondary">
              {step === "form"
                ? "Step 1 of 2 — Campaign details"
                : step === "payment"
                  ? "Step 2 of 2 — Payment & AI review"
                  : "Reviewing your ad…"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* STEP 1: Form */}
        {step === "form" && (
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
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Ad Creative
                </span>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-6 transition-colors hover:bg-surface">
                  {creativePreview ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={creativePreview}
                        alt="Creative"
                        className="max-h-40 w-full rounded-xl object-cover"
                      />
                      {uploadingCreative && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-secondary" />
                      <span className="text-sm text-secondary">
                        Click to upload — stored on 0G
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleCreativeChange}
                  />
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
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Campaign name
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Launch-week sponsor"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-secondary"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Objective
                </span>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
                >
                  <option value="traffic">Traffic</option>
                  <option value="awareness">Awareness</option>
                  <option value="conversions">Conversions</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Budget
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                  <CircleDollarSign className="h-4 w-4 text-secondary" />
                  <input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Placements
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {placementOptions.map((placement) => (
                    <button
                      key={placement}
                      onClick={() => togglePlacement(placement)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                        placements.includes(placement)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-secondary"
                      }`}
                    >
                      {placement}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <p className="flex items-center gap-1.5 text-sm text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  {saveError}
                </p>
              )}

              <button
                onClick={handleSaveDraft}
                disabled={savingCampaign || !currentUser}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
              >
                {savingCampaign ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Continue to Payment
                  </>
                )}
              </button>
              {!currentUser && (
                <p className="text-xs text-secondary">Connect your wallet first</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Payment */}
        {(step === "payment" || step === "validating") && savedCampaignId && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-[28px] border border-border bg-surface/80 p-5">
              <h2 className="mb-4 font-bold">Campaign Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-secondary">Name</dt>
                  <dd className="font-medium">{title || "Untitled campaign"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Objective</dt>
                  <dd className="font-medium capitalize">{objective}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Budget</dt>
                  <dd className="font-medium">${budget}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Placements</dt>
                  <dd className="font-medium">{placements.join(", ")}</dd>
                </div>
                {creativeRouteHash && (
                  <div className="flex justify-between">
                    <dt className="text-secondary">Creative</dt>
                    <dd className="font-medium text-accent">
                      <a
                        href={`https://storagescan-galileo.0g.ai/tx/${creativeRouteHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        On 0G
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Payment card */}
            <div className="rounded-[28px] border border-accent/30 bg-accent/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">AI Content Moderation</h2>
                  <p className="text-sm text-secondary">
                    Payment is held in escrow until VaraAI reviews your ad.
                  </p>
                </div>
              </div>

              <div className="mb-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {adPrice !== undefined ? formatEther(adPrice) : "…"}
                </span>
                <span className="text-xl font-semibold text-accent">0G</span>
              </div>

              <ul className="mb-6 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  Ad approved → payment forwarded to treasury, ad goes live
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  Ad rejected → payment refunded automatically on-chain
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  No response in 24 h → self-refund available via safety hatch
                </li>
              </ul>

              {(txError || txTimedOut) && (
                <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  {txTimedOut
                    ? `Transaction not confirmed after 60 s. ${txHash ? `Check: https://chainscan-galileo.0g.ai/tx/${txHash}` : ""}`
                    : txError?.message?.slice(0, 160)}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={isLoading || !currentUser || (!isWrongChain && adPrice === undefined)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSwitching
                      ? "Switching network…"
                      : isConfirming
                        ? "Confirming…"
                        : "Waiting for wallet…"}
                  </>
                ) : isWrongChain ? (
                  "Switch to 0G Newton Testnet"
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    {txTimedOut
                      ? "Retry Payment"
                      : `Pay ${adPrice !== undefined ? formatEther(adPrice) : "…"} 0G & Submit`}
                  </>
                )}
              </button>

              {!currentUser && (
                <p className="mt-2 text-center text-xs text-secondary">
                  Connect your wallet first
                </p>
              )}

              {txHash && !txTimedOut && (
                <a
                  href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 text-xs text-secondary hover:text-accent"
                >
                  <ExternalLink className="h-3 w-3" />
                  View tx on 0G Explorer
                </a>
              )}
            </div>
          </div>
        )}

        {/* Info cards — visible on form step only */}
        {step === "form" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <p className="font-semibold">Placement rules</p>
              </div>
              <p className="mt-2 text-sm text-secondary">
                Sponsored cards appear only for non-Blue users unless ad filtering is disabled.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-accent" />
                <p className="font-semibold">Escrow payment</p>
              </div>
              <p className="mt-2 text-sm text-secondary">
                Payment is locked on-chain until AI moderation completes. Rejected ads are refunded
                automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}