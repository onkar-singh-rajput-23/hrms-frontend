export type Locale = "en" | "hi";

export interface LocaleOption {
  value: Locale;
  /** Name of the language in English, for accessibility labels. */
  label: string;
  /** Name of the language written in that language, shown in the picker. */
  nativeLabel: string;
  /** Two-or-three character badge used in the compact navbar button. */
  shortLabel: string;
}

export type TranslateVars = Record<string, string | number>;
