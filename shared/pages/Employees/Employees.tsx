"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import type { Department, Employee } from "@/shared/types/hrms";
import { StatusBadge } from "@/shared/components/StatusBadge";

export default function Employees() {
  const queryClient = useQueryClient();
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

  const [form, setForm] = useState({
    employeeCode: "",
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
      setForm({ employeeCode: "", name: "", email: "", department: "", designation: "", dateOfJoining: "", basicSalary: 0 });
    },
    onError: (err: any) => setFormError(err?.response?.data?.message || "Could not create employee"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    createEmployee.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Employees</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancel" : "Add employee"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <input
            placeholder="Employee code"
            value={form.employeeCode}
            onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select department</option>
            {departments.data?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.dateOfJoining}
            onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Basic salary"
            value={form.basicSalary}
            onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {formError && <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p>}
          <button
            type="submit"
            disabled={createEmployee.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2 sm:w-40"
          >
            {createEmployee.isPending ? "Saving…" : "Save employee"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Designation</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.data?.map((e) => (
              <tr key={e._id} className="border-t border-slate-100">
                <td className="px-4 py-2">{e.employeeCode}</td>
                <td className="px-4 py-2">{e.name}</td>
                <td className="px-4 py-2">{typeof e.department === "object" ? e.department?.name : "—"}</td>
                <td className="px-4 py-2">{e.designation || "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
            {employees.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
