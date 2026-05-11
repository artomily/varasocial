"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { MORE_NAV_ITEMS } from "@/lib/constants";

export function MoreMenu({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={open ? "Close menu" : "More menu"}
        className={`group flex items-center gap-4 rounded-full px-3 py-3 text-xl transition-colors hover:bg-surface-hover ${
          collapsed ? "justify-center" : "justify-start pr-6"
        } ${open ? "bg-surface-hover font-bold text-foreground" : "text-foreground/80"}`}
      >
        {open ? (
          <X className="h-6.5 w-6.5 shrink-0" strokeWidth={2.5} />
        ) : (
          <MoreHorizontal className="h-6.5 w-6.5 shrink-0" strokeWidth={1.8} />
        )}
        {!collapsed && <span>More</span>}
      </button>

      {/* Dropdown menu */}
      {open && !collapsed && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl border border-border bg-surface/95 shadow-lg">
          {MORE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover first:rounded-t-2xl last:rounded-b-2xl ${
                  isActive ? "font-bold text-accent" : "text-foreground/80"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
