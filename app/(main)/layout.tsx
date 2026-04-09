import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { MobileNav } from "@/components/layout/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1265px]">
      {/* Left sidebar — hidden on mobile */}
      <div className="hidden sm:flex">
        <Sidebar />
      </div>

      {/* Center content */}
      <main className="min-h-screen flex-1 border-r border-border max-w-[600px] sm:border-l">
        {children}
      </main>

      {/* Right panel — hidden below lg */}
      <RightPanel />

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
