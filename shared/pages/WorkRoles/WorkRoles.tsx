"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { api } from "@/shared/apis/client";
import { Button } from "@/shared/lib/components/Button";
import { FormError, Input, Textarea } from "@/shared/lib/components/Field";
import { Card, EmptyState } from "@/shared/lib/components/Surface";
import { Icon } from "@/shared/lib/components/Icon";
import type { WorkRole } from "@/shared/types/hrms";

export default function WorkRoles() {
  const { user } = useAuth();
  const { t } = useLocale();

  const workRoles = useQuery({
    queryKey: ["work-roles"],
    queryFn: async () => (await api.get<WorkRole[]>("/work-roles")).data,
  });

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-5">
      <header>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-emerald-700">
          <Icon name="check" size={13} />
          {t("workRoles.eyebrow")}
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{t("workRoles.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("workRoles.subtitle")}</p>
        {isAdmin && <p className="mt-1 text-[13px] text-slate-400">{t("workRoles.adminHint")}</p>}
      </header>

      {workRoles.isLoading && <EmptyState message={t("workRoles.loading")} icon="clipboard" />}
      {workRoles.isError && <FormError message={t("workRoles.loadError")} />}

      <div className="grid gap-3.5">
        {workRoles.data?.map((workRole) => (
          <WorkRoleCard key={workRole._id} workRole={workRole} canEdit={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function WorkRoleCard({ workRole, canEdit }: { workRole: WorkRole; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { t } = useLocale();
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
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
        {editing ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Input label={t("workRoles.areaName")} value={area} onChange={(event) => setArea(event.target.value)} />
            <Input
              label={t("workRoles.areaHindiName")}
              value={areaHindi}
              onChange={(event) => setAreaHindi(event.target.value)}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("workRoles.area")}
              </p>
              <h2 className="mt-0.5 text-[15px] font-bold text-slate-900">{workRole.area}</h2>
              <p className="text-[13px] text-slate-500">{workRole.areaHindi}</p>
            </div>
            {canEdit && (
              <Button onClick={() => setEditing(true)} variant="secondary" size="sm" icon="pencil">
                {t("common.edit")}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div>
            <Textarea
              label={t("workRoles.responsibilities")}
              value={responsibilitiesText}
              onChange={(event) => setResponsibilitiesText(event.target.value)}
              rows={12}
            />
            {updateRole.isError && (
              <div className="mt-2.5">
                <FormError message={t("workRoles.saveError")} />
              </div>
            )}
            <div className="mt-3.5 flex gap-2.5">
              <Button
                onClick={() => updateRole.mutate()}
                disabled={updateRole.isPending || !area.trim() || !areaHindi.trim() || !responsibilitiesText.trim()}
                icon="check"
                block
              >
                {updateRole.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
              <Button onClick={cancelEditing} disabled={updateRole.isPending} variant="secondary">
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {workRole.responsibilities.map((responsibility, index) => (
              <li key={`${workRole._id}-${index}`} className="flex gap-3 text-[14px] leading-6 text-slate-700">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
