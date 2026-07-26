import type { AppData } from "@/shared/types/app";

export function detectMobileUserAgent(userAgent: string): boolean {
  return /mobile/i.test(userAgent);
}

export function createAppData(isMobile: boolean): AppData {
  if (isMobile) {
    return {
      isMobile: true,
      surface: "mweb",
      clientId: "hrmsmweb",
      apiKey: "hrmsmweb!1$",
    };
  }

  return {
    isMobile: false,
    surface: "web",
    clientId: "hrmsweb",
    apiKey: "hrmsweb!1$",
  };
}

export function createAppDataFromUserAgent(userAgent: string): AppData {
  return createAppData(detectMobileUserAgent(userAgent));
}
