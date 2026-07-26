"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { AppSurface } from "@/shared/types/app";
import type { AttendanceRecord, Employee, LeaveBalance, LeaveRequest, Payslip } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { StatCard as Card } from "@/shared/components/StatCard";
import { DailyTasksPanel } from "./DailyTasksPanel";

export function DashboardView({ surface }: { surface: AppSurface }) {
  const { user } = useAuth();
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
    enabled: role === "admin",
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = myAttendance.data?.find((r) => r.date === today);
  const totalUsed = (myBalances.data || []).reduce((sum, b) => sum + b.used, 0);
  const totalAllocated = (myBalances.data || []).reduce((sum, b) => sum + b.allocated, 0);
  const latestPayslip = myPayslips.data?.[0];

  return (
    <div className={isMobile ? "space-y-4" : "space-y-6"}>
      <div>
        <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-slate-800`}>
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500 capitalize">{role?.replace("_", " ")} view</p>
      </div>

      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {user?.employee && (
          <>
            <Card
              title="Today"
              value={todayRecord?.checkOut ? "Checked out" : todayRecord?.checkIn ? "Checked in" : "Not punched"}
              hint={todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : undefined}
            />
            <Card
              title="Leave balance"
              value={`${Math.max(totalAllocated - totalUsed, 0)} days`}
              hint={`${totalUsed} used of ${totalAllocated}`}
            />
            <Card
              title="Latest payslip"
              value={latestPayslip ? `₹${latestPayslip.netPay.toLocaleString()}` : "—"}
              hint={latestPayslip ? "Net pay" : "No payslip yet"}
            />
          </>
        )}
        {(role === "manager" || role === "admin") && (
          <Card title="Pending approvals" value={String(pendingApprovals.data?.length ?? 0)} hint="Leave requests" />
        )}
        {role === "admin" && (
          <Card title="Active employees" value={String(employees.data?.filter((e) => e.status === "active").length ?? 0)} />
        )}
      </div>

      {user?.employee && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Mark attendance</h2>
              {todayRecord && (
                <p className="mt-1 text-sm text-slate-500">
                  {todayRecord.checkIn && `In: ${new Date(todayRecord.checkIn).toLocaleTimeString()}`}
                  {todayRecord.checkOut && ` · Out: ${new Date(todayRecord.checkOut).toLocaleTimeString()}`}
                </p>
              )}
            </div>
            <div className={`flex gap-3 ${isMobile ? "w-full" : ""}`}>
              <button
                onClick={() => punchIn.mutate()}
                disabled={!!todayRecord?.checkIn || punchIn.isPending}
                className="min-w-0 flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Punch in
              </button>
              <button
                onClick={() => punchOut.mutate()}
                disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || punchOut.isPending}
                className="min-w-0 flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Punch out
              </button>
            </div>
          </div>
          {(punchIn.isError || punchOut.isError) && (
            <p className="mt-2 text-sm text-rose-600">Something went wrong. Please try again.</p>
          )}
        </section>
      )}

      {user && <DailyTasksPanel role={role} employee={user.employee} employees={employees.data || []} />}

      {user?.employee && (
        <section>
          <h2 className="text-base font-semibold text-slate-800">Leave report</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {myBalances.data?.map((b) => (
              <div key={b._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{b.leaveType.name}</span>{" "}
                <span className="text-slate-500">
                  {Math.max(b.allocated - b.used, 0)} of {b.allocated} days left
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Dates</th>
                  <th className="px-4 py-2">Days</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.data?.slice(0, 10).map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{r.leaveType?.name}</td>
                    <td className="px-4 py-2">
                      {r.startDate} → {r.endDate}
                    </td>
                    <td className="px-4 py-2">{r.days}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
                {myRequests.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No leave requests yet.
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
