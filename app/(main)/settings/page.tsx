import {
  User,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Download,
  ChevronRight,
} from "lucide-react";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { label: "Profile", description: "Edit your public info", icon: User },
      { label: "Security", description: "Wallet & auth settings", icon: Shield },
      { label: "Privacy", description: "Control who sees your data", icon: Key },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Appearance", description: "Theme & display options", icon: Palette },
      { label: "Language", description: "Content language preferences", icon: Globe },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "0G Storage", description: "Manage your decentralized storage", icon: Database },
      { label: "Export Data", description: "Download all your data (1-click)", icon: Download },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="border-b border-border">
          <h2 className="px-4 pt-4 pb-2 text-sm font-bold text-secondary">
            {group.title}
          </h2>
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/50"
              >
                <Icon className="h-5 w-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-secondary">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-secondary" />
              </button>
            );
          })}
        </div>
      ))}

      <div className="p-4 text-center text-xs text-secondary">
        VaraSocial v0.1.0 · Powered by 0G Decentralized Storage
      </div>
    </div>
  );
}
