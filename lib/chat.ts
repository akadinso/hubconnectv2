import { one } from "@/lib/format";
import type { ChatMsg, OfferInfo } from "@/types/chat";

export const OFFER_SELECT = `id, price, listed_price, status, expires_at, invoice_no,
  accepted_at, order_id, listing:listings!listing_id ( title )`;

export function toOfferInfo(row: any): OfferInfo {
  return {
    id: row.id,
    price: Number(row.price),
    listedPrice: row.listed_price != null ? Number(row.listed_price) : null,
    status: row.status,
    expiresAt: row.expires_at,
    invoiceNo: row.invoice_no ?? null,
    acceptedAt: row.accepted_at ?? null,
    orderId: row.order_id ?? null,
    listingTitle: one<any>(row.listing)?.title ?? "Listing",
  };
}

export function toChatMsg(row: any): ChatMsg {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    senderId: row.sender_id,
    kind: row.kind ?? "text",
    offerId: row.offer_id ?? null,
  };
}