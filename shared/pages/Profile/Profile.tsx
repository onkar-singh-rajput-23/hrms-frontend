"use client";

import { useAuth } from "@/client/AppStore/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const employee = user?.employee;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">My profile</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Name</dt>
            <dd className="text-sm font-medium text-slate-800">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="text-sm font-medium text-slate-800">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Role</dt>
            <dd className="text-sm font-medium capitalize text-slate-800">{user?.role.replace("_", " ")}</dd>
          </div>
          {employee && (
            <>
              <div>
                <dt className="text-xs text-slate-500">Employee code</dt>
                <dd className="text-sm font-medium text-slate-800">{employee.employeeCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Designation</dt>
                <dd className="text-sm font-medium text-slate-800">{employee.designation || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Date of joining</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {new Date(employee.dateOfJoining).toLocaleDateString()}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
