"use client";

import { Wallet } from "lucide-react";

export function WalletButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
      onClick={() => {}}
    >
      <Wallet className="h-5 w-5" />
      {!collapsed && <span>Connect Wallet</span>}
    </button>
  );
}
