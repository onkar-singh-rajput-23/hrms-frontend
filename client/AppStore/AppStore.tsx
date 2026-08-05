"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { AppData } from "@/shared/types/app";
import type { Locale } from "@/shared/types/i18n";
import { AppDataProvider } from "./AppDataContext";
import { AuthProvider } from "./AuthContext";
import { LocaleProvider } from "./LocaleContext";

export function AppStore({
  appData,
  locale,
  children,
}: {
  appData: AppData;
  locale: Locale;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <AppDataProvider appData={appData}>
      <LocaleProvider initialLocale={locale}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </AppDataProvider>
  );
}
