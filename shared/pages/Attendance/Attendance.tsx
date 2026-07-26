"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { AttendanceRecord } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

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
    <div className="space-y-8">
      {user?.employee && (
        <section>
          <h1 className="text-xl font-semibold text-slate-800">Attendance</h1>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Month</th>
                  <th className="px-4 py-2">Present</th>
                  <th className="px-4 py-2">Absent</th>
                  <th className="px-4 py-2">Leave taken</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((m) => (
                  <tr key={m.monthKey} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-700">{monthLabel(m.monthKey)}</td>
                    <td className="px-4 py-2">{m.present}</td>
                    <td className="px-4 py-2">{m.absent}</td>
                    <td className="px-4 py-2">{m.leave}</td>
                  </tr>
                ))}
                {monthlyStats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => punchIn.mutate()}
              disabled={!!todayRecord?.checkIn || punchIn.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Punch in
            </button>
            <button
              onClick={() => punchOut.mutate()}
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || punchOut.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Punch out
            </button>
            {todayRecord && (
              <span className="text-sm text-slate-500">
                {todayRecord.checkIn && `In: ${new Date(todayRecord.checkIn).toLocaleTimeString()}`}
                {todayRecord.checkOut && ` · Out: ${new Date(todayRecord.checkOut).toLocaleTimeString()}`}
              </span>
            )}
          </div>
          {(punchIn.isError || punchOut.isError) && (
            <p className="mt-2 text-sm text-rose-600">Something went wrong. Please try again.</p>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Check in</th>
                  <th className="px-4 py-2">Check out</th>
                  <th className="px-4 py-2">Hours</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.data?.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-2">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-2">{r.hoursWorked ?? "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
                {myAttendance.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canSeeTeam && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800">Team attendance</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {teamAttendance.data?.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{typeof r.employee === "object" ? r.employee.name : r.employee}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2">{r.hoursWorked ?? "—"}</td>
                  </tr>
                ))}
                {teamAttendance.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No records yet.
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
