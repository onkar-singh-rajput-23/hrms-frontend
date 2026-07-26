"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { setClientRequestContext } from "@/client/interceptor/helper";
import type { AppData } from "@/shared/types/app";

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ appData, children }: { appData: AppData; children: ReactNode }) {
  const value = useMemo(() => appData, [appData]);
  setClientRequestContext(value);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside AppDataProvider");
  return value;
}
