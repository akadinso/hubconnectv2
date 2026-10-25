import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { OFFER_SELECT, toChatMsg, toOfferInfo } from "@/lib/chat";
import { initialsOf, one } from "@/lib/format";
import { ChatThread } from "@/components/ChatThread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OfferInfo } from "@/types/chat";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offer?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>
      }
    >
      <ConversationContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ConversationContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offer?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Row level security only returns this to the buyer or the seller
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, listing:listings!listing_id ( id, title )",
    )
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();

  const role = conversation.seller_id === user.id ? "seller" : "buyer";
  const otherId =
    role === "seller" ? conversation.buyer_id : conversation.seller_id;

  const [
    { data: profiles },
    { data: msgRows },
    { data: offerRows },
    { data: sellerListings },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, shop_name, avatar_url")
      .in("id", [user.id, otherId]),
    supabase
      .from("messages")
      .select("id, content, created_at, sender_id, kind, offer_id")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("offers").select(OFFER_SELECT).eq("conversation_id", id),
    // The seller's active listings, for both sides: the seller offers on their own items,
    // the buyer offers on the seller's items
    supabase
      .from("listings")
      .select("id, title, price, image_url")
      .eq("seller_id", conversation.seller_id)
      .eq("status", "active")
      .order("title"),
  ]);

  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const meP: any = byId.get(user.id);
  const otherP: any = byId.get(otherId);

  const label = (p: any, wantShop: boolean) =>
    (wantShop ? p?.shop_name : null) || p?.full_name || p?.username || "Member";

  const me = {
    name: label(meP, role === "seller"),
    avatarUrl: meP?.avatar_url ?? null,
  };
  const other = {
    name: label(otherP, role === "buyer"),
    avatarUrl: otherP?.avatar_url ?? null,
  };
  const sellerName = role === "seller" ? me.name : other.name;

  const messages = (msgRows ?? []).map(toChatMsg).reverse();
  const offers: Record<string, OfferInfo> = {};
  for (const row of offerRows ?? []) offers[row.id] = toOfferInfo(row);

  const offerListings = (sellerListings ?? []).map((l: any) => ({
    id: l.id as string,
    title: l.title as string,
    price: l.price != null ? Number(l.price) : null,
    image: (l.image_url as string | null) ?? null,
  }));

  const listing = one<any>(conversation.listing);

  return (
    <>
      <header className="flex items-center gap-3 border-b p-3">
        <Link
          href="/messages"
          className="md:hidden"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar className="size-9">
          {other.avatarUrl && (
            <AvatarImage src={other.avatarUrl} alt={other.name} />
          )}
          <AvatarFallback className="text-xs">
            {initialsOf(other.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{other.name}</p>
          {listing && (
            <Link
              href={`/listings/${listing.id}`}
              className="block truncate text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              About: {listing.title}
            </Link>
          )}
        </div>
      </header>

      <ChatThread
        conversationId={id}
        userId={user.id}
        role={role}
        sellerName={sellerName}
        me={me}
        other={other}
        initialMessages={messages}
        initialOffers={offers}
        offerListings={offerListings}
        defaultListingId={conversation.listing_id}
        openOffer={sp.offer === "1"}
      />
    </>
  );
}
