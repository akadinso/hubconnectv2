export function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export function nameOf(
  p: { full_name?: string | null; username?: string | null } | null | undefined,
  fallback = "User",
) {
  return p?.full_name || p?.username || fallback;
}

export const shortId = (id: string) => `HC-${id.slice(0, 8).toUpperCase()}`;

export const rand = (n: number | string | null | undefined) =>
  `R${Number(n ?? 0).toFixed(2)}`;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}