import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { isValidTimestamp } from "./snapshots"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatDate(
  ts: string | undefined,
  pattern: string,
  fallback = "—"
): string {
  if (!isValidTimestamp(ts)) return fallback;
  try {
    return format(new Date(ts!), pattern);
  } catch {
    return fallback;
  }
}

/** Chart axis label in UTC so timestamps match sheet/API (avoids IST offset duplicates). */
export function formatChartTimestamp(ts: string): string {
  const d = new Date(ts);
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hh}:${mm} UTC`;
}

export function safeFormatDistance(ts: string | undefined, fallback = "—"): string {
  if (!isValidTimestamp(ts)) return fallback;
  try {
    return formatDistanceToNow(new Date(ts!), { addSuffix: true });
  } catch {
    return fallback;
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
