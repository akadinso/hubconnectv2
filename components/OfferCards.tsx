"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rand } from "@/lib/format";
import {
  acceptOffer,
  declineOffer,
  withdrawOffer,
} from "@/app/(main)/messages/actions";
import type { OfferInfo } from "@/types/chat";

type Role = "buyer" | "seller";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });

const STATE_LABEL: Record<string, string> = {
  accepted: "Accepted",
  paid: "Paid",
  declined: "Declined",
  cancelled: "Withdrawn",
  expired: "Expired",
};

export function OfferCard({
  offer,
  role,
  onChanged,
}: {
  offer: OfferInfo | undefined;
  role: Role;
  onChanged: (offerId: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);

  if (!offer)
    return <div className="h-28 w-56 animate-pulse rounded-xl bg-muted" />;
  const o = offer;

  const expired =
    o.status === "pending" && new Date(o.expiresAt).getTime() < Date.now();
  const state = expired ? "expired" : o.status;

  async function run(fn: () => Promise<{ error?: string }>, success?: string) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (success) toast.success(success);
    onChanged(o.id);
  }

  return (
    <div className="w-56 overflow-hidden rounded-xl border bg-card">
      <div className="space-y-0.5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Offer
        </p>
        <p className="text-2xl font-bold">{rand(o.price)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {o.listingTitle}
        </p>
      </div>

      {state === "pending" && role === "buyer" && (
        <div className="grid grid-cols-2 border-t">
          <Button
            className="rounded-none"
            disabled={busy}
            onClick={() =>
              run(
                () => acceptOffer(o.id),
                "Offer accepted. Your invoice is ready.",
              )
            }
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            className="rounded-none"
            disabled={busy}
            onClick={() => run(() => declineOffer(o.id))}
          >
            Decline
          </Button>
        </div>
      )}

      {state === "pending" && role === "seller" && (
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <span className="text-xs text-muted-foreground">
            Waiting for the buyer
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => withdrawOffer(o.id))}
          >
            Withdraw
          </Button>
        </div>
      )}

      {state !== "pending" && (
        <div className="border-t bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          {STATE_LABEL[state] ?? state}
        </div>
      )}
    </div>
  );
}

export function InvoiceCard({
  offer,
  role,
  sellerName,
}: {
  offer: OfferInfo | undefined;
  role: Role;
  sellerName: string;
}) {
  if (!offer || !offer.invoiceNo) {
    return <div className="h-48 w-72 animate-pulse rounded-xl bg-muted" />;
  }

  const paid = offer.status === "paid";
  const expired =
    offer.status === "accepted" &&
    !offer.orderId &&
    new Date(offer.expiresAt).getTime() < Date.now();

  const rows: [string, string][] = [
    ["Item", offer.listingTitle],
    ...(offer.listedPrice != null
      ? ([["Listed price", rand(offer.listedPrice)]] as [string, string][])
      : []),
    ["Agreed price", rand(offer.price)],
    ["Quantity", "1"],
  ];

  return (
    <div className="w-72 space-y-3 rounded-xl border bg-card p-4">
      <Badge
        variant="secondary"
        className="bg-gold-lite text-[10px] text-gold-dark"
      >
        {paid ? "Paid" : expired ? "Invoice expired" : "Offer accepted"}
      </Badge>

      <p className="font-bold">Invoice #{offer.invoiceNo}</p>

      <dl className="space-y-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t pt-1">
          <dt className="text-muted-foreground">Seller</dt>
          <dd className="truncate text-right font-medium">
            {sellerName}
            {offer.acceptedAt ? ` · ${fmtDate(offer.acceptedAt)}` : ""}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {role === "buyer" && !paid && !expired && (
          <Link href={`/checkout/offer/${offer.id}`}>
            <Button size="sm">Proceed to checkout</Button>
          </Link>
        )}
        <Link href={`/invoices/${offer.id}`} target="_blank">
          <Button size="sm" variant="outline">
            Download invoice
          </Button>
        </Link>
      </div>

      {role === "buyer" && !paid && !expired && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Your payment is held safely by HubConnect until you get your item.
        </p>
      )}
    </div>
  );
}
