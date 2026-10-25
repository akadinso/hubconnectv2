"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListingPhotos, type PhotoSlot } from "@/components/ListingPhotos";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/format";
import {
  CONDITIONS,
  DAYS,
  RATE_TYPES,
  conditionLabel,
  rateSuffix,
} from "@/lib/marketplace-options";
import { cn } from "@/lib/utils";
import type { SellerListing } from "@/types/seller-listings";

const BUCKET = "listing-images";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function storagePath(url: string) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1
    ? null
    : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

type Step = "form" | "preview" | "done";

export function ListingWizard({
  categories,
  campuses,
  defaultCampusId,
  seller,
  initial,
}: {
  categories: { id: string; name: string }[];
  campuses: { id: string; name: string }[];
  defaultCampusId?: string | null;
  seller: { name: string; avatarUrl: string | null };
  initial?: SellerListing | null;
}) {
  const router = useRouter();
  const archived = initial?.status === "archived";
  const canDraft = !archived && initial?.status !== "active";

  const startImages = initial?.images?.length
    ? initial.images
    : initial?.image_url
      ? [initial.image_url]
      : [];

  const [step, setStep] = React.useState<Step>("form");
  const [type, setType] = React.useState<"product" | "service">(
    initial?.type ?? "product",
  );
  const [slots, setSlots] = React.useState<PhotoSlot[]>(
    startImages.map((url) => ({ id: url, url })),
  );
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [categoryId, setCategoryId] = React.useState(
    initial?.category_id ?? "",
  );
  const [campusId, setCampusId] = React.useState(
    initial?.campus_id ?? defaultCampusId ?? "",
  );
  const [condition, setCondition] = React.useState(initial?.condition ?? "");
  const [rateType, setRateType] = React.useState(
    initial?.rate_type ?? "per_hour",
  );
  const [days, setDays] = React.useState<string[]>(initial?.availability ?? []);
  const [price, setPrice] = React.useState(
    initial?.price != null ? String(initial.price) : "",
  );
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(null);

  const isService = type === "service";
  const suffix = isService ? rateSuffix(rateType) : "";
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  function validate(forPublish: boolean) {
    if (!campusId) return "Choose the campus where buyers can collect this.";
    if (title.trim().length < 3)
      return "Give your listing a title (at least 3 characters).";
    const amount = Number(price);
    if (
      price === "" ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 1_000_000
    ) {
      return "Enter a valid price.";
    }
    if (!isService && !condition) return "Choose the condition.";
    if (isService && days.length === 0)
      return "Pick the days you're available.";
    if (description.trim().length < 10)
      return "Add a short description (at least 10 characters).";
    if (forPublish && slots.length === 0) return "Add at least one photo.";
    return null;
  }

  async function persist(status: SellerListing["status"]) {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in.");
      setBusy(false);
      return null;
    }

    // 1. Upload new photos, keeping the slot order
    const uploaded: string[] = [];
    const urls: string[] = [];

    for (const slot of slots) {
      if (!slot.file) {
        urls.push(slot.url);
        continue;
      }
      const path = `${user.id}/${crypto.randomUUID()}.${EXT[slot.file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, slot.file, { contentType: slot.file.type });

      if (uploadError) {
        if (uploaded.length)
          await supabase.storage.from(BUCKET).remove(uploaded);
        setError(`Photo upload failed: ${uploadError.message}`);
        setBusy(false);
        return null;
      }
      uploaded.push(path);
      urls.push(
        supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      );
    }

    // 2. Save the listing
    const fields = {
      type,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category_id: categoryId || null,
      condition: isService ? null : condition,
      rate_type: isService ? rateType : null,
      availability: isService ? days : [],
      images: urls,
      image_url: urls[0] ?? null,
      status,
      campus_id: campusId,
    };

    const result = initial
      ? await supabase
          .from("listings")
          .update(fields)
          .eq("id", initial.id)
          .select("id")
          .single()
      : await supabase
          .from("listings")
          .insert({ ...fields, seller_id: user.id })
          .select("id")
          .single();

    if (result.error) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      setError(result.error.message);
      setBusy(false);
      return null;
    }

    // 3. Delete photos that were taken out
    const removed = startImages
      .filter((u) => !urls.includes(u))
      .map(storagePath)
      .filter((p): p is string => !!p);
    if (removed.length) await supabase.storage.from(BUCKET).remove(removed);

    setBusy(false);
    return result.data.id as string;
  }

  function goPreview() {
    const problem = validate(true);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep("preview");
    window.scrollTo({ top: 0 });
  }

  async function saveDraft() {
    const problem = validate(false);
    if (problem) {
      setError(problem);
      return;
    }
    const id = await persist("draft");
    if (id) {
      toast.success("Draft saved");
      router.push("/seller");
      router.refresh();
    }
  }

  async function publish() {
    const id = await persist(archived ? "archived" : "active");
    if (id) {
      setSavedId(id);
      setStep("done");
      window.scrollTo({ top: 0 });
    }
  }

  /* ---------- Published ---------- */
  if (step === "done") {
    return (
      <div className="mx-auto max-w-sm h-full items-center space-y-6 rounded-2xl bg-gray-300 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            {archived
              ? "Changes saved"
              : initial?.status === "active"
                ? "Listing updated"
                : "Your listing is live"}
          </h1>
          <p className="text-sm text-black">
            {archived
              ? "This listing is archived, so buyers can't see it yet."
              : "Students can now find and message you about it."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href={`/listings/${savedId}`}>
            <Button className="w-full">View My Listing</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Preview ---------- */
  if (step === "preview") {
    const cover = slots[0]?.url;
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Confirm Your Listing</h1>
          <p className="text-sm text-muted-foreground">
            This is exactly how buyers will see it
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border p-4 shadow-sm">
          <div className="aspect-4/3 overflow-hidden rounded-xl bg-muted">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={title} className="size-full object-cover" />
            )}
          </div>

          <div className="space-y-1">
            <p className="font-semibold">{title}</p>
            <p className="font-bold text-primary">
              R{Number(price).toFixed(2)}
              {suffix && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge
                variant="secondary"
                className="bg-gold-lite capitalize text-gold-dark"
              >
                {type}
              </Badge>
              {categoryName && <Badge variant="outline">{categoryName}</Badge>}
              {!isService && conditionLabel(condition) && (
                <Badge variant="outline">{conditionLabel(condition)}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-3 text-sm">
            <Avatar className="size-7">
              {seller.avatarUrl && (
                <AvatarImage src={seller.avatarUrl} alt={seller.name} />
              )}
              <AvatarFallback className="text-[10px]">
                {initialsOf(seller.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{seller.name}</span>
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setStep("form")}
          >
            Edit
          </Button>
          <Button disabled={busy} onClick={publish}>
            {busy
              ? "Saving..."
              : initial?.status === "active" || archived
                ? "Save changes"
                : "Publish"}
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Form ---------- */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {initial ? "Edit listing" : "Add a Listing"}
      </h1>

      {archived && (
        <p className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
          This listing is archived and hidden from buyers. Only an admin can
          restore it.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
        {(["product", "service"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium capitalize",
              type === t
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-2">
          <Label>Photos (up to 4, the first is the cover)</Label>
          <ListingPhotos
            slots={slots}
            onChange={setSlots}
            onError={setError}
            disabled={busy}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 5MB each.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={selectClass}
            >
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campus">Campus</Label>
            <select
              id="campus"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className={selectClass}
            >
              <option value="">Choose a campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Where buyers can meet you to collect this.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isService ? (
              <div className="space-y-2">
                <Label htmlFor="rate-type">Rate type</Label>
                <select
                  id="rate-type"
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value)}
                  className={selectClass}
                >
                  {RATE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Choose</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="price">Price (R)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {isService && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Availability</legend>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={days.includes(d.value)}
                    onClick={() =>
                      setDays((prev) =>
                        prev.includes(d.value)
                          ? prev.filter((x) => x !== d.value)
                          : [...prev, d.value],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      days.includes(d.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={5}
            />
            <p className="text-right text-xs text-muted-foreground">
              {description.length}/1000
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button onClick={goPreview} disabled={busy}>
              Preview
            </Button>
            {canDraft && (
              <Button variant="outline" onClick={saveDraft} disabled={busy}>
                {busy ? "Saving..." : "Save to Draft"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
