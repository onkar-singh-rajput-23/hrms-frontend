import { createAppData } from "@/shared/utils/appData";
import type { AppData } from "@/shared/types/app";

let currentAppData: AppData = createAppData(false);

export function setClientRequestContext(appData: AppData): void {
  currentAppData = appData;
}

export function getClientRequestHeaders(): Record<string, string> {
  return {
    "x-client-id": currentAppData.clientId,
    "x-api-key": currentAppData.apiKey,
    "x-app-surface": currentAppData.surface,
  };
}
