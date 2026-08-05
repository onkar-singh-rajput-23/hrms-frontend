"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatRupees } from "@/shared/helper/format";
import { monthOptions, translateMonth } from "@/shared/i18n";
import { Button } from "@/shared/lib/components/Button";
import { FormError, FormSuccess, Input, Select } from "@/shared/lib/components/Field";
import {
  Card,
  EmptyState,
  KeyValueGrid,
  ListCard,
  PageHeader,
  SectionHeader,
  TableCard,
} from "@/shared/lib/components/Surface";
import type { Payslip, PayrollRun } from "@/shared/types/hrms";
import { SalarySheetDashboard } from "./components/SalarySheetDashboard";

export default function Payroll() {
  const { user } = useAuth();
  const { isMobile } = useAppData();
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const isPayrollAdmin = user?.role === "admin";
  const canViewTeam = user?.role === "manager" || user?.role === "admin";
  const canViewRuns = isPayrollAdmin;
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

  const teamPayslips = useQuery({
    queryKey: ["payroll", "payslips", "team"],
    queryFn: async () => (await api.get<Payslip[]>("/payroll/payslips/team")).data,
    enabled: canViewTeam,
  });

  const runPayroll = useMutation({
    mutationFn: async () => (await api.post("/payroll/run", { month, year })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] }),
  });

  const selectedRunLabel = (() => {
    const run = runs.data?.find((r) => r._id === selectedRun);
    return run ? `${translateMonth(t, run.month)} ${run.year}` : "";
  })();

  function employeeName(payslip: Payslip): string {
    return typeof payslip.employee === "object" ? payslip.employee.name : payslip.employee;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("payroll.title")} subtitle={t("payroll.subtitle")} />

      {user?.employee && <SalarySheetDashboard canViewAll={false} employeeName={user.employee.name} />}

      {canViewTeam && (
        <section>
          <SectionHeader title={t("payroll.teamPayslips")} icon="users" />
          {isMobile ? (
            <div className="space-y-2.5">
              {teamPayslips.data?.map((p) => {
                const run = typeof p.payrollRun === "object" ? p.payrollRun : null;
                return (
                  <ListCard
                    key={p._id}
                    title={employeeName(p)}
                    subtitle={run ? `${translateMonth(t, run.month)} ${run.year}` : t("common.empty")}
                    right={<span className="font-bold text-brand-700">{formatRupees(p.netPay, locale)}</span>}
                  >
                    <KeyValueGrid
                      columns={2}
                      items={[
                        { label: t("payroll.gross"), value: formatRupees(p.grossPay, locale) },
                        { label: t("payroll.deductions"), value: formatRupees(p.deductions, locale) },
                      ]}
                    />
                  </ListCard>
                );
              })}
              {teamPayslips.data?.length === 0 && <EmptyState message={t("payroll.noTeamPayslips")} icon="wallet" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.employee")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.period")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.gross")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.deductions")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.netPay")}</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPayslips.data?.map((p) => {
                    const run = typeof p.payrollRun === "object" ? p.payrollRun : null;
                    return (
                      <tr key={p._id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5">{employeeName(p)}</td>
                        <td className="px-4 py-2.5">{run ? `${translateMonth(t, run.month)} ${run.year}` : t("common.empty")}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.grossPay, locale)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.deductions, locale)}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{formatRupees(p.netPay, locale)}</td>
                      </tr>
                    );
                  })}
                  {teamPayslips.data?.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">{t("payroll.noTeamPayslips")}</td></tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          )}
        </section>
      )}

      {isPayrollAdmin && (
        <section>
          <SectionHeader title={t("payroll.run")} icon="wallet" />
          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={t("common.month")}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthOptions(t).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                label={t("common.year")}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <Button
              onClick={() => runPayroll.mutate()}
              disabled={runPayroll.isPending}
              icon="spark"
              block={isMobile}
              className="mt-3"
            >
              {runPayroll.isPending ? t("payroll.running") : t("payroll.run")}
            </Button>
            {runPayroll.isError && (
              <div className="mt-3">
                <FormError
                  message={(runPayroll.error as any)?.response?.data?.message || t("payroll.runError")}
                />
              </div>
            )}
            {runPayroll.isSuccess && (
              <div className="mt-3">
                <FormSuccess message={t("payroll.runSuccess")} />
              </div>
            )}
          </Card>
        </section>
      )}

      {canViewRuns && (
        <section>
          <SectionHeader title={t("payroll.runs")} icon="calendar" />

          {isMobile ? (
            <div className="space-y-2.5">
              {runs.data?.map((r) => (
                <ListCard
                  key={r._id}
                  title={`${translateMonth(t, r.month)} ${r.year}`}
                  right={<StatusBadge status={r.status} />}
                >
                  <Button
                    onClick={() => setSelectedRun(selectedRun === r._id ? null : r._id)}
                    variant="secondary"
                    size="sm"
                    iconAfter={selectedRun === r._id ? "chevronDown" : "chevronRight"}
                    block
                  >
                    {selectedRun === r._id ? t("payroll.hidePayslips") : t("payroll.viewPayslips")}
                  </Button>
                </ListCard>
              ))}
              {runs.data?.length === 0 && <EmptyState message={t("payroll.noRuns")} icon="wallet" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.period")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {runs.data?.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">
                        {translateMonth(t, r.month)} {r.year}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <Button
                          onClick={() => setSelectedRun(selectedRun === r._id ? null : r._id)}
                          variant="secondary"
                          size="sm"
                        >
                          {selectedRun === r._id ? t("payroll.hidePayslips") : t("payroll.viewPayslips")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {runs.data?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                        {t("payroll.noRuns")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          )}

          {selectedRun && (
            <div className="mt-4">
              <SectionHeader title={t("payroll.payslipsFor", { period: selectedRunLabel })} />
              {isMobile ? (
                <div className="space-y-2.5">
                  {runPayslips.data?.map((p) => (
                    <ListCard
                      key={p._id}
                      title={employeeName(p)}
                      right={
                        <span className="text-[15px] font-bold tabular-nums text-brand-700">
                          {formatRupees(p.netPay, locale)}
                        </span>
                      }
                    >
                      <KeyValueGrid
                        columns={2}
                        items={[
                          { label: t("payroll.basic"), value: formatRupees(p.basicSalary, locale) },
                          { label: t("payroll.lopDays"), value: <span className="tabular-nums">{p.lopDays}</span> },
                          { label: t("payroll.gross"), value: formatRupees(p.grossPay, locale) },
                          { label: t("payroll.deductions"), value: formatRupees(p.deductions, locale) },
                        ]}
                      />
                    </ListCard>
                  ))}
                  {runPayslips.data?.length === 0 && <EmptyState message={t("payroll.noPayslips")} icon="wallet" />}
                </div>
              ) : (
                <TableCard>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">{t("common.employee")}</th>
                        <th className="px-4 py-2.5 font-semibold">{t("payroll.basic")}</th>
                        <th className="px-4 py-2.5 font-semibold">{t("payroll.lopDays")}</th>
                        <th className="px-4 py-2.5 font-semibold">{t("payroll.gross")}</th>
                        <th className="px-4 py-2.5 font-semibold">{t("payroll.deductions")}</th>
                        <th className="px-4 py-2.5 font-semibold">{t("payroll.netPay")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runPayslips.data?.map((p) => (
                        <tr key={p._id} className="border-t border-slate-100">
                          <td className="px-4 py-2.5">{employeeName(p)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.basicSalary, locale)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{p.lopDays}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.grossPay, locale)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.deductions, locale)}</td>
                          <td className="px-4 py-2.5 font-semibold tabular-nums">{formatRupees(p.netPay, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
              )}
            </div>
          )}
        </section>
      )}

      {user?.employee && (
        <section>
          <SectionHeader title={t("payroll.myPayslips")} icon="wallet" />

          {isMobile ? (
            <div className="space-y-2.5">
              {myPayslips.data?.map((p) => {
                const run = typeof p.payrollRun === "object" ? p.payrollRun : null;
                return (
                  <ListCard
                    key={p._id}
                    title={run ? `${translateMonth(t, run.month)} ${run.year}` : t("common.empty")}
                    right={
                      <span className="text-[15px] font-bold tabular-nums text-brand-700">
                        {formatRupees(p.netPay, locale)}
                      </span>
                    }
                  >
                    <KeyValueGrid
                      columns={2}
                      items={[
                        { label: t("payroll.gross"), value: formatRupees(p.grossPay, locale) },
                        { label: t("payroll.deductions"), value: formatRupees(p.deductions, locale) },
                      ]}
                    />
                  </ListCard>
                );
              })}
              {myPayslips.data?.length === 0 && <EmptyState message={t("payroll.noPayslips")} icon="wallet" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.period")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.gross")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.deductions")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("payroll.netPay")}</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayslips.data?.map((p) => {
                    const run = typeof p.payrollRun === "object" ? p.payrollRun : null;
                    return (
                      <tr key={p._id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5">
                          {run ? `${translateMonth(t, run.month)} ${run.year}` : t("common.empty")}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.grossPay, locale)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatRupees(p.deductions, locale)}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{formatRupees(p.netPay, locale)}</td>
                      </tr>
                    );
                  })}
                  {myPayslips.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        {t("payroll.noPayslips")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          )}
        </section>
      )}
    </div>
  );
}
