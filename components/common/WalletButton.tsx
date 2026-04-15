"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { wagmiConfig } from "@/lib/wagmi-config";

function FallbackButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      disabled
      title="Connect Wallet (WalletConnect project ID not configured)"
      className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-secondary cursor-not-allowed opacity-50"
    >
      <Wallet className="h-5 w-5" />
      {!collapsed && <span>Connect Wallet</span>}
    </button>
  );
}

export function WalletButton({ collapsed = false }: { collapsed?: boolean }) {
  if (!wagmiConfig) {
    return <FallbackButton collapsed={collapsed} />;
  }

  if (collapsed) {
    return (
      <ConnectButton.Custom>
        {({ account, openConnectModal, openAccountModal }) => (
          <button
            onClick={account ? openAccountModal : openConnectModal}
            title={account ? account.displayName : "Connect Wallet"}
            className="flex w-full items-center justify-center rounded-full border border-border py-2.5 text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Wallet className="h-5 w-5" />
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  return (
    <ConnectButton
      label="Connect Wallet"
      chainStatus="icon"
      showBalance={false}
    />
  );
}

