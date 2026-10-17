"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/components/SellerDashboard";

interface Props {
  initialListing?: Listing | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductUploadForm({ initialListing, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [title, setTitle] = useState(initialListing?.title ?? "");
  const [description, setDescription] = useState(initialListing?.description ?? "");
  const [price, setPrice] = useState(initialListing?.price?.toString() ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    let imageUrl = initialListing?.image_url ?? null;

    if (file) {
      const fileName = `${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Image upload failed:", uploadError.message);
      } else {
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const payload = {
      seller_id: user.id,
      title,
      description,
      price: Number(price),
      image_url: imageUrl,
      status: "active",
    };

    const { error } = initialListing
      ? await supabase.from("listings").update(payload).eq("id", initialListing.id)
      : await supabase.from("listings").insert(payload);

    if (error) console.error("Save listing failed:", error.message);

    setSaving(false);
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded bg-white p-6 shadow"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Product title"
        required
        className="rounded border p-2"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        required
        className="rounded border p-2"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        type="number"
        min="0"
        step="0.01"
        required
        className="rounded border p-2"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="rounded border p-2"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : initialListing ? "Update" : "Upload"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded bg-gray-400 px-4 py-2 text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}