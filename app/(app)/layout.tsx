import type { ReactNode } from "react";
import { AppLayout } from "@/shared/components/AppLayout";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
