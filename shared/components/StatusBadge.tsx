"use client";

import { useLocale } from "@/client/AppStore/LocaleContext";
import { translateStatus } from "@/shared/i18n";

const styles: Record<string, string> = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-200",
  absent: "bg-rose-50 text-rose-700 ring-rose-200",
  half_day: "bg-sky-50 text-sky-700 ring-sky-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  cancelled: "bg-slate-50 text-slate-600 ring-slate-200",
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  exited: "bg-slate-50 text-slate-600 ring-slate-200",
  todo: "bg-slate-50 text-slate-600 ring-slate-200",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const cls = styles[status] || "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {translateStatus(t, status)}
    </span>
  );
}
