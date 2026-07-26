import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppStore } from "@/client/AppStore/AppStore";
import { getAppData } from "@/server/cookie";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRMS",
  description: "Internal HRMS platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const appData = await getAppData();

  return (
    <html lang="en">
      <body>
        <AppStore appData={appData}>{children}</AppStore>
      </body>
    </html>
  );
}
