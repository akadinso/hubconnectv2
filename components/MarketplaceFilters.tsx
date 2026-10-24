"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CONDITIONS } from "@/lib/marketplace-options";
import {
  DRAWER_RESET,
  activeFilterCount,
  buildHref,
  type MarketFilters,
} from "@/lib/marketplace-filters";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Under R100", min: "", max: "100" },
  { label: "R100 – R300", min: "100", max: "300" },
  { label: "R300+", min: "300", max: "" },
];

const RATINGS = [
  { value: undefined, label: "Any" },
  { value: 3, label: "3★ & up" },
  { value: 4, label: "4★ & up" },
] as const;

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

const toNum = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function MarketplaceFilters({
  filters,
  categories,
}: {
  filters: MarketFilters;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState(filters.category ?? "");
  const [min, setMin] = React.useState(
    filters.min != null ? String(filters.min) : "",
  );
  const [max, setMax] = React.useState(
    filters.max != null ? String(filters.max) : "",
  );
  const [conditions, setConditions] = React.useState<string[]>(
    filters.conditions,
  );
  const [verified, setVerified] = React.useState(filters.verified);
  const [rating, setRating] = React.useState<number | undefined>(
    filters.rating,
  );

  const count = activeFilterCount(filters);
  const isService = filters.type === "service";

  function apply() {
    let lo = toNum(min);
    let hi = toNum(max);
    if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];

    router.push(
      buildHref(filters, {
        category: category || undefined,
        min: lo,
        max: hi,
        // Services have no condition, so ignore it there
        conditions: isService ? [] : conditions,
        verified,
        rating,
      }),
    );
    setOpen(false);
  }

  function reset() {
    router.push(buildHref(filters, DRAWER_RESET));
    setOpen(false);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "left"}
    >
      <DrawerTrigger
        render={
          <Button variant="outline" type="button">
            <SlidersHorizontal />
            Filters
            {count > 0 && <Badge className="ml-1">{count}</Badge>}
          </Button>
        }
      />

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Narrow down what you're looking for.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="f-category">Category</Label>
            <select
              id="f-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-medium">Price (R)</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Min"
                aria-label="Minimum price"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Max"
                aria-label="Maximum price"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Pill
                  key={p.label}
                  active={min === p.min && max === p.max}
                  onClick={() => {
                    setMin(p.min);
                    setMax(p.max);
                  }}
                >
                  {p.label}
                </Pill>
              ))}
            </div>
          </fieldset>

          {!isService && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Condition</legend>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Pill
                    key={c.value}
                    active={conditions.includes(c.value)}
                    onClick={() =>
                      setConditions((prev) =>
                        prev.includes(c.value)
                          ? prev.filter((x) => x !== c.value)
                          : [...prev, c.value],
                      )
                    }
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Applies to products only.
              </p>
            </fieldset>
          )}

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Rating</legend>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map((r) => (
                <Pill
                  key={r.label}
                  active={rating === r.value}
                  onClick={() => setRating(r.value)}
                >
                  {r.label}
                </Pill>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="accent-primary"
            />
            Verified sellers only
          </label>
        </div>

        <DrawerFooter>
          <Button onClick={apply}>Show results</Button>
          <Button variant="outline" onClick={reset}>
            Reset filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
