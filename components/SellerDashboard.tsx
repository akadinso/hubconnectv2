"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductUploadForm } from "@/components/ProductUploadForm";
import { SellerListingsTable } from "@/components/SellerListingsTable";

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  image_url: string | null;
  created_at?: string;
};

export function SellerDashboard({
  initialListings,
}: {
  initialListings: Listing[];
}) {
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from("listings")
      .select("id, title, description, price, status, image_url, created_at")
      .order("created_at", { ascending: false });
    if (data) setListings(data as Listing[]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      console.error("Delete failed:", error.message);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleEdit = (listing: Listing) => {
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
          className="rounded bg-amber-200 px-4 py-2 font-medium text-gray-800 shadow hover:bg-amber-300"
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
