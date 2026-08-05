import type { Locale } from "@/shared/types/i18n";
import { translateMonth, type TranslateFn } from "@/shared/i18n";

const INTL_LOCALES: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale] ?? "en-IN";
}

/** Up-to-two-letter initials for the header avatar. */
export function initials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export function formatTime(value: string | undefined, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(intlLocale(locale), { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(value: string | undefined, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "2026-08" → "August 2026", localised. */
export function formatMonthKey(monthKey: string, t: TranslateFn): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return `${translateMonth(t, month)} ${year}`;
}

export function formatRupees(amount: number, locale: Locale): string {
  return `₹${amount.toLocaleString(intlLocale(locale), { maximumFractionDigits: 0 })}`;
}

/** Time-of-day greeting key for the mobile header. */
export function greetingKey(date = new Date()): "greeting.morning" | "greeting.afternoon" | "greeting.evening" {
  const hour = date.getHours();
  if (hour < 12) return "greeting.morning";
  if (hour < 17) return "greeting.afternoon";
  return "greeting.evening";
}
