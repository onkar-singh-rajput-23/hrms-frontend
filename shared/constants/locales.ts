import type { Locale, LocaleOption } from "@/shared/types/i18n";

/** Cookie is readable on the server so the first paint already uses the right language. */
export const LOCALE_COOKIE = "hrms_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Used until the visitor picks a language; their choice is then remembered in the cookie. */
export const DEFAULT_LOCALE: Locale = "hi";

export const LOCALES: LocaleOption[] = [
  { value: "en", label: "English", nativeLabel: "English", shortLabel: "EN" },
  { value: "hi", label: "Hindi", nativeLabel: "हिन्दी", shortLabel: "हिं" },
];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((locale) => locale.value === value);
}

export function localeOption(locale: Locale): LocaleOption {
  return LOCALES.find((option) => option.value === locale) ?? LOCALES[0];
}
