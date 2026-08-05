import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppStore } from "@/client/AppStore/AppStore";
import { getAppData, getLocale } from "@/server/cookie";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRMS",
  description: "Internal HRMS platform",
};

/** `viewportFit: cover` is what makes the `env(safe-area-inset-*)` padding work on notched phones. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#6218cc",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [appData, locale] = await Promise.all([getAppData(), getLocale()]);

  return (
    <html lang={locale}>
      <body>
        <AppStore appData={appData} locale={locale}>
          {children}
        </AppStore>
      </body>
    </html>
  );
}
