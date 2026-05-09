"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { Logo } from "@/components/common/Logo";
import { WalletButton } from "@/components/common/WalletButton";
import { Avatar } from "@/components/common/Avatar";
import { CURRENT_USER } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { varaAIEnabled, toggleVaraAI, sidebarCollapsed, toggleSidebar, currentUser } = useApp();
  const displayUser = currentUser ?? CURRENT_USER;

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col justify-between border-r border-border px-2 py-3 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-68.75"
      }`}
    >
      {/* Logo */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center gap-1">
          <Link href="/" className="inline-block">
            <Logo collapsed={sidebarCollapsed} />
            <span className="sr-only">VaraSocial</span>
          </Link>
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-full p-1.5 text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto">
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
                title={sidebarCollapsed ? item.label : undefined}
                className={`group flex items-center gap-4 rounded-full px-3 py-3 text-xl transition-colors hover:bg-surface-hover ${
                  sidebarCollapsed ? "justify-center" : "justify-start pr-6"
                } ${isActive ? "font-bold text-foreground" : "text-foreground/80"}`}
              >
                <Icon
                  className="h-6.5 w-6.5 shrink-0"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Post button */}
        <button
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-base font-bold text-white transition-colors hover:bg-accent-hover ${
            sidebarCollapsed ? "px-3" : "px-6"
          }`}
        >
          <Feather className="h-6 w-6 shrink-0" />
          {!sidebarCollapsed && <span>Post</span>}
        </button>

        {/* VaraAI Toggle */}
        <button
          onClick={toggleVaraAI}
          className={`mt-3 flex w-full items-center rounded-full px-3 py-3 transition-colors hover:bg-surface-hover ${
            sidebarCollapsed ? "justify-center" : "justify-between pr-6"
          }`}
          title={varaAIEnabled ? "Disable VaraAI" : "Enable VaraAI"}
        >
          <div className="flex items-center gap-3">
            {/* VaraAI verified icon — same badge shape as verified users */}
            <div className="shrink-0">
              <svg
                viewBox="0 0 22 22"
                className={`h-6 w-6 ${varaAIEnabled ? "text-accent" : "text-secondary"}`}
                fill="currentColor"
              >
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.852-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.144.271.587.702 1.087 1.24 1.44.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.893.143.636-.13 1.222-.434 1.69-.88.445-.47.75-1.055.88-1.69.131-.636.084-1.294-.139-1.9.588-.269 1.088-.698 1.443-1.232.355-.535.554-1.163.574-1.81z" />
                <path
                  d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                  fill="white"
                />
              </svg>
            </div>
            {!sidebarCollapsed && <span className="text-sm">VaraAI</span>}
          </div>
          {!sidebarCollapsed && (
            <div
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                varaAIEnabled ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  varaAIEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          )}
        </button>
      </div>

      {/* Bottom: wallet + user */}
      <div className="flex flex-col gap-3">
        <WalletButton collapsed={sidebarCollapsed} />

        {/* Current user */}
        <div
          className={`flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-surface-hover ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <Avatar name={displayUser.displayName} />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {displayUser.displayName}
              </p>
              <p className="truncate text-sm text-secondary">
                @{displayUser.handle}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

