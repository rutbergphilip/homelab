const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// sv-SE happens to format dates as ISO YYYY-MM-DD.
const stockholmFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayStockholm(): string {
  return stockholmFormatter.format(new Date());
}

// UTC-day based date arithmetic — immune to DST since dates are pure Y-M-D.
export function toEpochDays(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function epochDaysToDate(days: number): string {
  return new Date(days * 86_400_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  return epochDaysToDate(toEpochDays(date) + n);
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
