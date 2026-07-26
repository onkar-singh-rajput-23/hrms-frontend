"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { AppData } from "@/shared/types/app";
import { AppDataProvider } from "./AppDataContext";
import { AuthProvider } from "./AuthContext";

export function AppStore({ appData, children }: { appData: AppData; children: ReactNode }) {
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </AppDataProvider>
  );
}
