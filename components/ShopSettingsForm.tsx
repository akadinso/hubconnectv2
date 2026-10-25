"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_TAGS } from "@/lib/marketplace-options";
import { updateShop } from "@/app/(main)/settings/profile/shop-actions";

export function ShopSettingsForm({
  initial,
}: {
  initial: {
    shopName: string;
    tagline: string;
    tags: string[];
    expectedGraduation: string;
  };
}) {
  const router = useRouter();
  const [shopName, setShopName] = React.useState(initial.shopName);
  const [tagline, setTagline] = React.useState(initial.tagline);
  const [tags, setTags] = React.useState<string[]>(initial.tags);
  const [graduation, setGraduation] = React.useState(
    initial.expectedGraduation,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function toggle(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= 5
          ? prev
          : [...prev, tag],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateShop({
        shopName,
        tagline,
        tags,
        expectedGraduation: graduation,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Shop details saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border p-6">
      <div className="space-y-1">
        <h2 className="font-semibold">Shop details</h2>
        <p className="text-sm text-muted-foreground">
          Shown on your store page.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Shop name</Label>
          <Input
            id="shop-name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduation">Expected graduation</Label>
          <Input
            id="graduation"
            type="date"
            value={graduation}
            onChange={(e) => setGraduation(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your badge changes to "Alumni" after this date.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={120}
            placeholder="Handmade jewellery · 2nd-year BCom student, Midrand"
          />
        </div>

        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Tags (up to 5)</legend>
          <div className="flex flex-wrap gap-2">
            {SHOP_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={tags.includes(tag)}
                onClick={() => toggle(tag)}
                className={
                  tags.includes(tag)
                    ? "rounded-full border border-foreground bg-foreground px-3 py-1 text-xs text-background"
                    : "rounded-full border px-3 py-1 text-xs hover:bg-muted"
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save shop details"}
        </Button>
      </div>
    </form>
  );
}
