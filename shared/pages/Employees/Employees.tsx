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
  TableCard,
} from "@/shared/lib/components/Surface";
import type { Department, Employee } from "@/shared/types/hrms";

export default function Employees() {
  const queryClient = useQueryClient();
  const { isMobile } = useAppData();
  const { user } = useAuth();
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get<Employee[]>("/employees")).data,
  });

  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get<Department[]>("/departments")).data,
  });

  // employeeCode is deliberately absent: the server generates the next free code.
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    basicSalary: 0,
  });

  const createEmployee = useMutation({
    mutationFn: async () => (await api.post("/employees", form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setShowForm(false);
      setForm({ name: "", email: "", department: "", designation: "", dateOfJoining: "", basicSalary: 0 });
    },
    onError: (err: any) => setFormError(err?.response?.data?.message || t("employees.couldNotCreate")),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    createEmployee.mutate();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("employees.title")}
        subtitle={t("employees.subtitle")}
        action={user?.role === "admin" ? (
          <Button
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? "secondary" : "primary"}
            icon={showForm ? "x" : "plus"}
            size={isMobile ? "sm" : "md"}
          >
            {showForm ? t("common.cancel") : t("employees.add")}
          </Button>
        ) : undefined}
      />

      {showForm && user?.role === "admin" && (
        <Card>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <p className="text-[12.5px] text-slate-500 sm:col-span-2">{t("employees.codeAutoHint")}</p>
            <Input
              label={t("employees.fullName")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email"
              label={t("common.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Select
              label={t("employees.department")}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">{t("employees.selectDepartment")}</option>
              {departments.data?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Input
              label={t("employees.designation")}
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
            <Input
              type="date"
              label={t("employees.dateOfJoining")}
              value={form.dateOfJoining}
              onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
            />
            <Input
              type="number"
              label={t("employees.basicSalary")}
              value={form.basicSalary}
              onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
              wrapperClassName="sm:col-span-2"
            />
            {formError && (
              <div className="sm:col-span-2">
                <FormError message={formError} />
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createEmployee.isPending} variant="success" icon="check" block={isMobile}>
                {createEmployee.isPending ? t("common.saving") : t("employees.save")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isMobile ? (
        <div className="space-y-2.5">
          {employees.data?.map((e) => (
            <ListCard
              key={e._id}
              title={e.name}
              subtitle={<span className="font-mono text-[12px]">{e.employeeCode}</span>}
              right={<StatusBadge status={e.status} />}
            >
              <KeyValueGrid
                columns={2}
                items={[
                  {
                    label: t("employees.department"),
                    value: typeof e.department === "object" ? e.department?.name : t("common.empty"),
                  },
                  { label: t("employees.designation"), value: e.designation || t("common.empty") },
                ]}
              />
            </ListCard>
          ))}
          {employees.data?.length === 0 && <EmptyState message={t("employees.none")} icon="users" />}
        </div>
      ) : (
        <TableCard>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("employees.code")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.name")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("employees.department")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("employees.designation")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.data?.map((e) => (
                <tr key={e._id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-mono text-[13px]">{e.employeeCode}</td>
                  <td className="px-4 py-2.5">{e.name}</td>
                  <td className="px-4 py-2.5">
                    {typeof e.department === "object" ? e.department?.name : t("common.empty")}
                  </td>
                  <td className="px-4 py-2.5">{e.designation || t("common.empty")}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
              {employees.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    {t("employees.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}
