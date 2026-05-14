"use client";

import { Bot, Lock, Pause, Send, Calendar, FileText } from "lucide-react";
import { useApp } from "@/lib/store";
import Link from "next/link";

const agents = [
  { name: "Auto Reply", description: "Handle collab requests from all platforms", status: "active", icon: Send },
  { name: "Auto Post", description: "Schedule and post to multiple platforms", status: "paused", icon: Calendar },
  { name: "Subscriber Manager", description: "Auto handle subscriber interactions", status: "active", icon: FileText },
];

export default function ModeSleepPage() {
  const { userSubscription } = useApp();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold">Mode Sleep</h1>
            <p className="text-sm text-secondary">Your autonomous AI agent</p>
          </div>
        </div>
      </div>

      {!userSubscription ? (
        /* Paywall */
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <Lock className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Mode Sleep is locked</h2>
          <p className="mb-6 max-w-xs text-secondary">
            Upgrade to VaraSocial Blue to unlock your autonomous AI agent that works even while you sleep.
          </p>
          <Link
            href="/monetize"
            className="rounded-full bg-accent px-6 py-3 font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Unlock with Blue — 0.05 0G
          </Link>
        </div>
      ) : (
        <>
          {/* Agent status */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between rounded-xl bg-accent/10 p-4">
              <div>
                <p className="font-bold text-accent">Agent Active</p>
                <p className="text-sm text-secondary">Running for 18h 32m</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-truth-hoax/20 p-2 text-truth-hoax transition-colors hover:bg-truth-hoax/30">
                  <Pause className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Agent config */}
          <div className="p-4">
            <h2 className="mb-3 font-bold">Agent Tasks</h2>
            <div className="flex flex-col gap-2">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between rounded-xl bg-surface p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-bold">{agent.name}</p>
                        <p className="text-sm text-secondary">{agent.description}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        agent.status === "active"
                          ? "bg-truth-valid/20 text-truth-valid"
                          : "bg-border text-secondary"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily report */}
          <div className="mx-4 rounded-xl border border-border p-4">
            <h2 className="mb-2 font-bold">Today&apos;s Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-secondary">Requests handled</p>
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-secondary">Posts scheduled</p>
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-secondary">Deals approved</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
