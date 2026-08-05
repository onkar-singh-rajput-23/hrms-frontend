"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatMonthKey, formatTime } from "@/shared/helper/format";
import type { TranslateFn } from "@/shared/i18n";
import { Button } from "@/shared/lib/components/Button";
import { Input } from "@/shared/lib/components/Field";
import { Icon } from "@/shared/lib/components/Icon";
import {
  Card,
  EmptyState,
  KeyValueGrid,
  ListCard,
  PageHeader,
  SectionHeader,
  TableCard,
} from "@/shared/lib/components/Surface";
import type { AttendanceRecord, Employee } from "@/shared/types/hrms";
import type { Locale } from "@/shared/types/i18n";

interface MonthlyStat {
  monthKey: string;
  present: number;
  absent: number;
  leave: number;
}

function summarizeByMonth(records: AttendanceRecord[] | undefined): MonthlyStat[] {
  const byMonth = new Map<string, MonthlyStat>();
  for (const r of records ?? []) {
    const monthKey = r.date.slice(0, 7); // "YYYY-MM"
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, { monthKey, present: 0, absent: 0, leave: 0 });
    }
    const bucket = byMonth.get(monthKey)!;
    if (r.status === "present" || r.status === "half_day") bucket.present++;
    else if (r.status === "absent") bucket.absent++;
    else if (r.status === "on_leave") bucket.leave++;
  }
  return Array.from(byMonth.values()).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

function employeeIdFor(record: AttendanceRecord): string {
  return typeof record.employee === "object" ? record.employee._id : record.employee;
}

function monthStat(records: AttendanceRecord[], monthKey: string): MonthlyStat {
  return summarizeByMonth(records.filter((record) => record.date.startsWith(monthKey)))[0] ?? {
    monthKey,
    present: 0,
    absent: 0,
    leave: 0,
  };
}

export default function Attendance() {
  const { user } = useAuth();
  const { isMobile } = useAppData();
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const canSeeTeam = user?.role === "manager" || user?.role === "admin";
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedTeamMonth, setSelectedTeamMonth] = useState("");

  const myAttendance = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => (await api.get<AttendanceRecord[]>("/attendance/me")).data,
    enabled: !!user?.employee,
  });

  const teamAttendance = useQuery({
    queryKey: ["attendance", "team"],
    queryFn: async () => (await api.get<AttendanceRecord[]>("/attendance/team")).data,
    enabled: canSeeTeam,
  });

  const teamEmployees = useQuery({
    queryKey: ["employees", "attendance-team"],
    queryFn: async () => (await api.get<Employee[]>("/employees")).data,
    enabled: canSeeTeam,
  });

  const selectedEmployeeAttendance = useQuery({
    queryKey: ["attendance", "employee", selectedEmployeeId],
    queryFn: async () =>
      (await api.get<AttendanceRecord[]>(`/attendance/employee/${selectedEmployeeId}`)).data,
    enabled: canSeeTeam && !!selectedEmployeeId,
  });

  const latestTeamMonth = useMemo(
    () =>
      (teamAttendance.data ?? [])
        .map((record) => record.date.slice(0, 7))
        .sort((a, b) => (a < b ? 1 : -1))[0] ?? new Date().toISOString().slice(0, 7),
    [teamAttendance.data]
  );

  useEffect(() => {
    if (!selectedTeamMonth && teamAttendance.data) setSelectedTeamMonth(latestTeamMonth);
  }, [latestTeamMonth, selectedTeamMonth, teamAttendance.data]);

  useEffect(() => {
    if (!isMobile && !selectedEmployeeId && teamEmployees.data?.length) {
      setSelectedEmployeeId(teamEmployees.data[0]._id);
    }
  }, [isMobile, selectedEmployeeId, teamEmployees.data]);

  const punchIn = useMutation({
    mutationFn: async () => (await api.post("/attendance/punch-in")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  const punchOut = useMutation({
    mutationFn: async () => (await api.post("/attendance/punch-out")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = myAttendance.data?.find((r) => r.date === today);
  const monthlyStats = summarizeByMonth(myAttendance.data);

  return (
    <div className="space-y-6">
      <PageHeader title={t("attendance.title")} subtitle={t("attendance.subtitle")} />

      {user?.employee && (
        <>
          {/* Punch controls stay at the top so they're reachable without scrolling. */}
          <Card>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="clock" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-slate-900">{t("common.today")}</p>
                <p className="mt-0.5 truncate text-[13px] tabular-nums text-slate-500">
                  {todayRecord?.checkIn
                    ? [
                        t("dashboard.inAt", { time: formatTime(todayRecord.checkIn, locale) }),
                        todayRecord.checkOut && t("dashboard.outAt", { time: formatTime(todayRecord.checkOut, locale) }),
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : t("dashboard.notPunched")}
                </p>
              </div>
            </div>

            <div className={`mt-3.5 flex gap-2.5 ${isMobile ? "" : "max-w-md"}`}>
              <Button
                onClick={() => punchIn.mutate()}
                disabled={!!todayRecord?.checkIn || punchIn.isPending}
                variant="success"
                icon="check"
                block
              >
                {t("dashboard.punchIn")}
              </Button>
              <Button
                onClick={() => punchOut.mutate()}
                disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || punchOut.isPending}
                icon="logout"
                block
              >
                {t("dashboard.punchOut")}
              </Button>
            </div>

            {(punchIn.isError || punchOut.isError) && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{t("common.errorRetry")}</p>
            )}
          </Card>

          <section>
            <SectionHeader title={t("attendance.monthlySummary")} icon="trendUp" />

            {isMobile ? (
              <div className="space-y-2.5">
                {monthlyStats.map((m) => (
                  <ListCard key={m.monthKey} title={formatMonthKey(m.monthKey, t)}>
                    <KeyValueGrid
                      columns={3}
                      items={[
                        {
                          label: t("attendance.present"),
                          value: <span className="tabular-nums text-emerald-600">{m.present}</span>,
                        },
                        {
                          label: t("attendance.absent"),
                          value: <span className="tabular-nums text-rose-600">{m.absent}</span>,
                        },
                        {
                          label: t("attendance.leaveTaken"),
                          value: <span className="tabular-nums text-amber-600">{m.leave}</span>,
                        },
                      ]}
                    />
                  </ListCard>
                ))}
                {monthlyStats.length === 0 && <EmptyState message={t("attendance.noRecords")} icon="clock" />}
              </div>
            ) : (
              <TableCard>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">{t("common.month")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("attendance.present")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("attendance.absent")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("attendance.leaveTaken")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map((m) => (
                      <tr key={m.monthKey} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{formatMonthKey(m.monthKey, t)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{m.present}</td>
                        <td className="px-4 py-2.5 tabular-nums">{m.absent}</td>
                        <td className="px-4 py-2.5 tabular-nums">{m.leave}</td>
                      </tr>
                    ))}
                    {monthlyStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          {t("attendance.noRecords")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            )}
          </section>

          <section>
            <SectionHeader title={t("attendance.history")} icon="calendar" />

            {isMobile ? (
              <div className="space-y-2.5">
                {myAttendance.data?.map((r) => (
                  <ListCard
                    key={r._id}
                    title={<span className="tabular-nums">{r.date}</span>}
                    right={<StatusBadge status={r.status} />}
                  >
                    <KeyValueGrid
                      columns={3}
                      items={[
                        { label: t("attendance.checkIn"), value: formatTime(r.checkIn, locale) },
                        { label: t("attendance.checkOut"), value: formatTime(r.checkOut, locale) },
                        {
                          label: t("common.hours"),
                          value: <span className="tabular-nums">{r.hoursWorked ?? t("common.empty")}</span>,
                        },
                      ]}
                    />
                  </ListCard>
                ))}
                {myAttendance.data?.length === 0 && <EmptyState message={t("attendance.noRecords")} icon="calendar" />}
              </div>
            ) : (
              <TableCard>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">{t("common.date")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("attendance.checkIn")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("attendance.checkOut")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("common.hours")}</th>
                      <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAttendance.data?.map((r) => (
                      <tr key={r._id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 tabular-nums">{r.date}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatTime(r.checkIn, locale)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatTime(r.checkOut, locale)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{r.hoursWorked ?? t("common.empty")}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                    {myAttendance.data?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                          {t("attendance.noRecords")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            )}
          </section>
        </>
      )}

      {canSeeTeam && (
        <section>
          <SectionHeader
            title={t("attendance.teamTitle")}
            subtitle={t("attendance.teamMonthlyReport")}
            icon="users"
            action={
              <Input
                type="month"
                aria-label={t("attendance.selectMonth")}
                value={selectedTeamMonth}
                onChange={(event) => setSelectedTeamMonth(event.target.value)}
                wrapperClassName="w-[9.5rem]"
              />
            }
          />

          {isMobile && selectedEmployeeId ? (
            <div className="space-y-3">
              <Button variant="secondary" size="sm" icon="chevronLeft" onClick={() => setSelectedEmployeeId(null)}>
                {t("attendance.backToTeam")}
              </Button>
              <EmployeeAttendanceDetail
                employee={teamEmployees.data?.find((employee) => employee._id === selectedEmployeeId)}
                records={selectedEmployeeAttendance.data ?? []}
                monthKey={selectedTeamMonth}
                locale={locale}
                t={t}
                loading={selectedEmployeeAttendance.isLoading}
              />
            </div>
          ) : (
            <div className={isMobile ? "space-y-2.5" : "grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]"}>
              <div className="space-y-2.5">
                {teamEmployees.data?.map((employee) => {
                  const records = (teamAttendance.data ?? []).filter(
                    (record) => employeeIdFor(record) === employee._id && record.date.startsWith(selectedTeamMonth)
                  );
                  const summary = monthStat(records, selectedTeamMonth);
                  const selected = employee._id === selectedEmployeeId;
                  return (
                    <button
                      type="button"
                      key={employee._id}
                      onClick={() => setSelectedEmployeeId(employee._id)}
                      className={`tap w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors ${
                        selected
                          ? "border-brand-300 ring-2 ring-brand-100"
                          : "border-slate-200/80 hover:border-brand-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-slate-900">{employee.name}</p>
                          <p className="mt-0.5 text-[12px] text-slate-500">
                            {employee.employeeCode} · {employee.designation || t("common.empty")}
                          </p>
                        </div>
                        <Icon name="chevronRight" size={18} className="mt-1 shrink-0 text-slate-400" />
                      </div>
                      <KeyValueGrid
                        columns={3}
                        items={[
                          {
                            label: t("attendance.present"),
                            value: <span className="tabular-nums text-emerald-600">{summary.present}</span>,
                          },
                          {
                            label: t("attendance.absent"),
                            value: <span className="tabular-nums text-rose-600">{summary.absent}</span>,
                          },
                          {
                            label: t("attendance.leaveTaken"),
                            value: <span className="tabular-nums text-amber-600">{summary.leave}</span>,
                          },
                        ]}
                      />
                    </button>
                  );
                })}
                {teamEmployees.data?.length === 0 && (
                  <EmptyState message={t("attendance.noTeamRecords")} icon="users" />
                )}
              </div>

              {!isMobile && (
                <EmployeeAttendanceDetail
                  employee={teamEmployees.data?.find((employee) => employee._id === selectedEmployeeId)}
                  records={selectedEmployeeAttendance.data ?? []}
                  monthKey={selectedTeamMonth}
                  locale={locale}
                  t={t}
                  loading={selectedEmployeeAttendance.isLoading}
                />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmployeeAttendanceDetail({
  employee,
  records,
  monthKey,
  locale,
  t,
  loading,
}: {
  employee?: Employee;
  records: AttendanceRecord[];
  monthKey: string;
  locale: Locale;
  t: TranslateFn;
  loading: boolean;
}) {
  if (!employee) return <EmptyState message={t("attendance.selectEmployee")} icon="users" />;

  const monthRecords = records.filter((record) => record.date.startsWith(monthKey));
  const summary = monthStat(monthRecords, monthKey);

  return (
    <Card>
      <SectionHeader
        title={t("attendance.employeeHistory", { name: employee.name })}
        subtitle={`${employee.employeeCode} · ${formatMonthKey(monthKey, t)}`}
        icon="calendar"
      />
      <div className="mb-4 rounded-xl bg-slate-50 p-3">
        <KeyValueGrid
          columns={3}
          items={[
            { label: t("attendance.present"), value: <span className="text-emerald-600">{summary.present}</span> },
            { label: t("attendance.absent"), value: <span className="text-rose-600">{summary.absent}</span> },
            { label: t("attendance.leaveTaken"), value: <span className="text-amber-600">{summary.leave}</span> },
          ]}
        />
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">{t("common.loading")}</p>
      ) : monthRecords.length === 0 ? (
        <EmptyState message={t("attendance.noRecordsForMonth")} icon="calendar" />
      ) : (
        <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {monthRecords.map((record) => (
            <div key={record._id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold tabular-nums text-slate-800">{record.date}</p>
                <StatusBadge status={record.status} />
              </div>
              <KeyValueGrid
                columns={3}
                items={[
                  { label: t("attendance.checkIn"), value: formatTime(record.checkIn, locale) },
                  { label: t("attendance.checkOut"), value: formatTime(record.checkOut, locale) },
                  { label: t("common.hours"), value: record.hoursWorked ?? t("common.empty") },
                ]}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
