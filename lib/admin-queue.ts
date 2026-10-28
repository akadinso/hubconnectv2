import type { SupabaseClient } from "@supabase/supabase-js";

export type DisputeRow = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  order_id: string;
  openerName: string;
  amount: number | null;
};

export async function getOpenDisputes(
  supabase: SupabaseClient,
  limit = 8,
): Promise<{ rows: DisputeRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("disputes")
    .select("id, reason, status, created_at, order_id, opened_by")
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  const list = data ?? [];
  if (list.length === 0) return { rows: [], error: null };

  const [people, orders] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", [...new Set(list.map((d) => d.opened_by as string))]),
    supabase
      .from("orders")
      .select("id, total")
      .in("id", [...new Set(list.map((d) => d.order_id as string))]),
  ]);

  const names = new Map(
    (people.data ?? []).map((p: any) => [p.id, (p.full_name || p.username || "Member") as string]),
  );
  const totals = new Map((orders.data ?? []).map((o: any) => [o.id, Number(o.total)]));

  return {
    rows: list.map((d: any) => ({
      id: d.id,
      reason: d.reason,
      status: d.status,
      created_at: d.created_at,
      order_id: d.order_id,
      openerName: names.get(d.opened_by) ?? "Member",
      amount: totals.get(d.order_id) ?? null,
    })),
    error: null,
  };
}