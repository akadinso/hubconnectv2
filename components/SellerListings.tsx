"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import {
  ProductUploadForm,
  type SellerListing,
} from "@/components/ProductUploadForm";

const BADGE: Record<string, string> = {
  active: "resolved",
  draft: "in_review",
  archived: "dismissed",
};

export function SellerListings({ listings }: { listings: SellerListing[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SellerListing | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(listing: SellerListing) {
    setEditing(listing);
    setOpen(true);
  }

  async function archive(listing: SellerListing) {
    if (
      !confirm(
        `Archive "${listing.title}"? Buyers won't see it, and only an admin can restore it.`,
      )
    ) {
      return;
    }
    const { error } = await createClient()
      .from("listings")
      .update({ status: "archived" })
      .eq("id", listing.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing archived");
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">My listings</h2>
        <Button size="sm" onClick={openNew}>
          <Plus />
          New listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't listed anything yet.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {listings.map((l) => (
            <li key={l.id} className="flex items-center gap-3 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {l.image_url && (
                  <Image
                    src={l.image_url}
                    alt={l.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {l.price != null
                    ? `R${Number(l.price).toFixed(2)}`
                    : "No price"}{" "}
                  · <span className="capitalize">{l.type}</span>
                </p>
              </div>

              <StatusBadge status={BADGE[l.status]} />

              <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                <Pencil />
                Edit
              </Button>
              {l.status !== "archived" && (
                <Button size="sm" variant="ghost" onClick={() => archive(l)}>
                  Archive
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit listing" : "New listing"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details buyers see."
                : "Add something to sell on HubConnect."}
            </DialogDescription>
          </DialogHeader>

          <ProductUploadForm
            key={editing?.id ?? "new"}
            initialListing={editing}
            onClose={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              toast.success(editing ? "Listing updated" : "Listing saved");
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
