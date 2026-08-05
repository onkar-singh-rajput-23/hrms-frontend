"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { translateRole } from "@/shared/i18n";
import { FormError, Select } from "@/shared/lib/components/Field";
import { EmptyState, ListCard, PageHeader, TableCard } from "@/shared/lib/components/Surface";
import { ALL_ROLES, type Role, type UserAccount } from "@/shared/types/hrms";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { isMobile } = useAppData();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserAccount[]>("/users")).data,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) =>
      (await api.put(`/users/${id}/role`, { role })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  function roleSelect(u: UserAccount, label?: string) {
    const isSelf = u._id === currentUser?.id;
    return (
      <Select
        label={label}
        aria-label={t("common.role")}
        value={u.role}
        disabled={isSelf || updateRole.isPending}
        onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value as Role })}
        hint={isSelf ? t("users.currentUserHint") : undefined}
      >
        {ALL_ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {translateRole(t, r.value)}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("users.title")} subtitle={t("users.subtitle")} />

      {isMobile ? (
        <div className="space-y-2.5">
          {users.data?.map((u) => (
            <ListCard key={u._id} title={u.name} subtitle={u.email}>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {t("users.linkedEmployee")}
              </p>
              <p className="mb-3 text-sm font-medium text-slate-800">
                {u.employee ? `${u.employee.name} (${u.employee.employeeCode})` : t("common.empty")}
              </p>
              {roleSelect(u, t("common.role"))}
            </ListCard>
          ))}
          {users.data?.length === 0 && <EmptyState message={t("users.none")} icon="shield" />}
        </div>
      ) : (
        <TableCard>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("common.name")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.email")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("users.linkedEmployee")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("common.role")}</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{u.name}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">
                    {u.employee ? `${u.employee.name} (${u.employee.employeeCode})` : t("common.empty")}
                  </td>
                  <td className="w-48 px-4 py-2.5">{roleSelect(u)}</td>
                </tr>
              ))}
              {users.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    {t("users.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      )}

      {updateRole.isError && <FormError message={t("users.couldNotUpdate")} />}
    </div>
  );
}
