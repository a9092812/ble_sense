import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: number | string): string {
  const date = new Date(Number(ts));
  if (isNaN(date.getTime())) return '--:--:--';
  return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(ts: number | string): string {
  const date = new Date(Number(ts));
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export function formatDate(ts: number | string): string {
  const date = new Date(typeof ts === 'string' ? ts : Number(ts));
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Generate an RFC3339 string from a Date or offset string (e.g. "1h", "24h", "7d")
 */
export function toRFC3339(input: Date | string): string {
  if (input instanceof Date) return input.toISOString();
  // Parse offset like "1h", "24h", "7d"
  const match = (input as string).match(/^(\d+)([hmd])$/);
  if (!match) return new Date().toISOString();
  const [, val, unit] = match;
  const ms = unit === 'h' ? parseInt(val) * 3_600_000
           : unit === 'm' ? parseInt(val) * 60_000
           : parseInt(val) * 86_400_000;
  return new Date(Date.now() - ms).toISOString();
}
