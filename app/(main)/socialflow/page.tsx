import { TrendingUp, Coins, BarChart3, Zap } from "lucide-react";
import { BRAND } from "@/lib/constants";

const stats = [
  { label: "Total Earned", value: `1,245 ${BRAND.token}`, icon: Coins, color: "text-vara-reward" },
  { label: "Virality Score", value: "78", icon: TrendingUp, color: "text-accent" },
  { label: "Monetized Posts", value: "34", icon: BarChart3, color: "text-truth-valid" },
  { label: "Active Subscribers", value: "128", icon: Zap, color: "text-truth-suspicious" },
];

export default function SocialFlowPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">SocialFlow</h1>
        <p className="text-sm text-secondary">AI-powered monetization dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-surface p-4">
              <Icon className={`mb-2 h-6 w-6 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-secondary">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Placeholder chart area */}
      <div className="mx-4 rounded-xl border border-border p-8 text-center">
        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-secondary" />
        <p className="text-secondary">Earnings chart coming soon</p>
        <p className="text-xs text-secondary">Smart contract-powered transparent payouts</p>
      </div>
    </div>
  );
}
