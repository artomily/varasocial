"use client";

import { SlidersHorizontal, Brain, Shield, Globe, Star } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/store";

const models = [
  { name: "DeepSeek", description: "Best for multi-language content", active: true },
  { name: "Llama", description: "Fast, general-purpose filtering", active: false },
  { name: "Mistral", description: "European language specialist", active: false },
];

const filters = [
  { label: "Filter Hoax Content", icon: Shield, enabled: true },
  { label: "Language Preference", icon: Globe, enabled: true },
  { label: "Topic Curation", icon: Brain, enabled: false },
];

export default function AIFilterPage() {
  const { userSubscription } = useApp();
  const isBlue = !!userSubscription;

  if (!isBlue) {
    return (
      <div>
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
          <h1 className="text-xl font-bold">DeAI Content Filter</h1>
          <p className="text-sm text-secondary">Blue plan feature</p>
        </div>
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Star className="h-8 w-8 text-accent" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Blue Plan Required</h2>
          <p className="mb-6 text-secondary">
            AI Content Filter is exclusive to Blue subscribers. Choose your AI model, control your
            feed with no platform algorithm.
          </p>
          <Link
            href="/monetize"
            className="rounded-full bg-accent px-6 py-2.5 font-bold text-white transition-colors hover:bg-accent/90"
          >
            Get Blue Plan
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">DeAI Content Filter</h1>
        <p className="text-sm text-secondary">Choose your AI, control your feed</p>
      </div>

      {/* AI Model Selection */}
      <div className="border-b border-border p-4">
        <h2 className="mb-3 font-bold">AI Model</h2>
        <div className="flex flex-col gap-2">
          {models.map((model) => (
            <div
              key={model.name}
              className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                model.active ? "bg-accent/10 ring-1 ring-accent" : "bg-surface hover:bg-surface-hover"
              }`}
            >
              <div>
                <p className="font-bold">{model.name}</p>
                <p className="text-sm text-secondary">{model.description}</p>
              </div>
              <div
                className={`h-5 w-5 rounded-full border-2 ${
                  model.active ? "border-accent bg-accent" : "border-secondary"
                }`}
              >
                {model.active && (
                  <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Rules */}
      <div className="p-4">
        <h2 className="mb-3 font-bold">Filter Rules</h2>
        <div className="flex flex-col gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <div
                key={filter.label}
                className="flex items-center justify-between rounded-xl bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-accent" />
                  <span>{filter.label}</span>
                </div>
                <div
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                    filter.enabled ? "bg-accent" : "bg-border"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      filter.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface p-4 text-sm text-secondary">
          <SlidersHorizontal className="h-5 w-5 shrink-0" />
          <span>Your feed is curated by your chosen AI model. No platform algorithm controls what you see.</span>
        </div>
      </div>
    </div>
  );
}
