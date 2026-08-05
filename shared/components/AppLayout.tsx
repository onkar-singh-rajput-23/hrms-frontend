"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { initials } from "@/shared/helper/format";
import { translateRole, type TranslationKey } from "@/shared/i18n";
import { Icon, type IconName } from "@/shared/lib/components/Icon";
import { IconButton } from "@/shared/lib/components/Button";
import { Sheet, SheetOption } from "@/shared/lib/components/Sheet";
import type { Role } from "@/shared/types/hrms";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: IconName;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
  { to: "/attendance", labelKey: "nav.attendance", icon: "clock" },
  { to: "/leave", labelKey: "nav.leave", icon: "palm" },
  { to: "/payroll", labelKey: "nav.payroll", icon: "wallet" },
  { to: "/work-roles", labelKey: "nav.workRoles", icon: "clipboard" },
  { to: "/employees", labelKey: "nav.employees", icon: "users", roles: ["manager", "admin"] },
  { to: "/users", labelKey: "nav.users", icon: "shield", roles: ["admin"] },
  { to: "/profile", labelKey: "nav.profile", icon: "user" },
];

/** Tabs shown in the bottom bar; everything else moves into the "More" sheet. */
const MOBILE_TAB_COUNT = 4;

function visibleItems(role: Role | undefined) {
  return NAV_ITEMS.filter((item) => !item.roles || (role && (item.roles.includes(role) || role === "admin")));
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { isMobile } = useAppData();
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = visibleItems(user?.role);
  const tabs = items.slice(0, MOBILE_TAB_COUNT);
  const overflow = items.slice(MOBILE_TAB_COUNT);
  const roleLabel = user ? translateRole(t, user.role) : "";
  const currentItem = items.find((item) => item.to === pathname);

  function isActive(to: string) {
    return pathname === to;
  }

  function signOut() {
    logout();
    router.replace("/login");
  }

  function goTo(to: string) {
    setMenuOpen(false);
    router.push(to);
  }

  if (isMobile) {
    const overflowActive = overflow.some((item) => isActive(item.to));

    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
        <header className="safe-top z-20 shrink-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
          <div className="flex items-center gap-3 px-4 pb-4 pt-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[15px] font-bold backdrop-blur">
              {initials(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium uppercase tracking-wide text-brand-100">
                {user?.name}
                {roleLabel && ` · ${roleLabel}`}
              </p>
              <p className="truncate text-[17px] font-bold leading-tight">
                {currentItem ? t(currentItem.labelKey) : t("app.name")}
              </p>
            </div>
            <LanguageSwitcher tone="onBrand" />
            <IconButton icon="logout" label={t("app.signOut")} variant="onBrand" onClick={signOut} />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="pb-nav w-full animate-rise-in px-4 pt-4">{children}</div>
        </main>

        <nav
          aria-label={t("app.menu")}
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white/95 px-1 pt-1 backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${tabs.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}
        >
          {tabs.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              aria-label={t(item.labelKey)}
              aria-current={isActive(item.to) ? "page" : undefined}
              className={`tap flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10.5px] font-semibold ${
                isActive(item.to) ? "text-brand-700" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive(item.to) ? "bg-brand-50" : ""
                }`}
              >
                <Icon name={item.icon} size={20} strokeWidth={isActive(item.to) ? 2.1 : 1.8} />
              </span>
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          ))}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("nav.more")}
              aria-haspopup="dialog"
              className={`tap flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10.5px] font-semibold ${
                overflowActive ? "text-brand-700" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  overflowActive ? "bg-brand-50" : ""
                }`}
              >
                <Icon name="ellipsis" size={20} strokeWidth={overflowActive ? 2.6 : 2.2} />
              </span>
              <span className="max-w-full truncate">{t("nav.more")}</span>
            </button>
          )}
        </nav>

        <Sheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={t("app.menu")}
          closeLabel={t("common.close")}
        >
          <div className="space-y-1">
            {overflow.map((item) => (
              <SheetOption
                key={item.to}
                label={t(item.labelKey)}
                selected={isActive(item.to)}
                onClick={() => goTo(item.to)}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    isActive(item.to) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                <Icon name="chevronRight" size={17} className="shrink-0 text-slate-300" />
              </SheetOption>
            ))}
            <SheetOption label={t("app.signOut")} onClick={signOut}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Icon name="logout" size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate text-rose-600">{t("app.signOut")}</span>
            </SheetOption>
          </div>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-w-[1024px] overflow-hidden bg-slate-50">
      <aside className="safe-top safe-bottom flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4">
          <p className="text-lg font-bold text-slate-900">{t("app.name")}</p>
          <p className="text-xs text-slate-500">{t("app.tagline")}</p>
        </div>
        <nav aria-label={t("app.menu")} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              aria-current={isActive(item.to) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(item.to)
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="mt-auto shrink-0 space-y-3 border-t border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[13px] font-bold text-brand-700">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={signOut}
              className="tap min-h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t("app.signOut")}
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
