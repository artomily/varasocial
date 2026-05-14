"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useApp } from "@/lib/store";
import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesPage() {
  const { conversations } = useApp();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div>
        {conversations.map((conv) => {
          const user = MOCK_USERS.find((u) => u.id === conv.userId);
          if (!user) return null;
          const lastMsg = conv.messages[conv.messages.length - 1];

          return (
            <Link
              key={conv.userId}
              href={`/messages/${conv.userId}`}
              className="flex items-center gap-3 border-b border-border px-6 py-3 transition-colors hover:bg-surface/50"
            >
              <Avatar name={user.displayName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold text-sm">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-secondary">
                    @{user.handle}
                  </span>
                  {lastMsg && (
                    <>
                      <span className="text-xs text-secondary">·</span>
                      <span className="text-xs text-secondary">
                        {timeAgo(lastMsg.timestamp)}
                      </span>
                    </>
                  )}
                </div>
                {lastMsg && (
                  <p className="truncate text-sm text-secondary">
                    {lastMsg.text}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <div className="p-8 text-center">
          <Mail className="mx-auto mb-3 h-12 w-12 text-secondary" />
          <p className="text-xl font-bold">No messages yet</p>
          <p className="text-secondary">
            End-to-end encrypted via 0G Storage
          </p>
        </div>
      )}
    </div>
  );
}
