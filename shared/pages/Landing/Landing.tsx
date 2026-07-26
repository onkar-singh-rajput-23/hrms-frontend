"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/client/AppStore/AuthContext";

// Placeholder copy — swap this out for real product copy whenever it's ready.
const FEATURES = [
  { icon: "🕒", title: "Attendance", text: "Punch in and out, and see your history at a glance." },
  { icon: "🌴", title: "Leave", text: "Apply for leave and track balances and approvals." },
  { icon: "💰", title: "Payroll", text: "View payslips as soon as payroll is finalized." },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (!loading && user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="text-lg font-semibold text-slate-800">HRMS</p>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          One place for your team's HR, attendance, and payroll
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          This is placeholder copy describing the app — attendance, leave, and payroll in one
          simple system for the whole company. More detail will be added here soon.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Log in
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-2xl" aria-hidden>
                {f.icon}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-800">{f.title}</p>
              <p className="mt-1 text-sm text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
