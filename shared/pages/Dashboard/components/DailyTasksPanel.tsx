"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { DailyTask, Employee, Role } from "@/shared/types/hrms";

interface DailyTasksPanelProps {
  role?: Role;
  employee?: Employee | null;
  employees?: Employee[];
}

const TASK_STATUSES: DailyTask["status"][] = ["todo", "in_progress", "done"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function taskStatusLabel(status: DailyTask["status"]): string {
  return status.replace("_", " ");
}

export function DailyTasksPanel({ role, employee, employees = [] }: DailyTasksPanelProps) {
  if (role === "admin") {
    return <AdminTaskEditor employees={employees} />;
  }

  if (!employee) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">Daily tasks</h2>
        <p className="mt-2 text-sm text-slate-500">No employee profile is linked to this account yet.</p>
      </section>
    );
  }

  return <EmployeeTaskList />;
}

function EmployeeTaskList() {
  const queryClient = useQueryClient();
  const today = todayStr();

  const tasks = useQuery({
    queryKey: ["tasks", "me", today],
    queryFn: async () => (await api.get<DailyTask[]>("/tasks/me", { params: { date: today } })).data,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DailyTask["status"] }) =>
      (await api.patch<DailyTask>(`/tasks/${id}/status`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "me", today] }),
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Daily tasks</h2>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {tasks.data?.filter((task) => task.status === "done").length ?? 0} done
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Task</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.data?.map((task) => (
              <tr key={task._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{task.title}</p>
                  {task.description && <p className="mt-1 text-xs text-slate-500">{task.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updateStatus.mutate({ id: task._id, status: task.status === "done" ? "todo" : "done" })}
                    disabled={updateStatus.isPending}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    {task.status === "done" ? "Reopen" : "Mark done"}
                  </button>
                </td>
              </tr>
            ))}
            {tasks.data?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No tasks assigned for today.
                </td>
              </tr>
            )}
            {tasks.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Loading tasks...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminTaskEditor({ employees }: { employees: Employee[] }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0]._id);
    }
  }, [employees, selectedEmployeeId]);

  const tasks = useQuery({
    queryKey: ["tasks", "admin", date, selectedEmployeeId],
    queryFn: async () =>
      (await api.get<DailyTask[]>("/tasks", { params: { date, employeeId: selectedEmployeeId } })).data,
    enabled: !!selectedEmployeeId,
  });

  const createTask = useMutation({
    mutationFn: async () =>
      (
        await api.post<DailyTask>("/tasks", {
          employeeId: selectedEmployeeId,
          date,
          title: newTitle,
          description: newDescription || undefined,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, selectedEmployeeId] });
      setNewTitle("");
      setNewDescription("");
      setFormError(null);
    },
    onError: (err: any) => setFormError(err?.response?.data?.message || "Could not create task"),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, selectedEmployeeId] }),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!selectedEmployeeId) {
      setFormError("Select an employee first");
      return;
    }
    if (!newTitle.trim()) {
      setFormError("Task title is required");
      return;
    }
    createTask.mutate();
  }

  const activeEmployees = employees.filter((item) => item.status === "active");

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Daily task editor</h2>
          <p className="mt-1 text-sm text-slate-500">Assign and edit daily tasks for each employee.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            className="min-w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {activeEmployees.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Task title"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
          placeholder="Description"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createTask.isPending || activeEmployees.length === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add task
        </button>
        {formError && <p className="text-sm text-rose-600 md:col-span-3">{formError}</p>}
      </form>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Task</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.data?.map((task) => (
              <AdminTaskRow
                key={task._id}
                task={task}
                date={date}
                employeeId={selectedEmployeeId}
                onDelete={() => deleteTask.mutate(task._id)}
              />
            ))}
            {tasks.data?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No tasks for this employee and date.
                </td>
              </tr>
            )}
            {tasks.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Loading tasks...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminTaskRow({
  task,
  date,
  employeeId,
  onDelete,
}: {
  task: DailyTask;
  date: string;
  employeeId: string;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<DailyTask["status"]>(task.status);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
  }, [task]);

  const updateTask = useMutation({
    mutationFn: async () =>
      (
        await api.put<DailyTask>(`/tasks/${task._id}`, {
          title,
          description: description || undefined,
          status,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, employeeId] }),
  });

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="grid gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as DailyTask["status"])}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {TASK_STATUSES.map((item) => (
            <option key={item} value={item}>
              {taskStatusLabel(item)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateTask.mutate()}
            disabled={updateTask.isPending || !title.trim()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-rose-600"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
