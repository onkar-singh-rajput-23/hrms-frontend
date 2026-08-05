import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/shared/constants/locales";
import { createAppDataFromUserAgent } from "@/shared/utils/appData";
import type { AppData } from "@/shared/types/app";
import type { Locale } from "@/shared/types/i18n";

export async function getAppData(): Promise<AppData> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  return createAppDataFromUserAgent(userAgent);
}

/** Read on the server so the first paint is already in the user's language (no flash of English). */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
