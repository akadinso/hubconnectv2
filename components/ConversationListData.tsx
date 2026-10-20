import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  ConversationList,
  type InboxItem,
} from "@/components/ConversationList";

export function ListSkeleton() {
  return (
    <>
      <div className="border-b p-4">
        <h1 className="text-lg font-bold">Messages</h1>
      </div>
      <div className="space-y-3 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-12 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export async function ConversationListData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rows } = await supabase
    .from("inbox")
    .select("*")
    .order("activity_at", { ascending: false })
    .limit(50);

  const list = rows ?? [];
  const otherId = (r: any) =>
    r.buyer_id === user.id ? r.seller_id : r.buyer_id;
  const ids = [...new Set(list.map(otherId))];

  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, shop_name, avatar_url")
        .in("id", ids)
    : { data: [] as any[] };

  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const items: InboxItem[] = list.map((r: any) => {
    const p: any = byId.get(otherId(r));
    const isSeller = r.seller_id === otherId(r);
    return {
      id: r.conversation_id,
      name:
        (isSeller ? p?.shop_name : null) ||
        p?.full_name ||
        p?.username ||
        "Member",
      avatarUrl: p?.avatar_url ?? null,
      listingImage: r.listing_image ?? null,
      preview: r.last_content ?? "",
      lastFromMe: r.last_sender_id === user.id,
      activityAt: r.activity_at,
    };
  });

  return <ConversationList items={items} />;
}
