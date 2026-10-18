"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/app/(main)/seller/onboarding/actions";

const OFFERINGS = [
  { value: "products", label: "Products", hint: "Physical or digital items" },
  { value: "services", label: "Services", hint: "Work you do for others" },
  { value: "both", label: "Both", hint: "A mix of the two" },
];

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function SellerApplicationForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = React.useState("");
  const [offering, setOffering] = React.useState("both");
  const [categoryId, setCategoryId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitApplication({
        businessName,
        offering,
        categoryId,
        description,
        agreed,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Application sent");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="business-name">Business or brand name</Label>
        <Input
          id="business-name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={60}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">
          What will you sell?
        </legend>
        {OFFERINGS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-foreground"
          >
            <input
              type="radio"
              name="offering"
              value={o.value}
              checked={offering === o.value}
              onChange={() => setOffering(o.value)}
              className="accent-foreground"
            />
            <span>
              <span className="font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">
                {o.hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="category">Main category</Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
        >
          <option value="">Choose a category (optional)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Tell us about what you'll sell</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="What it is, who it's for, and how you'll deliver it"
          required
        />
        <p className="text-right text-xs text-muted-foreground">
          {description.length}/500
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-foreground"
        />
        <span className="text-muted-foreground">
          I'll only sell things I'm allowed to sell, describe them honestly, and
          deliver what buyers pay for.
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending || !agreed}>
        {pending ? "Sending..." : "Submit application"}
      </Button>
    </form>
  );
}
