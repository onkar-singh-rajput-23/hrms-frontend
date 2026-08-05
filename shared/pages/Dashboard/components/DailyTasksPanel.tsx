"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { TranslateFn } from "@/shared/i18n";
import { Button } from "@/shared/lib/components/Button";
import { FormError, Input, Select } from "@/shared/lib/components/Field";
import { Card, EmptyState, SectionHeader, TableCard } from "@/shared/lib/components/Surface";
import type { DailyTask, Employee, Role } from "@/shared/types/hrms";

interface DailyTasksPanelProps {
  role?: Role;
  employee?: Employee | null;
  employees?: Employee[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyTasksPanel({ role, employee, employees = [] }: DailyTasksPanelProps) {
  const { t } = useLocale();

  if (role === "manager" || role === "admin") {
    return (
      <div className="space-y-6">
        {employee && <EmployeeTaskList />}
        <AdminTaskEditor employees={employees} />
      </div>
    );
  }

  if (!employee) {
    return (
      <Card>
        <SectionHeader title={t("tasks.title")} icon="clipboard" />
        <p className="text-sm text-slate-500">{t("tasks.noEmployeeProfile")}</p>
      </Card>
    );
  }

  return <EmployeeTaskList />;
}

function EmployeeTaskList() {
  const queryClient = useQueryClient();
  const { isMobile } = useAppData();
  const { t } = useLocale();
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

  const doneCount = tasks.data?.filter((task) => task.status === "approved").length ?? 0;

  function employeeAction(task: DailyTask): { status: "in_progress" | "pending_approval"; label: string } | null {
    if (task.status === "todo") return { status: "in_progress", label: t("tasks.start") };
    if (task.status === "in_progress") return { status: "pending_approval", label: t("tasks.submitForApproval") };
    return null;
  }

  return (
    <section>
      <SectionHeader
        title={t("tasks.title")}
        subtitle={today}
        icon="clipboard"
        action={
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700">
            {t("tasks.doneCount", { count: doneCount })}
          </span>
        }
      />

      {isMobile ? (
        <div className="space-y-2.5">
          {tasks.data?.map((task) => {
            const action = employeeAction(task);
            return <Card key={task._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[15px] font-semibold ${
                      task.status === "approved" ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && <p className="mt-1 text-[13px] text-slate-500">{task.description}</p>}
                </div>
                <StatusBadge status={task.status} />
              </div>
              {action ? (
                <Button
                  onClick={() => updateStatus.mutate({ id: task._id, status: action.status })}
                  disabled={updateStatus.isPending}
                  variant="success"
                  icon="check"
                  size="sm"
                  block
                  className="mt-3"
                >
                  {action.label}
                </Button>
              ) : (
                <p className="mt-3 text-[13px] font-medium text-slate-500">
                  {task.status === "pending_approval" || task.status === "done" ? t("tasks.awaitingApproval") : t("tasks.approved")}
                </p>
              )}
            </Card>;
          })}
          {tasks.isLoading && <EmptyState message={t("common.loadingTasks")} icon="clock" />}
          {tasks.data?.length === 0 && <EmptyState message={t("tasks.noneToday")} icon="clipboard" />}
        </div>
      ) : (
        <TableCard>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("tasks.task")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.action")}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.data?.map((task) => {
                const action = employeeAction(task);
                return <tr key={task._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{task.title}</p>
                    {task.description && <p className="mt-1 text-xs text-slate-500">{task.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    {action ? (
                      <Button
                        onClick={() => updateStatus.mutate({ id: task._id, status: action.status })}
                        disabled={updateStatus.isPending}
                        variant="secondary"
                        size="sm"
                      >
                        {action.label}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {task.status === "pending_approval" || task.status === "done" ? t("tasks.awaitingApproval") : t("tasks.approved")}
                      </span>
                    )}
                  </td>
                </tr>;
              })}
              {tasks.data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    {t("tasks.noneToday")}
                  </td>
                </tr>
              )}
              {tasks.isLoading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    {t("common.loadingTasks")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  );
}

function AdminTaskEditor({ employees }: { employees: Employee[] }) {
  const queryClient = useQueryClient();
  const { isMobile } = useAppData();
  const { t } = useLocale();
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
    onError: (err: any) => setFormError(err?.response?.data?.message || t("tasks.couldNotCreate")),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, selectedEmployeeId] }),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!selectedEmployeeId) {
      setFormError(t("tasks.selectEmployeeFirst"));
      return;
    }
    if (!newTitle.trim()) {
      setFormError(t("tasks.titleRequired"));
      return;
    }
    createTask.mutate();
  }

  const activeEmployees = employees.filter((item) => item.status === "active");

  return (
    <section>
      <SectionHeader title={t("tasks.editorTitle")} subtitle={t("tasks.editorSubtitle")} icon="clipboard" />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="date"
            label={t("common.date")}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Select
            label={t("common.employee")}
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
          >
            {activeEmployees.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.employeeCode})
              </option>
            ))}
          </Select>
        </div>

        <form onSubmit={onSubmit} className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder={t("tasks.titlePlaceholder")}
          />
          <Input
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            placeholder={t("tasks.descriptionPlaceholder")}
          />
          {formError && (
            <div className="sm:col-span-2">
              <FormError message={formError} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={createTask.isPending || activeEmployees.length === 0}
              icon="plus"
              block={isMobile}
            >
              {t("tasks.add")}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-3">
        {isMobile ? (
          <div className="space-y-2.5">
            {tasks.data?.map((task) => (
              <AdminTaskCard
                key={task._id}
                task={task}
                date={date}
                employeeId={selectedEmployeeId}
                onDelete={() => deleteTask.mutate(task._id)}
                t={t}
              />
            ))}
            {tasks.isLoading && <EmptyState message={t("common.loadingTasks")} icon="clock" />}
            {tasks.data?.length === 0 && <EmptyState message={t("tasks.noneForEmployee")} icon="clipboard" />}
          </div>
        ) : (
          <TableCard>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t("tasks.task")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("common.status")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("common.actions")}</th>
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
                    t={t}
                  />
                ))}
                {tasks.data?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      {t("tasks.noneForEmployee")}
                    </td>
                  </tr>
                )}
                {tasks.isLoading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      {t("common.loadingTasks")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableCard>
        )}
      </div>
    </section>
  );
}

interface AdminTaskEditProps {
  task: DailyTask;
  date: string;
  employeeId: string;
  onDelete: () => void;
  t: TranslateFn;
}

/** Shared edit state for the mobile card and the desktop row. */
function useTaskDraft(task: DailyTask, date: string, employeeId: string) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task]);

  const updateTask = useMutation({
    mutationFn: async () =>
      (
        await api.put<DailyTask>(`/tasks/${task._id}`, {
          title,
          description: description || undefined,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, employeeId] }),
  });

  const reviewTask = useMutation({
    mutationFn: async (action: "approve" | "reopen") =>
      (await api.patch<DailyTask>(`/tasks/${task._id}/review`, { action })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "admin", date, employeeId] }),
  });

  return { title, setTitle, description, setDescription, updateTask, reviewTask };
}

function AdminTaskCard({ task, date, employeeId, onDelete, t }: AdminTaskEditProps) {
  const { title, setTitle, description, setDescription, updateTask, reviewTask } = useTaskDraft(
    task,
    date,
    employeeId
  );

  return (
    <Card>
      <div className="grid gap-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label={t("tasks.task")} />
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("tasks.descriptionPlaceholder")}
        />
        <StatusBadge status={task.status} />
        <div className="flex gap-2.5">
          <Button
            onClick={() => updateTask.mutate()}
            disabled={updateTask.isPending || !title.trim()}
            icon="check"
            block
          >
            {updateTask.isPending ? t("common.saving") : t("common.save")}
          </Button>
          <Button onClick={onDelete} variant="secondary" icon="trash" className="!text-rose-600">
            {t("common.delete")}
          </Button>
        </div>
        {(task.status === "pending_approval" || task.status === "done" || task.status === "approved") && (
          <div className="flex gap-2.5">
            {(task.status === "pending_approval" || task.status === "done") && (
              <Button onClick={() => reviewTask.mutate("approve")} disabled={reviewTask.isPending} variant="success" block>
                {t("tasks.approve")}
              </Button>
            )}
            <Button onClick={() => reviewTask.mutate("reopen")} disabled={reviewTask.isPending} variant="secondary" block>
              {t("tasks.reopen")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function AdminTaskRow({ task, date, employeeId, onDelete, t }: AdminTaskEditProps) {
  const { title, setTitle, description, setDescription, updateTask, reviewTask } = useTaskDraft(
    task,
    date,
    employeeId
  );

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="grid gap-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label={t("tasks.task")} />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("tasks.descriptionPlaceholder")}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => updateTask.mutate()} disabled={updateTask.isPending || !title.trim()} size="sm">
            {updateTask.isPending ? t("common.saving") : t("common.save")}
          </Button>
          <Button onClick={onDelete} variant="secondary" size="sm" className="!text-rose-600">
            {t("common.delete")}
          </Button>
          {(task.status === "pending_approval" || task.status === "done") && (
            <Button onClick={() => reviewTask.mutate("approve")} disabled={reviewTask.isPending} variant="success" size="sm">
              {t("tasks.approve")}
            </Button>
          )}
          {(task.status === "pending_approval" || task.status === "done" || task.status === "approved") && (
            <Button onClick={() => reviewTask.mutate("reopen")} disabled={reviewTask.isPending} variant="secondary" size="sm">
              {t("tasks.reopen")}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
