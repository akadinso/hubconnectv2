"use client";

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChat } from "@/components/realtime-chat";
import type { ChatMessage } from "@/hooks/use-realtime-chat";

export function ConversationChat({
  conversationId,
  userId,
  username,
  initialMessages,
}: {
  conversationId: string;
  userId: string;
  username: string;
  initialMessages: ChatMessage[];
}) {
  const saved = useRef(new Set(initialMessages.map((m) => m.id)));

  const handleMessage = useCallback(
    async (messages: ChatMessage[]) => {
      // Each person saves only their own messages, so nothing is inserted twice
      const fresh = messages.filter(
        (m) => m.user.name === username && !saved.current.has(m.id),
      );
      if (fresh.length === 0) return;

      fresh.forEach((m) => saved.current.add(m.id));

      const supabase = createClient();
      const { error } = await supabase.from("messages").insert(
        fresh.map((m) => ({
          id: m.id,
          conversation_id: conversationId,
          sender_id: userId,
          content: m.content,
          created_at: m.createdAt,
        })),
      );

      if (error) {
        console.error("Failed to save message:", error);
        fresh.forEach((m) => saved.current.delete(m.id)); // retry on next change
      }
    },
    [conversationId, userId, username],
  );

  return (
    <RealtimeChat
      roomName={`conversation:${conversationId}`}
      username={username}
      messages={initialMessages}
      onMessage={handleMessage}
    />
  );
}
