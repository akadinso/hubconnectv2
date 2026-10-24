export type Sort = "newest" | "rating" | "price_asc" | "price_desc";

export type MarketFilters = {
  q: string;
  type?: "product" | "service";
  campus?: string; // slug
  category?: string; // slug
  min?: number;
  max?: number;
  conditions: string[];
  verified: boolean;
  rating?: number;
  sort: Sort;
};

export const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const CONDITION_VALUES = ["new", "like_new", "good", "fair"];

const num = (v?: string) => {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

// Turns raw URL params into safe, validated filters
export function parseFilters(sp: Record<string, string | undefined>): MarketFilters {
  let min = num(sp.min);
  let max = num(sp.max);
  if (min != null && max != null && min > max) [min, max] = [max, min];

  const rating = Number(sp.rating);

  return {
    q: (sp.q ?? "").trim().slice(0, 80),
    type: sp.type === "product" || sp.type === "service" ? sp.type : undefined,
    campus: sp.campus || undefined,
    category: sp.category || undefined,
    min,
    max,
    conditions: (sp.condition ?? "")
      .split(",")
      .filter((c) => CONDITION_VALUES.includes(c)),
    verified: sp.verified === "1",
    rating: rating === 3 || rating === 4 ? rating : undefined,
    sort: SORTS.some((s) => s.value === sp.sort) ? (sp.sort as Sort) : "newest",
  };
}

// Overrides with undefined clear a filter
export function buildHref(f: MarketFilters, overrides: Partial<MarketFilters> = {}) {
  const x = { ...f, ...overrides };
  const p = new URLSearchParams();

  if (x.q) p.set("q", x.q);
  if (x.type) p.set("type", x.type);
  if (x.campus) p.set("campus", x.campus);
  if (x.category) p.set("category", x.category);
  if (x.min != null) p.set("min", String(x.min));
  if (x.max != null) p.set("max", String(x.max));
  if (x.conditions.length) p.set("condition", x.conditions.join(","));
  if (x.verified) p.set("verified", "1");
  if (x.rating) p.set("rating", String(x.rating));
  if (x.sort !== "newest") p.set("sort", x.sort);

  const qs = p.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

// Only the filters that live in the drawer (type, campus, sort and search have their own controls)
export const DRAWER_RESET: Partial<MarketFilters> = {
  category: undefined,
  min: undefined,
  max: undefined,
  conditions: [],
  verified: false,
  rating: undefined,
};

export function activeFilterCount(f: MarketFilters) {
  return (
    (f.category ? 1 : 0) +
    (f.min != null || f.max != null ? 1 : 0) +
    (f.conditions.length ? 1 : 0) +
    (f.verified ? 1 : 0) +
    (f.rating ? 1 : 0)
  );
}