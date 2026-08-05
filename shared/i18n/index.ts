import type { Locale, TranslateVars } from "@/shared/types/i18n";
import { DEFAULT_LOCALE } from "@/shared/constants/locales";
import { en, type TranslationKey } from "./en";
import { hi } from "./hi";

export type { TranslationKey };

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { en, hi };

/** `{name}` → the matching value in `vars`; unknown placeholders are left untouched. */
function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in vars ? String(vars[token]) : match
  );
}

/** Last-resort label for a key that exists in neither dictionary (e.g. a new backend status). */
function humanize(key: string): string {
  const tail = key.slice(key.lastIndexOf(".") + 1).replace(/_/g, " ");
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

export function translate(locale: Locale, key: TranslationKey, vars?: TranslateVars): string {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  return interpolate(dictionary[key] ?? en[key] ?? humanize(key), vars);
}

export type TranslateFn = (key: TranslationKey, vars?: TranslateVars) => string;

/**
 * Values that arrive from the API (statuses, roles) are plain strings, so they can't be typed as
 * `TranslationKey`. These helpers translate them when we have a matching entry and fall back to a
 * readable label when we don't.
 */
export function translateStatus(t: TranslateFn, status: string): string {
  return t(`status.${status}` as TranslationKey);
}

export function translateRole(t: TranslateFn, role: string): string {
  return t(`role.${role}` as TranslationKey);
}

export function translateMonth(t: TranslateFn, month: number): string {
  return t(`month.${month}` as TranslationKey);
}

/** Month names 1–12 in order, for `<select>` lists. */
export function monthOptions(t: TranslateFn): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: translateMonth(t, index + 1),
  }));
}
