"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { Role } from "@/shared/types/hrms";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = !!user && (!roles || roles.includes(user.role) || user.role === "admin");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!authorized) {
      router.replace("/");
    }
  }, [authorized, loading, router, user]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user || !authorized) return null;
  return <>{children}</>;
}
