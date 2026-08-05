"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/lib/components/Button";
import { FormError, Input, Select } from "@/shared/lib/components/Field";
import {
  Card,
  EmptyState,
  KeyValueGrid,
  ListCard,
  PageHeader,
  SectionHeader,
  TableCard,
} from "@/shared/lib/components/Surface";
import type { LeaveBalance, LeaveRequest, LeaveType } from "@/shared/types/hrms";

export default function Leave() {
  const { user } = useAuth();
  const { isMobile } = useAppData();
  const { t } = useLocale();
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
    onError: (err: any) => setFormError(err?.response?.data?.message || t("leave.couldNotSubmit")),
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
      setFormError(t("leave.fillRequired"));
      return;
    }
    applyLeave.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("leave.title")} subtitle={t("leave.subtitle")} />

      {/* Balances read as a swipeable rail on mobile instead of wrapping onto four lines. */}
      {user?.employee && balances.data && balances.data.length > 0 && (
        <div
          className={
            isMobile
              ? "snap-rail no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1"
              : "flex flex-wrap gap-2.5"
          }
        >
          {balances.data.map((b) => (
            <div
              key={b._id}
              className={`rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm ${
                isMobile ? "min-w-[11rem] shrink-0" : ""
              }`}
            >
              <p className="truncate text-[13px] font-semibold text-slate-800">{b.leaveType.name}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-brand-700">
                {Math.max(b.allocated - b.used, 0)}
                <span className="ml-1 text-[12px] font-medium text-slate-400">/ {b.allocated}</span>
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">{t("common.days")}</p>
            </div>
          ))}
        </div>
      )}

      {user?.employee && (
        <section>
          <SectionHeader title={t("leave.apply")} icon="palm" />
          <Card>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <Select
                label={t("leave.leaveType")}
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
              >
                <option value="">{t("leave.selectType")}</option>
                {leaveTypes.data?.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </Select>
              <Input
                type="text"
                label={t("leave.reason")}
                placeholder={t("leave.reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Input
                type="date"
                label={t("leave.startDate")}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label={t("leave.endDate")}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {formError && (
                <div className="sm:col-span-2">
                  <FormError message={formError} />
                </div>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={applyLeave.isPending} icon="check" block={isMobile}>
                  {applyLeave.isPending ? t("common.submitting") : t("leave.submitRequest")}
                </Button>
              </div>
            </form>
          </Card>
        </section>
      )}

      {user?.employee && (
        <section>
          <SectionHeader title={t("leave.myRequests")} icon="clipboard" />

          {isMobile ? (
            <div className="space-y-2.5">
              {myRequests.data?.map((r) => (
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
                    columns={2}
                    items={[
                      { label: t("common.days"), value: <span className="tabular-nums">{r.days}</span> },
                      { label: t("leave.reason"), value: r.reason || t("common.empty") },
                    ]}
                  />
                </ListCard>
              ))}
              {myRequests.data?.length === 0 && <EmptyState message={t("leave.noRequests")} icon="palm" />}
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
                  {myRequests.data?.map((r) => (
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
                        {t("leave.noRequests")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          )}
        </section>
      )}

      {canApprove && (
        <section>
          <SectionHeader title={t("leave.pendingApprovals")} icon="shield" />

          {isMobile ? (
            <div className="space-y-2.5">
              {pendingRequests.data?.map((r) => (
                <ListCard
                  key={r._id}
                  title={typeof r.employee === "object" ? r.employee.name : r.employee}
                  subtitle={r.leaveType?.name}
                  right={<StatusBadge status={r.status} />}
                >
                  <KeyValueGrid
                    columns={2}
                    items={[
                      {
                        label: t("common.dates"),
                        value: (
                          <span className="tabular-nums">
                            {r.startDate} → {r.endDate}
                          </span>
                        ),
                      },
                      { label: t("common.days"), value: <span className="tabular-nums">{r.days}</span> },
                    ]}
                  />
                  <div className="mt-3 flex gap-2.5">
                    <Button onClick={() => approve.mutate(r._id)} variant="success" icon="check" size="sm" block>
                      {t("leave.approve")}
                    </Button>
                    <Button onClick={() => reject.mutate(r._id)} variant="danger" icon="x" size="sm" block>
                      {t("leave.reject")}
                    </Button>
                  </div>
                </ListCard>
              ))}
              {pendingRequests.data?.length === 0 && <EmptyState message={t("leave.noPending")} icon="check" />}
            </div>
          ) : (
            <TableCard>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("common.employee")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.type")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.dates")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.days")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.data?.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{typeof r.employee === "object" ? r.employee.name : r.employee}</td>
                      <td className="px-4 py-2.5">{r.leaveType?.name}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {r.startDate} → {r.endDate}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{r.days}</td>
                      <td className="space-x-2 px-4 py-2.5">
                        <Button onClick={() => approve.mutate(r._id)} variant="success" size="sm">
                          {t("leave.approve")}
                        </Button>
                        <Button onClick={() => reject.mutate(r._id)} variant="danger" size="sm">
                          {t("leave.reject")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pendingRequests.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        {t("leave.noPending")}
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
