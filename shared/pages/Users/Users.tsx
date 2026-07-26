"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/apis/client";
import { ALL_ROLES, type Role, type UserAccount } from "@/shared/types/hrms";
import { useAuth } from "@/client/AppStore/AuthContext";

export default function Users() {
  const { user: currentUser } = useAuth();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Users &amp; roles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Switch an account between Manager and Admin. Admin access can only be granted from here.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Linked employee</th>
              <th className="px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.employee ? `${u.employee.name} (${u.employee.employeeCode})` : "—"}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    disabled={u._id === currentUser?.id || updateRole.isPending}
                    onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value as Role })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {users.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {updateRole.isError && <p className="text-sm text-rose-600">Could not update that user's role.</p>}
    </div>
  );
}
