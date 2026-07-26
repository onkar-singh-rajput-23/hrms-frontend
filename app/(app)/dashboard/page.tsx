import Dashboard from "@/shared/pages/Dashboard/Dashboard";
import DashboardWeb from "@/shared/pages/Dashboard/Web/DashboardWeb";
import { getAppData } from "@/server/cookie";

export default async function Page() {
  const { isMobile } = await getAppData();
  return isMobile ? <Dashboard /> : <DashboardWeb />;
}
