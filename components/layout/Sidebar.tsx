"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { Logo } from "@/components/common/Logo";
import { WalletButton } from "@/components/common/WalletButton";
import { Avatar } from "@/components/common/Avatar";
import { CURRENT_USER } from "@/lib/mock-data";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen flex-col justify-between border-r border-border px-2 py-3 xl:w-[275px]">
      {/* Logo */}
      <div>
        <Link href="/" className="mb-2 inline-block">
          <Logo collapsed />
          <span className="sr-only">VaraSocial</span>
        </Link>

        {/* Nav items */}
        <nav className="mt-1 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 rounded-full px-3 py-3 text-xl transition-colors hover:bg-surface-hover xl:pr-6 ${
                  isActive ? "font-bold text-foreground" : "text-foreground/80"
                }`}
              >
                <Icon
                  className="h-[26px] w-[26px]"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Post button */}
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-base font-bold text-white transition-colors hover:bg-accent-hover xl:px-6">
          <Feather className="h-6 w-6 xl:hidden" />
          <span className="hidden xl:inline">Post</span>
        </button>
      </div>

      {/* Bottom: wallet + user */}
      <div className="flex flex-col gap-3">
        <div className="hidden xl:block">
          <WalletButton />
        </div>
        <div className="xl:hidden">
          <WalletButton collapsed />
        </div>

        {/* Current user */}
        <div className="flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-surface-hover">
          <Avatar name={CURRENT_USER.displayName} />
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-sm font-bold">
              {CURRENT_USER.displayName}
            </p>
            <p className="truncate text-sm text-secondary">
              @{CURRENT_USER.handle}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
