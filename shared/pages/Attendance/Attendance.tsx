"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatMonthKey, formatTime } from "@/shared/helper/format";
import { Button } from "@/shared/lib/components/Button";
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
import type { AttendanceRecord } from "@/shared/types/hrms";

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

export default function Attendance() {
  const { user } = useAuth();
  const { isMobile } = useAppData();
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const canSeeTeam = user?.role === "manager" || user?.role === "admin";

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
          <SectionHeader title={t("attendance.teamTitle")} icon="users" />

          {isMobile ? (
            <div className="space-y-2.5">
              {teamAttendance.data?.map((r) => (
                <ListCard
                  key={r._id}
                  title={typeof r.employee === "object" ? r.employee.name : r.employee}
                  subtitle={<span className="tabular-nums">{r.date}</span>}
                  right={<StatusBadge status={r.status} />}
                >
                  <KeyValueGrid
                    columns={1}
                    items={[
                      {
                        label: t("common.hours"),
                        value: <span className="tabular-nums">{r.hoursWorked ?? t("common.empty")}</span>,
                      },
                    ]}
                  />
                </ListCard>
              ))}
              {teamAttendance.data?.length === 0 && <EmptyState message={t("attendance.noTeamRecords")} icon="users" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.employee")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.date")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.hours")}</th>
                  </tr>
                </thead>
                <tbody>
                  {teamAttendance.data?.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{typeof r.employee === "object" ? r.employee.name : r.employee}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.date}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{r.hoursWorked ?? t("common.empty")}</td>
                    </tr>
                  ))}
                  {teamAttendance.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        {t("attendance.noTeamRecords")}
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
