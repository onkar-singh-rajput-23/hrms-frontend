import Employees from "@/shared/pages/Employees/Employees";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["manager", "admin"]}>
      <Employees />
    </ProtectedRoute>
  );
}
