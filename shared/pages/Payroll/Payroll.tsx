"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { Payslip, PayrollRun } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { SalarySheetDashboard } from "./components/SalarySheetDashboard";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Payroll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPayrollAdmin = user?.role === "admin";
  const canViewRuns = isPayrollAdmin;
  // Admin / HR / Payroll see the whole salary sheet; everyone else sees only their own row.
  const canViewAllStaff = isPayrollAdmin;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const runs = useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: async () => (await api.get<PayrollRun[]>("/payroll/runs")).data,
    enabled: canViewRuns,
  });

  const runPayslips = useQuery({
    queryKey: ["payroll", "runs", selectedRun, "payslips"],
    queryFn: async () => (await api.get<Payslip[]>(`/payroll/runs/${selectedRun}/payslips`)).data,
    enabled: !!selectedRun,
  });

  const myPayslips = useQuery({
    queryKey: ["payroll", "payslips", "me"],
    queryFn: async () => (await api.get<Payslip[]>("/payroll/payslips/me")).data,
    enabled: !!user?.employee,
  });

  const runPayroll = useMutation({
    mutationFn: async () => (await api.post("/payroll/run", { month, year })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] }),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-800">Payroll</h1>

      <SalarySheetDashboard canViewAll={canViewAllStaff} employeeName={user?.employee?.name} />

      {isPayrollAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">Run payroll</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => runPayroll.mutate()}
              disabled={runPayroll.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {runPayroll.isPending ? "Running…" : "Run payroll"}
            </button>
          </div>
          {runPayroll.isError && (
            <p className="mt-2 text-sm text-rose-600">
              {(runPayroll.error as any)?.response?.data?.message || "Could not run payroll for this period."}
            </p>
          )}
          {runPayroll.isSuccess && <p className="mt-2 text-sm text-emerald-600">Payroll run completed and payslips generated.</p>}
        </section>
      )}

      {canViewRuns && (
        <section>
          <h2 className="text-base font-semibold text-slate-800">Payroll runs</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {runs.data?.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      {MONTH_NAMES[r.month - 1]} {r.year}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setSelectedRun(r._id)}
                        className="text-sm font-medium text-slate-700 underline"
                      >
                        View payslips
                      </button>
                    </td>
                  </tr>
                ))}
                {runs.data?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      No payroll runs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedRun && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Employee</th>
                    <th className="px-4 py-2">Basic</th>
                    <th className="px-4 py-2">LOP days</th>
                    <th className="px-4 py-2">Gross</th>
                    <th className="px-4 py-2">Deductions</th>
                    <th className="px-4 py-2">Net pay</th>
                  </tr>
                </thead>
                <tbody>
                  {runPayslips.data?.map((p) => (
                    <tr key={p._id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{typeof p.employee === "object" ? p.employee.name : p.employee}</td>
                      <td className="px-4 py-2">₹{p.basicSalary.toLocaleString()}</td>
                      <td className="px-4 py-2">{p.lopDays}</td>
                      <td className="px-4 py-2">₹{p.grossPay.toLocaleString()}</td>
                      <td className="px-4 py-2">₹{p.deductions.toLocaleString()}</td>
                      <td className="px-4 py-2 font-medium">₹{p.netPay.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {user?.employee && (
        <section>
          <h2 className="text-base font-semibold text-slate-800">My payslips</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Gross</th>
                  <th className="px-4 py-2">Deductions</th>
                  <th className="px-4 py-2">Net pay</th>
                </tr>
              </thead>
              <tbody>
                {myPayslips.data?.map((p) => {
                  const run = typeof p.payrollRun === "object" ? p.payrollRun : null;
                  return (
                    <tr key={p._id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{run ? `${MONTH_NAMES[run.month - 1]} ${run.year}` : "—"}</td>
                      <td className="px-4 py-2">₹{p.grossPay.toLocaleString()}</td>
                      <td className="px-4 py-2">₹{p.deductions.toLocaleString()}</td>
                      <td className="px-4 py-2 font-medium">₹{p.netPay.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {myPayslips.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No payslips yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
