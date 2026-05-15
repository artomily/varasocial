"use client";

import { useState, useEffect } from "react";
import { Heart, Repeat2, MessageCircle, UserPlus, Coins, Bell } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useApp } from "@/lib/store";
import { fetchNotifications } from "@/lib/supabase-queries";
import type { Notification } from "@/lib/types";
import { BRAND } from "@/lib/constants";

const iconMap: Record<Notification["type"], React.ElementType> = {
  like: Heart,
  repost: Repeat2,
  reply: MessageCircle,
  follow: UserPlus,
  reward: Coins,
};

const colorMap: Record<Notification["type"], string> = {
  like: "text-truth-hoax",
  repost: "text-truth-valid",
  reply: "text-accent",
  follow: "text-accent",
  reward: "text-vara-reward",
};

const labelMap: Record<Notification["type"], string> = {
  like: "liked your post",
  repost: "reposted your post",
  reply: "replied to your post",
  follow: "followed you",
  reward: `You earned ${BRAND.token} from your content`,
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsPage() {
  const { currentUser } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetchNotifications(currentUser.id)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <Bell className="mb-3 h-12 w-12 text-secondary" />
          <p className="text-xl font-bold">No notifications yet</p>
          <p className="text-secondary">
            When someone likes or reposts your content, you&apos;ll see it here.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex-1">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50 ${!n.read ? "bg-accent/5" : ""}`}
              >
                <Icon className={`mt-1 h-5 w-5 shrink-0 ${colorMap[n.type]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <Avatar name={n.actor.displayName} size="sm" />
                    <span className="text-sm">
                      <span className="font-bold">{n.actor.displayName}</span>{" "}
                      <span className="text-secondary">{labelMap[n.type]}</span>
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-secondary">{timeAgo(n.timestamp)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
