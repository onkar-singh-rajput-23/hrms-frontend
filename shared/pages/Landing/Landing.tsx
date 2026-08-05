"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { Icon, type IconName } from "@/shared/lib/components/Icon";
import type { TranslationKey } from "@/shared/i18n";

const FEATURES: { icon: IconName; titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { icon: "clock", titleKey: "landing.featureAttendanceTitle", textKey: "landing.featureAttendanceText" },
  { icon: "palm", titleKey: "landing.featureLeaveTitle", textKey: "landing.featureLeaveText" },
  { icon: "wallet", titleKey: "landing.featurePayrollTitle", textKey: "landing.featurePayrollText" },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (!loading && user) return null;

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="safe-top flex items-center justify-between px-4 py-3.5 sm:px-8">
        <p className="text-[17px] font-bold text-slate-900">{t("app.name")}</p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="tap inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            {t("landing.logIn")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-8 text-center sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
          <Icon name="spark" size={13} />
          {t("app.tagline")}
        </span>
        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          {t("landing.heroTitle")}
        </h1>
        <p className="mx-auto mt-3.5 max-w-xl text-[15px] leading-relaxed text-slate-500">
          {t("landing.heroBody")}
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="tap inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-semibold text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700"
          >
            {t("landing.register")}
            <Icon name="arrowRight" size={17} />
          </Link>
          <Link
            href="/login"
            className="tap inline-flex min-h-13 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("landing.logIn")}
          </Link>
        </div>

        <div className="mt-12 grid gap-3 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={feature.icon} size={20} />
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">{t(feature.titleKey)}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{t(feature.textKey)}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
