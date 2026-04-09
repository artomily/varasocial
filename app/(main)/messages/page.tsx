import { Mail } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";

const conversations = [
  { user: MOCK_USERS[1], lastMessage: "Sure, let's collab on the DeAI article!", time: "2m", unread: true },
  { user: MOCK_USERS[3], lastMessage: "The truth score data is ready for review", time: "1h", unread: true },
  { user: MOCK_USERS[4], lastMessage: "Got the $VARA payment. Thanks!", time: "3h", unread: false },
  { user: MOCK_USERS[5], lastMessage: "Would love to discuss data portability", time: "5h", unread: false },
  { user: MOCK_USERS[2], lastMessage: "New connector is deployed 🚀", time: "1d", unread: false },
];

export default function MessagesPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div>
        {conversations.map((conv) => (
          <div
            key={conv.user.id}
            className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50 cursor-pointer"
          >
            <Avatar name={conv.user.displayName} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold text-sm">
                  {conv.user.displayName}
                </span>
                <span className="text-xs text-secondary">@{conv.user.handle}</span>
                <span className="text-xs text-secondary">· {conv.time}</span>
              </div>
              <p className={`truncate text-sm ${conv.unread ? "text-foreground" : "text-secondary"}`}>
                {conv.lastMessage}
              </p>
            </div>
            {conv.unread && (
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
            )}
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="p-8 text-center">
        <Mail className="mx-auto mb-3 h-12 w-12 text-secondary" />
        <p className="text-secondary">End-to-end encrypted via 0G Storage</p>
      </div>
    </div>
  );
}
