"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { validatePhoto } from "@/lib/upload-photos";

export type SellerListing = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  type: "product" | "service";
  category_id: string | null;
  status: "draft" | "active" | "archived";
};

interface Props {
  initialListing?: SellerListing | null;
  onClose: () => void;
  onSaved: () => void;
}

const BUCKET = "listing-images";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

// Turns a stored public URL back into the file's path in the bucket
function storagePath(url: string | null | undefined) {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1
    ? null
    : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export function ProductUploadForm({ initialListing, onClose, onSaved }: Props) {
  const isEdit = !!initialListing;
  const isArchived = initialListing?.status === "archived";

  const [title, setTitle] = React.useState(initialListing?.title ?? "");
  const [description, setDescription] = React.useState(
    initialListing?.description ?? "",
  );
  const [price, setPrice] = React.useState(
    initialListing?.price != null ? String(initialListing.price) : "",
  );
  const [type, setType] = React.useState<"product" | "service">(
    initialListing?.type ?? "product",
  );
  const [categoryId, setCategoryId] = React.useState(
    initialListing?.category_id ?? "",
  );
  const [published, setPublished] = React.useState(
    initialListing ? initialListing.status !== "draft" : true,
  );
  const [categories, setCategories] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    createClient()
      .from("categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (!cancelled) setCategories(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    const problem = validatePhoto(picked);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const amount = Number(price);

    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setError("Title must be 3 to 120 characters.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in.");
      setSaving(false);
      return;
    }

    // 1. Upload the image into this seller's own folder
    let imageUrl = initialListing?.image_url ?? null;
    let uploadedPath: string | null = null;

    if (file) {
      uploadedPath = `${user.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, file, { contentType: file.type });

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath)
        .data.publicUrl;
    }

    // 2. Save the listing. Archived listings keep their status.
    const fields = {
      title: cleanTitle,
      description: cleanDescription || null,
      price: amount,
      type,
      category_id: categoryId || null,
      image_url: imageUrl,
      ...(isArchived ? {} : { status: published ? "active" : "draft" }),
    };

    const { error: saveError } = initialListing
      ? await supabase
          .from("listings")
          .update(fields)
          .eq("id", initialListing.id)
      : await supabase
          .from("listings")
          .insert({ ...fields, seller_id: user.id });

    if (saveError) {
      if (uploadedPath)
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      setError(saveError.message);
      setSaving(false);
      return;
    }

    // 3. Tidy up the old image if it was replaced
    if (uploadedPath) {
      const old = storagePath(initialListing?.image_url);
      if (old) await supabase.storage.from(BUCKET).remove([old]);
    }

    setSaving(false);
    onSaved();
  }

  const shownImage = preview ?? initialListing?.image_url ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isArchived && (
        <p className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
          This listing is archived and hidden from buyers. Only an admin can
          restore it.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="listing-title">Title</Label>
        <Input
          id="listing-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["product", "service"] as const).map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm capitalize has-[:checked]:border-foreground"
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="accent-foreground"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="listing-category">Category</Label>
        <select
          id="listing-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-description">Description</Label>
        <Textarea
          id="listing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-price">Price (R)</Label>
        <Input
          id="listing-price"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-image">Photo</Label>
        {shownImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownImage}
            alt="Listing preview"
            className="size-32 rounded-lg border object-cover"
          />
        )}
        <Input
          id="listing-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 5MB.
        </p>
      </div>

      {!isArchived && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-foreground"
          />
          Visible to buyers (untick to save as a draft)
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : published
                ? "Publish listing"
                : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
