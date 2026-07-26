"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/client/AppStore/AuthContext";
import { api } from "@/shared/apis/client";
import type { WorkRole } from "@/shared/types/hrms";

export default function WorkRoles() {
  const { user } = useAuth();
  const workRoles = useQuery({
    queryKey: ["work-roles"],
    queryFn: async () => (await api.get<WorkRole[]>("/work-roles")).data,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Food Safety / भोजन को सुरक्षित रखने की प्रक्रिया
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Food Surface Cleaning</h1>
        <p className="mt-2 text-sm text-slate-500">
          Role &amp; Responsibilities / भूमिका और जिम्मेदारियां
          {user?.role === "admin" ? " — Select Edit to update any work role." : ""}
        </p>
      </header>

      {workRoles.isLoading && <p className="text-sm text-slate-500">Loading work roles…</p>}
      {workRoles.isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Could not load work roles.
        </div>
      )}

      <div className="grid gap-5">
        {workRoles.data?.map((workRole) => (
          <WorkRoleCard key={workRole._id} workRole={workRole} canEdit={user?.role === "admin"} />
        ))}
      </div>
    </div>
  );
}

function WorkRoleCard({ workRole, canEdit }: { workRole: WorkRole; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [area, setArea] = useState(workRole.area);
  const [areaHindi, setAreaHindi] = useState(workRole.areaHindi);
  const [responsibilitiesText, setResponsibilitiesText] = useState(workRole.responsibilities.join("\n"));

  useEffect(() => {
    setArea(workRole.area);
    setAreaHindi(workRole.areaHindi);
    setResponsibilitiesText(workRole.responsibilities.join("\n"));
  }, [workRole]);

  const updateRole = useMutation({
    mutationFn: async () => {
      const responsibilities = responsibilitiesText.split("\n").map((item) => item.trim()).filter(Boolean);
      return (await api.put<WorkRole>(`/work-roles/${workRole._id}`, { area, areaHindi, responsibilities })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-roles"] });
      setEditing(false);
    },
  });

  function cancelEditing() {
    setArea(workRole.area);
    setAreaHindi(workRole.areaHindi);
    setResponsibilitiesText(workRole.responsibilities.join("\n"));
    setEditing(false);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        {editing ? (
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <input value={area} onChange={(event) => setArea(event.target.value)} aria-label="Area name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" />
            <input value={areaHindi} onChange={(event) => setAreaHindi(event.target.value)} aria-label="Area Hindi name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" />
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-slate-900">Area: {workRole.area} ({workRole.areaHindi})</h2>
        )}
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white">
            Edit role
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Responsibilities (one responsibility per line)
              <textarea value={responsibilitiesText} onChange={(event) => setResponsibilitiesText(event.target.value)} rows={12}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-500" />
            </label>
            {updateRole.isError && <p className="mt-2 text-sm text-rose-600">Could not save this work role.</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => updateRole.mutate()} disabled={updateRole.isPending || !area.trim() || !areaHindi.trim() || !responsibilitiesText.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {updateRole.isPending ? "Saving…" : "Save changes"}
              </button>
              <button onClick={cancelEditing} disabled={updateRole.isPending}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {workRole.responsibilities.map((responsibility, index) => (
              <li key={`${workRole._id}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="mt-2 size-2 shrink-0 rounded-sm bg-slate-800" aria-hidden />
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
