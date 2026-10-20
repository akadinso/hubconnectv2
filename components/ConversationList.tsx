"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

export type InboxItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  listingImage: string | null;
  preview: string;
  lastFromMe: boolean;
  activityAt: string;
};

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Johannesburg",
  });

export function ConversationList({ items }: { items: InboxItem[] }) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b p-4">
        <h1 className="text-lg font-bold">Messages</h1>
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No conversations yet. Use "Message Seller" on a listing to start one.
        </p>
      ) : (
        <ul className="flex-1 divide-y overflow-y-auto">
          {items.map((c) => {
            const active = pathname === `/messages/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors hover:bg-muted/60",
                    active && "bg-muted",
                  )}
                >
                  <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-sm font-medium">
                    {c.listingImage ? (
                      <Image
                        src={c.listingImage}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      initialsOf(c.name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {fmtDay(c.activityAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastFromMe && c.preview ? "You: " : ""}
                      {c.preview || "No messages yet"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
