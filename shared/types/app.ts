export type AppSurface = "web" | "mweb";

export interface AppData {
  isMobile: boolean;
  surface: AppSurface;
  clientId: "hrmsweb" | "hrmsmweb";
  apiKey: "hrmsweb!1$" | "hrmsmweb!1$";
}
