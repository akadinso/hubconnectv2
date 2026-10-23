import type { SupabaseClient } from "@supabase/supabase-js";
import { rand } from "@/lib/format";

export type PlatformFees = {
  sellerRate: number;
  sellerMonthlyCap: number;
  buyerFixed: number;
  buyerRate: number;
};

export const DEFAULT_FEES: PlatformFees = {
  sellerRate: 0.05,
  sellerMonthlyCap: 99,
  buyerFixed: 3,
  buyerRate: 0.03,
};

export async function getFees(supabase: SupabaseClient): Promise<PlatformFees> {
  const { data } = await supabase
    .from("platform_fees")
    .select("seller_rate, seller_monthly_cap, buyer_fixed, buyer_rate")
    .maybeSingle();

  if (!data) return DEFAULT_FEES;
  return {
    sellerRate: Number(data.seller_rate),
    sellerMonthlyCap: Number(data.seller_monthly_cap),
    buyerFixed: Number(data.buyer_fixed),
    buyerRate: Number(data.buyer_rate),
  };
}

const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Asks the database, so the fee shown is exactly the fee charged
export async function getBuyerFee(
  supabase: SupabaseClient,
  amount: number,
  fees: PlatformFees = DEFAULT_FEES,
): Promise<number> {
  const { data, error } = await supabase.rpc("buyer_fee_for", { amount });
  if (!error && data != null) return Number(data);
  return cents(fees.buyerFixed + fees.buyerRate * amount);
}

// Same rule the database applies: each week's fee is capped by what's left of the month's cap
export function weeklySellerFees(weeklySales: number[], f: PlatformFees) {
  let used = 0;
  return weeklySales.map((sales) => {
    const fee = Math.min(cents(sales * f.sellerRate), Math.max(0, f.sellerMonthlyCap - used));
    used += fee;
    return fee;
  });
}

export const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;
export const buyerFeeLabel = (f: PlatformFees) => `${rand(f.buyerFixed)} + ${pct(f.buyerRate)}`;
export const sellerFeeSummary = (f: PlatformFees) =>
  `Listing is always free. You pay ${pct(f.sellerRate)} of what you sell, never more than ${rand(f.sellerMonthlyCap)} a month, and nothing in a month you don't sell.`;