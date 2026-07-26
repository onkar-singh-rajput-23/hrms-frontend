import Users from "@/shared/pages/Users/Users";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <Users />
    </ProtectedRoute>
  );
}
