"use client";

import { useMemo, useState } from "react";
import {
  SALARY_SHEET,
  SALARY_MONTH,
  DAYS_IN_MONTH,
  INR,
  initials,
  avatarColor,
  derive,
  STATUS_PILL,
  STATUS_DOT,
  type SalaryRow,
} from "../salarySheet";

// Georgia serif gives money/day figures the "official ledger" feel from the source sheet.
const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' } as const;

interface Props {
  /** Admins see the whole roster; managers are locked to their own row. */
  canViewAll: boolean;
  /** name of the signed-in employee, used to pick their row when they can't see everyone */
  employeeName?: string;
}

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36, ...SERIF }}
    >
      {initials(name)}
    </div>
  );
}

function Bar({ label, n, cls }: { label: string; n: number; cls: string }) {
  const pct = DAYS_IN_MONTH > 0 ? (n / DAYS_IN_MONTH) * 100 : 0;
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold tabular-nums text-slate-800">
          {n} <span className="font-normal text-slate-400">/ {DAYS_IN_MONTH}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
        <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmployeeDetail({ row }: { row: SalaryRow }) {
  const { perDay, earned, attendancePct } = derive(row);
  return (
    <div className="space-y-4">
      {/* Topbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <Avatar name={row.name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold text-slate-800" style={SERIF}>
            {row.name}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {row.role}
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-500">
              {row.id}
            </span>
          </div>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold ${STATUS_PILL[row.status]}`}>
          {row.status}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-indigo-600 bg-indigo-600 p-4 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Net Salary in Hand</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums" style={SERIF}>
            {INR(row.inHand)}
          </div>
          <div className="mt-1 text-xs text-indigo-100">{row.status}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gross / Month</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800" style={SERIF}>
            {INR(row.gross)}
          </div>
          <div className="mt-1 text-xs tabular-nums text-slate-500">≈ {INR(perDay)} / day</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advance Taken</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800" style={SERIF}>
            {INR(row.advance)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{row.advance > 0 ? "Deducted this cycle" : "None"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800" style={SERIF}>
            {attendancePct}%
          </div>
          <div className="mt-1 text-xs tabular-nums text-slate-500">
            {row.present} present · {row.absent} absent
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3.5 border-b border-slate-200 pb-2.5 text-base font-bold text-slate-800" style={SERIF}>
            Days Summary
          </h3>
          <Bar label="Present" n={row.present} cls="bg-emerald-500" />
          <Bar label="Absent" n={row.absent} cls="bg-rose-500" />
          <Bar label="Week-off" n={row.off} cls="bg-amber-500" />
          <Bar label="Payable Days" n={row.payable} cls="bg-indigo-500" />
          <p className="mt-1.5 text-xs text-slate-400">Payable = present + week-off. Absences are unpaid.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3.5 border-b border-slate-200 pb-2.5 text-base font-bold text-slate-800" style={SERIF}>
            Salary Breakdown
          </h3>
          <table className="w-full text-sm tabular-nums">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-600">Gross salary ({DAYS_IN_MONTH} days)</td>
                <td className="py-2.5 text-right font-semibold text-slate-800">{INR(row.gross)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-600">Earned ({row.payable} payable days)</td>
                <td className="py-2.5 text-right font-semibold text-slate-800">{INR(earned)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-600">Less: Salary advance</td>
                <td className="py-2.5 text-right font-semibold text-rose-600">− {INR(row.advance)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-600">Less: Penalty</td>
                <td className="py-2.5 text-right font-semibold text-rose-600">− {INR(row.penalty)}</td>
              </tr>
              <tr>
                <td className="border-t-2 border-slate-300 pt-3 text-base font-bold text-slate-800" style={SERIF}>
                  Net in hand
                </td>
                <td className="border-t-2 border-slate-300 pt-3 text-right text-base font-bold text-indigo-700" style={SERIF}>
                  {INR(row.inHand)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data-quality banner (only when triggered) */}
      {row.dupId && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[13.5px] text-slate-700">
          <span className="text-lg leading-tight">⚠️</span>
          <div>
            <strong className="text-amber-700">Heads up — duplicate Employee ID.</strong> ID{" "}
            <code className="font-mono">{row.id}</code> is shared by more than one staff member (Sonu &amp; Lalit).
            Assign a unique ID to avoid payroll mix-ups.
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-400">
        <strong>How in-hand is computed:</strong> earned salary (pay for payable days) minus salary advance and any
        penalty. Per-day rate ≈ gross ÷ {DAYS_IN_MONTH}. Blank remarks are shown as “Pending”. Company-level cash-flow
        figures from the source sheet are intentionally excluded from this per-employee view.
      </p>
    </div>
  );
}

export function SalarySheetDashboard({ canViewAll, employeeName }: Props) {
  // Rows this user is allowed to see.
  const visibleRows = useMemo(() => {
    if (canViewAll) return SALARY_SHEET;
    if (!employeeName) return [];
    const mine = SALARY_SHEET.filter((r) => r.name.toLowerCase() === employeeName.toLowerCase());
    return mine;
  }, [canViewAll, employeeName]);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = visibleRows[activeIdx];

  if (visibleRows.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold text-slate-800">Salary sheet · {SALARY_MONTH}</h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
          Your salary sheet for {SALARY_MONTH} isn’t available yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800">Salary sheet · {SALARY_MONTH}</h2>
        <span className="text-xs text-slate-400">Hurry’s Food &amp; Beverages Pvt. Ltd.</span>
      </div>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row">
        {/* Roster (privileged roles, desktop) */}
        {canViewAll && (
          <aside className="hidden w-64 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:flex">
            <div className="flex items-baseline justify-between border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Staff Roster</span>
              <span>{visibleRows.length}</span>
            </div>
            <div className="max-h-[640px] overflow-y-auto p-2">
              {visibleRows.map((r, i) => (
                <button
                  key={`${r.id}-${r.name}`}
                  onClick={() => setActiveIdx(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left ${
                    i === activeIdx
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={r.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-slate-800">{r.name}</div>
                    <div className="truncate text-[11.5px] text-slate-400">{r.role}</div>
                  </div>
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[r.status]}`} title={r.status} />
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {/* Mobile / narrow selector for privileged roles */}
          {canViewAll && (
            <select
              value={activeIdx}
              onChange={(e) => setActiveIdx(Number(e.target.value))}
              className="mb-4 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm lg:hidden"
            >
              {visibleRows.map((r, i) => (
                <option key={`${r.id}-${r.name}`} value={i}>
                  {r.name} — {r.role}
                </option>
              ))}
            </select>
          )}

          {active && <EmployeeDetail row={active} />}
        </div>
      </div>
    </section>
  );
}
