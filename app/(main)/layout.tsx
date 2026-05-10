import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { AppProvider } from "@/lib/store";
import { OnboardingGate } from "@/components/layout/OnboardingGate";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="mx-auto flex min-h-screen max-w-316.25">
        <OnboardingGate />
        {/* Left sidebar — hidden on mobile */}
        <div className="hidden sm:flex">
          <Sidebar />
        </div>

        {/* Center content */}
        <main className="min-h-screen flex-1 border-r border-border max-w-150 sm:border-l">
          {children}
        </main>

        {/* Right panel — hidden below lg */}
        <RightPanel />

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </AppProvider>
  );
}
