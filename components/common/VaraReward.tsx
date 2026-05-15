import { Coins } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function VaraReward({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-vara-reward/15 px-2 py-0.5 text-xs font-medium text-vara-reward">
      <Coins className="h-3.5 w-3.5" />
      {amount.toFixed(1)} {BRAND.token}
    </span>
  );
}
