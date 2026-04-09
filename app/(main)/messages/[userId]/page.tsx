"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useApp } from "@/lib/store";
import { MOCK_USERS, CURRENT_USER } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DMChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { conversations, sendMessage } = useApp();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const user = MOCK_USERS.find((u) => u.id === userId);
  const convo = conversations.find((c) => c.userId === userId);
  const messages = convo?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!user) {
    return (
      <div className="p-8 text-center text-secondary">User not found</div>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(userId, trimmed);
    setText("");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        <Link
          href="/messages"
          className="rounded-full p-2 transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/user/${user.handle}`} className="flex items-center gap-3">
          <Avatar name={user.displayName} />
          <div>
            <p className="font-bold">{user.displayName}</p>
            <p className="text-xs text-secondary">@{user.handle}</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Avatar name={user.displayName} size="lg" />
            <p className="mt-3 text-xl font-bold">{user.displayName}</p>
            <p className="text-sm text-secondary">@{user.handle}</p>
            <p className="mt-2 text-sm text-secondary">
              Start a conversation with {user.displayName}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => {
            const isMine = msg.senderId === CURRENT_USER.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "rounded-br-sm bg-accent text-white"
                      : "rounded-bl-sm bg-surface text-foreground"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  <p
                    className={`mt-1 text-right text-[11px] ${
                      isMine ? "text-white/60" : "text-secondary"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Start a new message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-full bg-surface px-4 py-2.5 text-[15px] outline-none placeholder:text-secondary focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="rounded-full bg-accent p-2.5 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-secondary">
          End-to-end encrypted via 0G Storage
        </p>
      </div>
    </div>
  );
}
