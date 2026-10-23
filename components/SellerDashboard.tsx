"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductUploadForm } from "@/components/ProductUploadForm";
import { SellerListingsTable } from "@/components/SellerListingsTable";
import type { SellerListing } from "@/types/seller-listings";

export function SellerDashboard({
  initialListings,
}: {
  initialListings: SellerListing[];
}) {
  const supabase = createClient();
  const [listings, setListings] = useState<SellerListing[]>(initialListings);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<SellerListing | null>(
    null,
  );

  const refresh = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, title, description, price, image_url, images, type, category_id, condition, rate_type, availability, status, created_at, campus_id",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error refreshing listings:", error.message);
      return;
    }

    if (data) {
      setListings(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      console.error("Delete failed:", error.message);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleEdit = (listing: SellerListing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditingListing(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingListing(null);
            setShowForm(true);
          }}
          className="rounded bg-amber-200 px-4 py-2 font-medium text-gray-800 shadow transition-colors hover:bg-amber-300"
        >
          + Sell Something
        </button>
      </div>

      {showForm && (
        <ProductUploadForm
          initialListing={editingListing}
          onClose={() => {
            setShowForm(false);
            setEditingListing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t listed anything yet.
        </p>
      ) : (
        <SellerListingsTable
          data={listings}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
