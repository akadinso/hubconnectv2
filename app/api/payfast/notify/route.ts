import crypto from "node:crypto";
import dns from "node:dns/promises";
import { createClient } from "@supabase/supabase-js";
import { PAYFAST_VALIDATE_URL, paramString, sign } from "@/lib/payfast";

const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

function reject(reason: string) {
  console.error("[payfast itn] rejected:", reason);
  return new Response(reason, { status: 400 });
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function isPayFastIp(ip: string | null) {
  if (!ip) return false;
  const lists = await Promise.all(
    PAYFAST_HOSTS.map((h) => dns.resolve4(h).catch(() => [] as string[])),
  );
  return lists.flat().includes(ip);
}

export async function POST(request: Request) {
  const params = new URLSearchParams(await request.text());
  const pairs = [...params.entries()].filter(([k]) => k !== "signature");

  // 1. Signature (fields in the order PayFast sent them)
  const expected = sign(pairs, process.env.PAYFAST_PASSPHRASE);
  if (!safeEqual(expected, params.get("signature") ?? "")) {
    return reject("Invalid signature");
  }

  // 2. Did it really come from PayFast?
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  if (!(await isPayFastIp(ip))) return reject("Unknown source IP");

  // 3. Does the amount match our order?
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const orderId = params.get("m_payment_id");
  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, total, payment_status")
    .eq("id", orderId ?? "")
    .maybeSingle();
  if (!order) return reject("Unknown order");

  const gross = Number(params.get("amount_gross"));
  if (!Number.isFinite(gross) || Math.abs(gross - Number(order.total)) > 0.01) {
    return reject("Amount mismatch");
  }

  // 4. Ask PayFast to confirm it sent this
  const check = await fetch(PAYFAST_VALIDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: paramString(pairs),
  });
  if ((await check.text()).trim() !== "VALID") {
    return reject("PayFast did not confirm");
  }

  // All checks passed. The "pending" filters make repeat notifications harmless.
  const status = params.get("payment_status");

  if (status === "COMPLETE") {
    const { data: updated } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        payfast_payment_id: params.get("pf_payment_id"),
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("id");

    if (updated?.length) {
      const { data: items } = await admin
        .from("order_items")
        .select("listing_id")
        .eq("order_id", order.id);

      const ids = (items ?? []).map((i) => i.listing_id).filter(Boolean);
      if (ids.length) {
        await admin
          .from("cart_items")
          .delete()
          .eq("user_id", order.buyer_id)
          .in("listing_id", ids);
      }
    }
  } else if (status === "FAILED" || status === "CANCELLED") {
    await admin
      .from("orders")
      .update({ payment_status: status === "FAILED" ? "failed" : "cancelled" })
      .eq("id", order.id)
      .eq("payment_status", "pending");
  }

  return new Response("OK", { status: 200 });
}