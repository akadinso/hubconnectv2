import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { nameOf, one, rand } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { PrintButton } from "@/components/PrintButton";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<MaxWidthWrapper className="w-full py-10" >Loading...</MaxWidthWrapper>}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Row level security limits offers to the buyer, the seller and admins
  const { data: offer } = await supabase
    .from("offers")
    .select(
      `id, price, listed_price, status, invoice_no, accepted_at,
       listing:listings!listing_id ( title ),
       buyer:profiles!buyer_id ( username, full_name ),
       seller:profiles!seller_id ( username, full_name, shop_name )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!offer || !offer.invoice_no) notFound();

  const seller = one<any>(offer.seller);
  const sellerName = seller?.shop_name || nameOf(seller, "Seller");
  const paid = offer.status === "paid";

  return (
    <MaxWidthWrapper className="w-full max-w-xl space-y-6 py-10">
      <div className="space-y-6 rounded-2xl border p-8 print:rounded-none print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold">HubConnect</p>
            <p className="text-xs text-muted-foreground">
              Eduvos Incubation Hub Marketplace
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">Invoice #{offer.invoice_no}</p>
            <p className="text-xs text-muted-foreground">
              {offer.accepted_at ? fmt(offer.accepted_at) : ""}
            </p>
            <p className="mt-1 text-xs font-medium">
              {paid ? "PAID" : "AWAITING PAYMENT"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Billed to</p>
            <p className="font-medium">
              {nameOf(one<any>(offer.buyer), "Buyer")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seller</p>
            <p className="font-medium">{sellerName}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 text-right font-normal">Qty</th>
              <th className="pb-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">
                {one<any>(offer.listing)?.title ?? "Item"}
                {offer.listed_price != null && (
                  <span className="block text-xs text-muted-foreground">
                    Listed at {rand(offer.listed_price)}, agreed price applied
                  </span>
                )}
              </td>
              <td className="py-3 text-right">1</td>
              <td className="py-3 text-right">{rand(offer.price)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-3 text-right font-bold">
                Total
              </td>
              <td className="pt-3 text-right font-bold">{rand(offer.price)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-muted-foreground">
          Payment is held by HubConnect until the buyer confirms they received
          the item.
        </p>
      </div>

      <div className="flex justify-center print:hidden">
        <PrintButton />
      </div>
    </MaxWidthWrapper>
  );
}
