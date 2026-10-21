export function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export function nameOf(
  p: { full_name?: string | null; username?: string | null } | null | undefined,
  fallback = "User",
) {
  return p?.full_name || p?.username || fallback;
}

export function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export const shortId = (id: string) => `HC-${id.slice(0, 8).toUpperCase()}`;

// One price format everywhere: R1 250.00 (two decimals, non-breaking space for thousands)
export function rand(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "R0.00";
  const [whole, cents] = Math.abs(n).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${n < 0 ? "-" : ""}R${grouped}.${cents}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}