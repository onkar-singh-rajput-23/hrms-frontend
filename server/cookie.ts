import { headers } from "next/headers";
import { createAppDataFromUserAgent } from "@/shared/utils/appData";
import type { AppData } from "@/shared/types/app";

export async function getAppData(): Promise<AppData> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  return createAppDataFromUserAgent(userAgent);
}
