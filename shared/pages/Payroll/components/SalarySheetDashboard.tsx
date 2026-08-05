"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { formatRupees, initials } from "@/shared/helper/format";
import { translateMonth, type TranslationKey } from "@/shared/i18n";
import { Icon } from "@/shared/lib/components/Icon";
import { Select } from "@/shared/lib/components/Field";
import { Card, MetricTile, SectionHeader } from "@/shared/lib/components/Surface";
import {
  SALARY_SHEET,
  SALARY_MONTH_NUMBER,
  SALARY_YEAR,
  DAYS_IN_MONTH,
  avatarColor,
  derive,
  STATUS_KEY,
  STATUS_PILL,
  STATUS_DOT,
  type SalaryRow,
} from "../salarySheet";

interface Props {
  /** Admins see the whole roster; managers are locked to their own row. */
  canViewAll: boolean;
  /** name of the signed-in employee, used to pick their row when they can't see everyone */
  employeeName?: string;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

function Bar({ label, n, cls }: { label: string; n: number; cls: string }) {
  const pct = DAYS_IN_MONTH > 0 ? (n / DAYS_IN_MONTH) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold tabular-nums text-slate-800">
          {n} <span className="font-normal text-slate-400">/ {DAYS_IN_MONTH}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmployeeDetail({ row }: { row: SalaryRow }) {
  const { locale, t } = useLocale();
  const { isMobile } = useAppData();
  const { perDay, earned, attendancePct } = derive(row);
  const statusLabel = t(STATUS_KEY[row.status] as TranslationKey);

  return (
    <div className="space-y-3.5">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold text-slate-900">{row.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-slate-500">
              <span className="truncate">{row.role}</span>
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                {row.id}
              </span>
            </div>
          </div>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-bold ${
              STATUS_PILL[row.status]
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </Card>

      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4"}`}>
        <MetricTile
          label={t("salary.netInHandCard")}
          value={formatRupees(row.inHand, locale)}
          hint={statusLabel}
          icon="wallet"
          tone="brand"
        />
        <MetricTile
          label={t("salary.grossPerMonth")}
          value={formatRupees(row.gross, locale)}
          hint={t("salary.perDay", { amount: formatRupees(perDay, locale) })}
          icon="trendUp"
        />
        <MetricTile
          label={t("salary.advanceTaken")}
          value={formatRupees(row.advance, locale)}
          hint={row.advance > 0 ? t("salary.advanceDeducted") : t("common.none")}
          icon="briefcase"
        />
        <MetricTile
          label={t("salary.attendance")}
          value={`${attendancePct}%`}
          hint={t("salary.attendanceHint", { present: row.present, absent: row.absent })}
          icon="clock"
        />
      </div>

      <div className={`grid gap-3.5 ${isMobile ? "grid-cols-1" : "lg:grid-cols-2"}`}>
        <Card>
          <h3 className="mb-3 border-b border-slate-100 pb-2.5 text-[15px] font-bold text-slate-900">
            {t("salary.daysSummary")}
          </h3>
          <Bar label={t("attendance.present")} n={row.present} cls="bg-emerald-500" />
          <Bar label={t("attendance.absent")} n={row.absent} cls="bg-rose-500" />
          <Bar label={t("salary.weekOff")} n={row.off} cls="bg-amber-500" />
          <Bar label={t("salary.payableDays")} n={row.payable} cls="bg-brand-500" />
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{t("salary.payableNote")}</p>
        </Card>

        <Card>
          <h3 className="mb-3 border-b border-slate-100 pb-2.5 text-[15px] font-bold text-slate-900">
            {t("salary.breakdown")}
          </h3>
          <dl className="text-sm tabular-nums">
            {[
              {
                label: t("salary.grossSalaryDays", { days: DAYS_IN_MONTH }),
                value: formatRupees(row.gross, locale),
                tone: "text-slate-800",
              },
              {
                label: t("salary.earnedDays", { days: row.payable }),
                value: formatRupees(earned, locale),
                tone: "text-slate-800",
              },
              {
                label: t("salary.lessAdvance"),
                value: `− ${formatRupees(row.advance, locale)}`,
                tone: "text-rose-600",
              },
              {
                label: t("salary.lessPenalty"),
                value: `− ${formatRupees(row.penalty, locale)}`,
                tone: "text-rose-600",
              },
            ].map((line) => (
              <div key={line.label} className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5">
                <dt className="min-w-0 text-slate-600">{line.label}</dt>
                <dd className={`shrink-0 font-semibold ${line.tone}`}>{line.value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-t-2 border-slate-200 pt-3">
              <dt className="text-[15px] font-bold text-slate-900">{t("salary.netInHand")}</dt>
              <dd className="text-[17px] font-bold text-brand-700">{formatRupees(row.inHand, locale)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {row.dupId && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-slate-700">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <strong className="text-amber-800">{t("salary.duplicateTitle")}</strong>{" "}
            {t("salary.duplicateBody", { id: row.id })}
          </div>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-slate-400">
        <strong>{t("salary.howComputedTitle")}</strong> {t("salary.howComputedBody", { days: DAYS_IN_MONTH })}
      </p>
    </div>
  );
}

export function SalarySheetDashboard({ canViewAll, employeeName }: Props) {
  const { isMobile } = useAppData();
  const { t } = useLocale();
  const period = `${translateMonth(t, SALARY_MONTH_NUMBER)} ${SALARY_YEAR}`;

  // Rows this user is allowed to see.
  const visibleRows = useMemo(() => {
    if (canViewAll) return SALARY_SHEET;
    if (!employeeName) return [];
    return SALARY_SHEET.filter((r) => r.name.toLowerCase() === employeeName.toLowerCase());
  }, [canViewAll, employeeName]);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = visibleRows[activeIdx];

  if (visibleRows.length === 0) {
    return (
      <section>
        <SectionHeader title={t("salary.title", { month: period })} icon="wallet" />
        <Card className="px-4 py-8 text-center text-sm text-slate-400">
          {t("salary.notAvailable", { month: period })}
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader
        title={t("salary.title", { month: period })}
        subtitle={isMobile ? undefined : t("salary.company")}
        icon="wallet"
      />

      <div className={isMobile ? "" : "flex flex-col gap-4 lg:flex-row"}>
        {/* Roster (privileged roles, desktop only) */}
        {canViewAll && !isMobile && (
          <aside className="hidden w-64 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:flex">
            <div className="flex items-baseline justify-between border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span>{t("salary.staffRoster")}</span>
              <span>{visibleRows.length}</span>
            </div>
            <div className="max-h-[640px] overflow-y-auto p-2">
              {visibleRows.map((r, i) => (
                <button
                  key={`${r.id}-${r.name}`}
                  onClick={() => setActiveIdx(i)}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left ${
                    i === activeIdx ? "border-brand-200 bg-brand-50" : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={r.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-slate-800">{r.name}</div>
                    <div className="truncate text-[11.5px] text-slate-400">{r.role}</div>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[r.status]}`}
                    title={t(STATUS_KEY[r.status] as TranslationKey)}
                  />
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {canViewAll && (
            <Select
              label={isMobile ? t("salary.selectStaff") : undefined}
              aria-label={t("salary.selectStaff")}
              value={activeIdx}
              onChange={(e) => setActiveIdx(Number(e.target.value))}
              wrapperClassName={`mb-3.5 ${isMobile ? "" : "lg:hidden"}`}
            >
              {visibleRows.map((r, i) => (
                <option key={`${r.id}-${r.name}`} value={i}>
                  {r.name} — {r.role}
                </option>
              ))}
            </Select>
          )}

          {active && <EmployeeDetail row={active} />}
        </div>
      </div>
    </section>
  );
}
