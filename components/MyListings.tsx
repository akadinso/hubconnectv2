"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { listingImagePath } from "@/lib/storage-path";
import { cn } from "@/lib/utils";
import type { SellerListing } from "@/types/seller-listing";

const TABS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
] as const;

const CHIP = {
  active: { label: "Active", className: "bg-success/15 text-success" },
  draft: { label: "Draft", className: "bg-info/15 text-info" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function MyListings({ listings }: { listings: SellerListing[] }) {
  const router = useRouter();
  const [tab, setTab] =
    React.useState<(typeof TABS)[number]["value"]>("active");

  const shown = listings.filter((l) => l.status === tab);

  async function remove(l: SellerListing) {
    const supabase = createClient();

    if (l.status === "draft") {
      if (!confirm(`Delete the draft "${l.title}"? This can't be undone.`))
        return;

      const { data, error } = await supabase
        .from("listings")
        .delete()
        .eq("id", l.id)
        .eq("status", "draft")
        .select("id");

      if (error || !data?.length) {
        toast.error(error?.message ?? "Couldn't delete this draft.");
        return;
      }

      const paths = (l.images ?? [])
        .map(listingImagePath)
        .filter((p): p is string => !!p);
      if (paths.length)
        await supabase.storage.from("listing-images").remove(paths);

      toast.success("Draft deleted");
    } else if (l.status === "active") {
      if (
        !confirm(
          `Archive "${l.title}"? Buyers won't see it, and only an admin can restore it.`,
        )
      ) {
        return;
      }
      const { error } = await supabase
        .from("listings")
        .update({ status: "archived" })
        .eq("id", l.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Listing archived");
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-6 border-b text-sm">
        {TABS.map((t) => {
          const count = listings.filter((l) => l.status === t.value).length;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "-mb-px border-b-2 pb-2",
                tab === t.value
                  ? "border-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {tab === "active"
            ? "No active listings yet."
            : tab === "draft"
              ? 'No drafts. Use "Save to Draft" when adding a listing.'
              : "Nothing archived."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((l) => {
            const chip = CHIP[l.status];
            return (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {l.image_url && (
                    <Image
                      src={l.image_url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.price != null
                      ? `R${Number(l.price).toFixed(2)}`
                      : "No price"}{" "}
                    · <span className="capitalize">{l.type}</span>
                  </p>
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    chip.className,
                  )}
                >
                  {chip.label}
                </span>

                <Link
                  href={`/seller/listings/${l.id}/edit`}
                  aria-label={`Edit ${l.title}`}
                >
                  <Button variant="ghost" size="icon" type="button">
                    <Pencil className="size-4" />
                  </Button>
                </Link>

                {l.status !== "archived" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={
                      l.status === "draft"
                        ? `Delete ${l.title}`
                        : `Archive ${l.title}`
                    }
                    onClick={() => remove(l)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
