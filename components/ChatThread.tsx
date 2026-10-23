"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceCard, OfferCard } from "@/components/OfferCards";
import { OfferDialog } from "@/components/OfferDialog";
import { createClient } from "@/lib/supabase/client";
import { OFFER_SELECT, toChatMsg, toOfferInfo } from "@/lib/chat";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMsg, OfferInfo } from "@/types/chat";

type Party = { name: string; avatarUrl: string | null };

const byTime = (a: ChatMsg, b: ChatMsg) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

function Row({
  mine,
  who,
  time,
  children,
}: {
  mine: boolean;
  who: Party;
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end gap-2", mine && "justify-end")}>
      {!mine && (
        <Avatar className="size-7 shrink-0">
          {who.avatarUrl && <AvatarImage src={who.avatarUrl} alt={who.name} />}
          <AvatarFallback className="text-[10px]">
            {initialsOf(who.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex min-w-0 max-w-[80%] flex-col gap-1",
          mine && "items-end",
        )}
      >
        {children}
        <span className="text-[10px] text-muted-foreground">
          {fmtTime(time)}
        </span>
      </div>
    </div>
  );
}

export function ChatThread({
  conversationId,
  userId,
  role,
  sellerName,
  me,
  other,
  initialMessages,
  initialOffers,
  myListings,
  defaultListingId,
}: {
  conversationId: string;
  userId: string;
  role: "buyer" | "seller";
  sellerName: string;
  me: Party;
  other: Party;
  initialMessages: ChatMsg[];
  initialOffers: Record<string, OfferInfo>;
  myListings: { id: string; title: string }[];
  defaultListingId: string | null;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [messages, setMessages] = React.useState<ChatMsg[]>(initialMessages);
  const [offers, setOffers] =
    React.useState<Record<string, OfferInfo>>(initialOffers);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const refreshOffer = React.useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("offers")
        .select(OFFER_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (data) setOffers((prev) => ({ ...prev, [id]: toOfferInfo(data) }));
    },
    [supabase],
  );

  // Live updates. Row level security decides what this user is allowed to receive.
  React.useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = toChatMsg(payload.new);
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort(byTime),
          );
          if (m.offerId) refreshOffer(m.offerId);
        },
      )
      // Offers are matched client-side, since update events can't be filtered reliably
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "offers" },
        (payload) => {
          const row: any = payload.new;
          if (row.conversation_id === conversationId) refreshOffer(row.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, refreshOffer]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    const id = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id,
        content,
        createdAt: new Date().toISOString(),
        senderId: userId,
        kind: "text",
        offerId: null,
      },
    ]);
    setText("");

    const { error } = await supabase.from("messages").insert({
      id,
      conversation_id: conversationId,
      sender_id: userId,
      content,
    });

    setSending(false);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setText(content);
      toast.error(error.message);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((m) => {
          const mine = m.senderId === userId;
          const who = mine ? me : other;

          return (
            <Row key={m.id} mine={mine} who={who} time={m.createdAt}>
              {m.kind === "offer" ? (
                <OfferCard
                  offer={m.offerId ? offers[m.offerId] : undefined}
                  role={role}
                  onChanged={refreshOffer}
                />
              ) : m.kind === "invoice" ? (
                <InvoiceCard
                  offer={m.offerId ? offers[m.offerId] : undefined}
                  role={role}
                  sellerName={sellerName}
                />
              ) : (
                <p
                  className={cn(
                    "whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border bg-background",
                  )}
                >
                  {m.content}
                </p>
              )}
            </Row>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
        {role === "seller" && (
          <OfferDialog
            conversationId={conversationId}
            listings={myListings}
            defaultListingId={defaultListingId}
          />
        )}
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="rounded-full"
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={!text.trim() || sending}
          aria-label="Send"
        >
          <Send className="size-4" />
        </Button>
      </form>
      <p className="px-3 pb-2 text-center text-[11px] text-muted-foreground">
        Pay only through HubConnect. Payments made outside it aren't protected.
      </p>
    </div>
  );
}
