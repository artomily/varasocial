"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/80 backdrop-blur-md sm:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-accent" : "text-secondary"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.8} />
          </Link>
        );
      })}
    </nav>
  );
}
