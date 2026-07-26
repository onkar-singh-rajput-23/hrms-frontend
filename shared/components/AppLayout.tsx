"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { Role } from "@/shared/types/hrms";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/attendance", label: "Attendance", icon: "🕒" },
  { to: "/leave", label: "Leave", icon: "🌴" },
  { to: "/payroll", label: "Payroll", icon: "💰" },
  { to: "/work-roles", label: "Work Roles", icon: "📋" },
  { to: "/employees", label: "Employees", icon: "🧑‍💼", roles: ["admin"] },
  { to: "/users", label: "Users", icon: "🛡️", roles: ["admin"] },
  { to: "/profile", label: "Profile", icon: "👤" },
];

function visibleItems(role: Role | undefined) {
  return NAV_ITEMS.filter((item) => !item.roles || (role && (item.roles.includes(role) || role === "admin")));
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { isMobile } = useAppData();
  const pathname = usePathname();
  const router = useRouter();
  const items = visibleItems(user?.role);
  const mobileItems = items.slice(0, 5);

  function isActive(to: string) {
    return pathname === to;
  }

  function signOut() {
    logout();
    router.replace("/login");
  }

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
        <header className="safe-top z-20 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-800">HRMS</p>
              <p className="truncate text-xs capitalize text-slate-500">{user?.role.replace("_", " ")}</p>
            </div>
            <button onClick={signOut} className="shrink-0 text-sm font-medium text-slate-500">
              Sign out
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-24">
          <div className="w-full px-4 py-4">{children}</div>
        </main>

        <nav
          className="safe-bottom fixed inset-x-0 bottom-0 z-10 grid border-t border-slate-200 bg-white"
          style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
        >
          {mobileItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={`flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium ${
                isActive(item.to) ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-w-[1024px] overflow-hidden bg-slate-50">
      <aside className="safe-top safe-bottom flex h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4">
          <p className="text-lg font-semibold text-slate-800">HRMS</p>
          <p className="text-xs text-slate-500">Internal People Platform</p>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.to) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto shrink-0 border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="truncate text-xs capitalize text-slate-500">{user?.role.replace("_", " ")}</p>
          <button
            onClick={signOut}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
