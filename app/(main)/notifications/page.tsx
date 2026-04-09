import { Heart, Repeat2, MessageCircle, UserPlus, Coins } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";

const iconMap = {
  like: Heart,
  repost: Repeat2,
  reply: MessageCircle,
  follow: UserPlus,
  reward: Coins,
};

const colorMap = {
  like: "text-truth-hoax",
  repost: "text-truth-valid",
  reply: "text-accent",
  follow: "text-accent",
  reward: "text-vara-reward",
};

const mockNotifications = [
  { id: "n1", type: "like" as const, user: MOCK_USERS[1], text: "liked your post about Mode Turu", time: "2m" },
  { id: "n2", type: "repost" as const, user: MOCK_USERS[3], text: "reposted your truth score analysis", time: "15m" },
  { id: "n3", type: "reward" as const, user: MOCK_USERS[4], text: "You earned 12.5 $VARA from viral content", time: "1h" },
  { id: "n4", type: "follow" as const, user: MOCK_USERS[5], text: "followed you", time: "2h" },
  { id: "n5", type: "reply" as const, user: MOCK_USERS[2], text: "replied to your post about data portability", time: "3h" },
  { id: "n6", type: "like" as const, user: MOCK_USERS[4], text: "liked your post", time: "5h" },
  { id: "n7", type: "reward" as const, user: MOCK_USERS[1], text: "You earned 8.3 $VARA from SocialFlow", time: "6h" },
];

export default function NotificationsPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      <div>
        {mockNotifications.map((n) => {
          const Icon = iconMap[n.type];
          return (
            <div
              key={n.id}
              className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50"
            >
              <Icon className={`mt-1 h-5 w-5 shrink-0 ${colorMap[n.type]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Avatar name={n.user.displayName} size="sm" />
                  <span className="text-sm">
                    <span className="font-bold">{n.user.displayName}</span>{" "}
                    <span className="text-secondary">{n.text}</span>
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-secondary">{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
