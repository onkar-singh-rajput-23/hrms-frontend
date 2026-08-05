"use client";

import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { formatDate, initials } from "@/shared/helper/format";
import { translateRole } from "@/shared/i18n";
import { Card, KeyValueGrid, PageHeader, SectionHeader } from "@/shared/lib/components/Surface";

export default function Profile() {
  const { user } = useAuth();
  const { locale, option, t } = useLocale();
  const employee = user?.employee;

  const details = [
    { label: t("common.email"), value: user?.email ?? t("common.empty") },
    { label: t("common.role"), value: user ? translateRole(t, user.role) : t("common.empty") },
    ...(employee
      ? [
          { label: t("profile.employeeCode"), value: employee.employeeCode },
          { label: t("profile.designation"), value: employee.designation || t("common.empty") },
          { label: t("profile.dateOfJoining"), value: formatDate(employee.dateOfJoining, locale) },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("profile.title")} />

      <Card>
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-lg font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-slate-900">{user?.name}</p>
            <p className="truncate text-[13px] text-slate-500">{user ? translateRole(t, user.role) : ""}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <KeyValueGrid items={details} />
        </div>
      </Card>

      {/* A second, easier-to-find entry point for the language choice. */}
      <section>
        <SectionHeader title={t("profile.preferences")} icon="globe" />
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-slate-900">{t("language.label")}</p>
              <p className="mt-0.5 truncate text-[13px] text-slate-500">{option.nativeLabel}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </Card>
      </section>
    </div>
  );
}
