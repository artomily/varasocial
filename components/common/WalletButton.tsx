"use client";

import { useEffect, useState } from "react";
import { Wallet, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletButton({ collapsed = false }: { collapsed?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const shortAddr = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  // Return a stable placeholder until the client has mounted so SSR and the
  // first client render always produce identical HTML (no hydration mismatch).
  if (!mounted) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white opacity-50"
      >
        {collapsed ? <Wallet className="h-5 w-5" /> : <span>Connect Wallet</span>}
      </button>
    );
  }

  if (collapsed) {
    return (
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        title={isConnected ? `Disconnect ${shortAddr}` : "Connect Wallet"}
        className="flex w-full items-center justify-center rounded-full border border-border py-2.5 text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        {isConnected ? (
          <LogOut className="h-5 w-5" />
        ) : (
          <Wallet className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover"
      >
        <span>{shortAddr}</span>
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
    >
      <Wallet className="h-5 w-5" />
      <span>Connect Wallet</span>
    </button>
  );
}

