/**
 * Date-range resolution for the admin dashboard's reporting filter.
 *
 * Pure and import-free: which instants a range covers decides which orders
 * count toward revenue, so the boundary maths is kept directly testable rather
 * than reachable only through a data fetch.
 */

export type RangeKey = "7d" | "30d" | "90d" | "fy" | "all" | "custom";

export type DateRange = {
  /** Inclusive lower bound as an ISO instant, or null for "since the beginning". */
  fromISO: string | null;
  /** Inclusive upper bound as an ISO instant, or null for "up to now". */
  toISO: string | null;
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** India's financial year runs 1 April to 31 March. */
function startOfFinancialYear(now: Date): Date {
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 3, 1, 0, 0, 0, 0);
}

/**
 * Resolves a preset into instants. Dates are interpreted in the browser's local
 * zone — an admin in Delhi picking "20 Nov" means IST midnight to IST midnight,
 * not UTC, which would silently shift every boundary by 5½ hours.
 */
export function resolveRange(
  key: RangeKey,
  custom?: { from: string; to: string } | undefined,
  /** Injectable clock; tests pin it so the financial-year boundary is checkable. */
  now: Date = new Date(),
): DateRange {
  if (key === "all") return { fromISO: null, toISO: null };
  if (key === "custom") {
    const from = custom?.from ? new Date(`${custom.from}T00:00:00`) : null;
    const to = custom?.to ? new Date(`${custom.to}T00:00:00`) : null;
    return {
      fromISO: from && !Number.isNaN(from.getTime()) ? startOfLocalDay(from).toISOString() : null,
      toISO: to && !Number.isNaN(to.getTime()) ? endOfLocalDay(to).toISOString() : null,
    };
  }
  if (key === "fy") {
    return { fromISO: startOfFinancialYear(now).toISOString(), toISO: null };
  }
  const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  return { fromISO: startOfLocalDay(from).toISOString(), toISO: null };
}

export const RANGE_LABELS: Record<Exclude<RangeKey, "custom">, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  fy: "This financial year",
  all: "All time",
};
