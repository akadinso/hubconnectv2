export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const RATE_TYPES = [
  { value: "per_hour", label: "Per hour", suffix: "per hour" },
  { value: "per_session", label: "Per session", suffix: "per session" },
  { value: "fixed", label: "Fixed price", suffix: "fixed price" },
];

export const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export const SHOP_TAGS = [
  "Made to order",
  "Collect at the Hub",
  "Gift wrapping available",
  "Delivery available",
  "Custom requests",
];

export const conditionLabel = (v?: string | null) =>
  CONDITIONS.find((c) => c.value === v)?.label ?? null;

export const rateSuffix = (v?: string | null) =>
  RATE_TYPES.find((r) => r.value === v)?.suffix ?? "";

// "Active · Eduvos student" turns into "Alumni" once the graduation date has passed
export function studentStatus(expectedGraduation?: string | null) {
  const alumni = !!expectedGraduation && new Date(expectedGraduation) < new Date();
  return alumni
    ? { label: "Alumni", note: null }
    : { label: "Active · Eduvos student", note: 'Changes to "Alumni" after graduation' };
}