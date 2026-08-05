"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { formatRupees, formatTime, greetingKey } from "@/shared/helper/format";
import { translateRole } from "@/shared/i18n";
import { Button } from "@/shared/lib/components/Button";
import { Icon } from "@/shared/lib/components/Icon";
import {
  Card,
  EmptyState,
  KeyValueGrid,
  ListCard,
  MetricTile,
  SectionHeader,
  TableCard,
} from "@/shared/lib/components/Surface";
import type { AppSurface } from "@/shared/types/app";
import type { AttendanceRecord, Employee, LeaveBalance, LeaveRequest, Payslip } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { DailyTasksPanel } from "./DailyTasksPanel";

export function DashboardView({ surface }: { surface: AppSurface }) {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const role = user?.role;
  const queryClient = useQueryClient();
  const isMobile = surface === "mweb";

  const myAttendance = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => (await api.get<AttendanceRecord[]>("/attendance/me")).data,
    enabled: !!user?.employee,
  });

  const myBalances = useQuery({
    queryKey: ["leave", "balances", "me"],
    queryFn: async () => (await api.get<LeaveBalance[]>("/leave/balances/me")).data,
    enabled: !!user?.employee,
  });

  const myRequests = useQuery({
    queryKey: ["leave", "requests", "me"],
    queryFn: async () => (await api.get<LeaveRequest[]>("/leave/requests/me")).data,
    enabled: !!user?.employee,
  });

  const myPayslips = useQuery({
    queryKey: ["payroll", "payslips", "me"],
    queryFn: async () => (await api.get<Payslip[]>("/payroll/payslips/me")).data,
    enabled: !!user?.employee,
  });

  const punchIn = useMutation({
    mutationFn: async () => (await api.post("/attendance/punch-in")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  const punchOut = useMutation({
    mutationFn: async () => (await api.post("/attendance/punch-out")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  const pendingApprovals = useQuery({
    queryKey: ["leave", "requests", "pending"],
    queryFn: async () => (await api.get<LeaveRequest[]>("/leave/requests", { params: { status: "pending" } })).data,
    enabled: role === "manager" || role === "admin",
  });

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get<Employee[]>("/employees")).data,
    enabled: role === "manager" || role === "admin",
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = myAttendance.data?.find((r) => r.date === today);
  const totalUsed = (myBalances.data || []).reduce((sum, b) => sum + b.used, 0);
  const totalAllocated = (myBalances.data || []).reduce((sum, b) => sum + b.allocated, 0);
  const latestPayslip = myPayslips.data?.[0];

  const todayStatus = todayRecord?.checkOut
    ? t("dashboard.checkedOut")
    : todayRecord?.checkIn
      ? t("dashboard.checkedIn")
      : t("dashboard.notPunched");

  const punchSummary = todayRecord ? (
    <span className="tabular-nums">
      {todayRecord.checkIn && t("dashboard.inAt", { time: formatTime(todayRecord.checkIn, locale) })}
      {todayRecord.checkOut && ` · ${t("dashboard.outAt", { time: formatTime(todayRecord.checkOut, locale) })}`}
    </span>
  ) : null;

  return (
    <div className={isMobile ? "space-y-5" : "space-y-6"}>
      <div>
        <p className="text-[13px] font-medium text-slate-500">{t(greetingKey())}</p>
        <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold tracking-tight text-slate-900`}>
          {t("dashboard.welcome", { name: user?.name?.split(" ")[0] ?? "" })}
        </h1>
        {role && (
          <p className="mt-0.5 text-sm text-slate-500">
            {t("dashboard.roleView", { role: translateRole(t, role) })}
          </p>
        )}
      </div>

      {/* Punch card sits first on mobile: it is the one thing people open the app to do. */}
      {user?.employee && (
        <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white shadow-brand-600/25">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-brand-100">
                {t("dashboard.todayStatus")}
              </p>
              <p className="mt-1 text-2xl font-bold leading-tight">{todayStatus}</p>
              {punchSummary && <p className="mt-1 text-[12.5px] text-brand-100">{punchSummary}</p>}
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Icon name="clock" size={22} />
            </span>
          </div>

          {/* Full-width pair on a phone; on desktop the row shouldn't stretch across the whole card. */}
          <div className={`mt-4 flex gap-2.5 ${isMobile ? "" : "max-w-md"}`}>
            <Button
              onClick={() => punchIn.mutate()}
              disabled={!!todayRecord?.checkIn || punchIn.isPending}
              icon="check"
              block
              className="!bg-white !text-brand-700 shadow-none hover:!bg-brand-50"
            >
              {t("dashboard.punchIn")}
            </Button>
            <Button
              onClick={() => punchOut.mutate()}
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || punchOut.isPending}
              icon="logout"
              variant="onBrand"
              block
            >
              {t("dashboard.punchOut")}
            </Button>
          </div>

          {(punchIn.isError || punchOut.isError) && (
            <p className="mt-3 rounded-xl bg-rose-950/25 px-3 py-2 text-[13px] text-rose-50">
              {t("common.errorRetry")}
            </p>
          )}
        </Card>
      )}

      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {user?.employee && (
          <>
            <MetricTile
              label={t("dashboard.leaveBalance")}
              value={t("common.daysCount", { count: Math.max(totalAllocated - totalUsed, 0) })}
              hint={t("dashboard.leaveBalanceHint", { used: totalUsed, total: totalAllocated })}
              icon="palm"
            />
            <MetricTile
              label={t("dashboard.latestPayslip")}
              value={latestPayslip ? formatRupees(latestPayslip.netPay, locale) : t("common.empty")}
              hint={latestPayslip ? t("dashboard.netPay") : t("dashboard.noPayslipYet")}
              icon="wallet"
            />
          </>
        )}
        {(role === "manager" || role === "admin") && (
          <MetricTile
            label={t("dashboard.pendingApprovals")}
            value={String(pendingApprovals.data?.length ?? 0)}
            hint={t("dashboard.leaveRequests")}
            icon="clipboard"
          />
        )}
        {role === "admin" && (
          <MetricTile
            label={t("dashboard.activeEmployees")}
            value={String(employees.data?.filter((e) => e.status === "active").length ?? 0)}
            icon="users"
          />
        )}
      </div>

      {user && <DailyTasksPanel role={role} employee={user.employee} employees={employees.data || []} />}

      {user?.employee && (
        <section>
          <SectionHeader title={t("dashboard.leaveReport")} icon="palm" />

          {myBalances.data && myBalances.data.length > 0 && (
            <div
              className={`mb-3 ${
                isMobile ? "snap-rail no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1" : "flex flex-wrap gap-2.5"
              }`}
            >
              {myBalances.data.map((b) => (
                <div
                  key={b._id}
                  className={`rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-sm ${
                    isMobile ? "min-w-[10.5rem] shrink-0" : ""
                  }`}
                >
                  <p className="truncate text-[13px] font-semibold text-slate-800">{b.leaveType.name}</p>
                  <p className="mt-0.5 text-[12px] tabular-nums text-slate-500">
                    {t("leave.daysLeft", { left: Math.max(b.allocated - b.used, 0), total: b.allocated })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isMobile ? (
            <div className="space-y-2.5">
              {myRequests.data?.slice(0, 10).map((r) => (
                <ListCard
                  key={r._id}
                  title={r.leaveType?.name}
                  subtitle={
                    <span className="tabular-nums">
                      {r.startDate} → {r.endDate}
                    </span>
                  }
                  right={<StatusBadge status={r.status} />}
                >
                  <KeyValueGrid
                    columns={1}
                    items={[{ label: t("common.days"), value: <span className="tabular-nums">{r.days}</span> }]}
                  />
                </ListCard>
              ))}
              {myRequests.data?.length === 0 && <EmptyState message={t("dashboard.noLeaveRequests")} icon="palm" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.type")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.dates")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.days")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.data?.slice(0, 10).map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{r.leaveType?.name}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {r.startDate} → {r.endDate}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{r.days}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {myRequests.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        {t("dashboard.noLeaveRequests")}
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
