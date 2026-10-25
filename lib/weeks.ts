const TZ = "Africa/Johannesburg";

export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

// The Monday of the week a date falls in ("YYYY-MM-DD")
export function mondayOf(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export const currentWeek = () => mondayOf(today());

export function shiftWeek(week: string, delta: number) {
  const d = new Date(`${week}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

// A week is over once the next Monday has arrived
export const weekIsOver = (week: string) => shiftWeek(week, 1) <= today();

export function weekLabel(week: string) {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const f = (d: Date) =>
    d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${f(start)} – ${f(end)} ${end.getUTCFullYear()}`;
}