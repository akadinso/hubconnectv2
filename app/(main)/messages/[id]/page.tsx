import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { one, rand } from "@/lib/format";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ConversationChat } from "@/components/ConversationChat";
import { OfferButtons, SendOfferForm } from "@/components/OfferActions";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/use-realtime-chat";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>
      }
    >
      <ConversationContent params={params} />
    </Suspense>
  );
}

async function ConversationContent({
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

  // Row level security only returns this to the buyer or the seller
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, listing:listings!listing_id ( title, price )",
    )
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();

  const isSeller = conversation.seller_id === user.id;

  const [
    { data: me },
    { data: rows },
    { data: offerRows },
    { data: myListings },
  ] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("messages")
      .select("id, content, created_at, sender:profiles!sender_id ( username )")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("offers")
      .select(
        "id, price, status, expires_at, listing:listings!listing_id ( title )",
      )
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
    isSeller
      ? supabase
          .from("listings")
          .select("id, title, price")
          .eq("seller_id", user.id)
          .eq("status", "active")
          .order("title")
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const initialMessages: ChatMessage[] = (rows ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    user: { name: one<any>(row.sender)?.username ?? "Unknown" },
  }));

  const offer: any = offerRows?.[0] ?? null;
  const expired =
    offer?.status === "pending" && new Date(offer.expires_at) < new Date();
  const openOffer =
    offer && !expired && ["pending", "accepted"].includes(offer.status);
  const offerTitle = offer ? one<any>(offer.listing)?.title : null;
  const chatListing = one<any>(conversation.listing);

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-2xl flex-col">
      <AutoRefresh intervalMs={10000} maxTries={120} />

      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          {chatListing && (
            <p className="truncate text-xs text-muted-foreground">
              About: {chatListing.title}
            </p>
          )}
        </div>

        {/* Offer panel */}
        <div className="rounded-xl bg-muted p-3 text-sm">
          {isSeller ? (
            openOffer && offer.status === "pending" ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Your offer: <strong>{rand(offer.price)}</strong> for{" "}
                  {offerTitle}. Waiting for the buyer.
                </p>
                <OfferButtons
                  offerId={offer.id}
                  conversationId={id}
                  role="seller"
                />
              </div>
            ) : openOffer && offer.status === "accepted" ? (
              <p>
                The buyer is paying <strong>{rand(offer.price)}</strong> for{" "}
                {offerTitle}.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">Agree a price with the buyer</p>
                <SendOfferForm
                  conversationId={id}
                  listings={(myListings ?? []).map((l: any) => ({
                    id: l.id,
                    title: l.title,
                    price: l.price != null ? Number(l.price) : null,
                  }))}
                  defaultListingId={conversation.listing_id}
                />
                {offer?.status === "paid" && (
                  <p className="text-xs text-muted-foreground">
                    Last offer ({rand(offer.price)}) was paid. See Orders to
                    fulfil.
                  </p>
                )}
                {offer && (offer.status === "declined" || expired) && (
                  <p className="text-xs text-muted-foreground">
                    Last offer ({rand(offer.price)}) was{" "}
                    {expired ? "not taken in time" : "declined"}.
                  </p>
                )}
              </div>
            )
          ) : openOffer ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                The seller offered <strong>{rand(offer.price)}</strong> for{" "}
                {offerTitle}.
              </p>
              <div className="flex gap-2">
                <Link href={`/checkout/offer/${offer.id}`}>
                  <Button size="sm">Checkout {rand(offer.price)}</Button>
                </Link>
                {offer.status === "pending" && (
                  <OfferButtons
                    offerId={offer.id}
                    conversationId={id}
                    role="buyer"
                  />
                )}
              </div>
            </div>
          ) : offer?.status === "paid" ? (
            <p>
              You paid <strong>{rand(offer.price)}</strong> for {offerTitle}.{" "}
              <Link href="/orders" className="underline underline-offset-4">
                View my orders
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Want a different price? Ask the seller here, and they can send you
              an offer to check out.
            </p>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ConversationChat
          conversationId={id}
          userId={user.id}
          username={me?.username ?? "me"}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
