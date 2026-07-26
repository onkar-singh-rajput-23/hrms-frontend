"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAuth } from "@/client/AppStore/AuthContext";
import type { LeaveBalance, LeaveRequest, LeaveType } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";

export default function Leave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canApprove = user?.role === "manager" || user?.role === "admin";

  const leaveTypes = useQuery({
    queryKey: ["leave", "types"],
    queryFn: async () => (await api.get<LeaveType[]>("/leave/types")).data,
  });

  const balances = useQuery({
    queryKey: ["leave", "balances", "me"],
    queryFn: async () => (await api.get<LeaveBalance[]>("/leave/balances/me")).data,
    enabled: !!user?.employee,
  });

  const myRequests = useQuery({
    queryKey: ["leave", "requests", "me"],
    queryFn: async () => (await api.get<LeaveRequest[]>("/leave/requests/me")).data,
    enabled: !!user?.employee,
  });

  const pendingRequests = useQuery({
    queryKey: ["leave", "requests", "pending"],
    queryFn: async () => (await api.get<LeaveRequest[]>("/leave/requests", { params: { status: "pending" } })).data,
    enabled: canApprove,
  });

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const applyLeave = useMutation({
    mutationFn: async () =>
      (await api.post("/leave/requests", { leaveTypeId, startDate, endDate, reason })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: (err: any) => setFormError(err?.response?.data?.message || "Could not submit request"),
  });

  const approve = useMutation({
    mutationFn: async (id: string) => (await api.put(`/leave/requests/${id}/approve`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave"] }),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => (await api.put(`/leave/requests/${id}/reject`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave"] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!leaveTypeId || !startDate || !endDate) {
      setFormError("Please fill in all required fields");
      return;
    }
    applyLeave.mutate();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Leave</h1>
        {user?.employee && (
          <div className="mt-3 flex flex-wrap gap-3">
            {balances.data?.map((b) => (
              <div key={b._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{b.leaveType.name}</span>{" "}
                <span className="text-slate-500">
                  {Math.max(b.allocated - b.used, 0)} of {b.allocated} days left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {user?.employee && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">Apply for leave</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select leave type</option>
              {leaveTypes.data?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formError && <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p>}
            <button
              type="submit"
              disabled={applyLeave.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2 sm:w-40"
            >
              {applyLeave.isPending ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </section>
      )}

      {user?.employee && (
        <section>
          <h2 className="text-base font-semibold text-slate-800">My requests</h2>
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
                {myRequests.data?.map((r) => (
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

      {canApprove && (
        <section>
          <h2 className="text-base font-semibold text-slate-800">Pending approvals</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Dates</th>
                  <th className="px-4 py-2">Days</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.data?.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{typeof r.employee === "object" ? r.employee.name : r.employee}</td>
                    <td className="px-4 py-2">{r.leaveType?.name}</td>
                    <td className="px-4 py-2">
                      {r.startDate} → {r.endDate}
                    </td>
                    <td className="px-4 py-2">{r.days}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => approve.mutate(r._id)}
                        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject.mutate(r._id)}
                        className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRequests.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No pending requests.
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
