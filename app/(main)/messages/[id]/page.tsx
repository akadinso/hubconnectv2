import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationChat } from "@/components/ConversationChat";
import type { ChatMessage } from "@/hooks/use-realtime-chat";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // RLS only returns this if the user is the buyer or seller
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();

  const [{ data: me }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("messages")
      .select("id, content, created_at, sender:profiles!sender_id ( username )")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const initialMessages: ChatMessage[] = (rows ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    user: { name: row.sender?.username ?? "Unknown" },
  }));

  return (
    <div className="mx-auto h-[calc(100svh-4rem)] max-w-full">
      <ConversationChat
        conversationId={id}
        userId={user.id}
        username={me?.username ?? "me"}
        initialMessages={initialMessages}
      />
    </div>
  );
}
