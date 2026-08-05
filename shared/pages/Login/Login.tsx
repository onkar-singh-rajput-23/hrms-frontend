"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { Button } from "@/shared/lib/components/Button";
import { FormError, Input } from "@/shared/lib/components/Field";

export default function Login() {
  const { login, user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("admin@hurrys.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (!loading && user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError(t("auth.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="safe-top flex items-center justify-between px-4 py-3.5">
        <p className="text-[17px] font-bold text-slate-900">{t("app.name")}</p>
        <LanguageSwitcher />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("auth.signInTitle")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("auth.signInSubtitle")}</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
              <Input
                type="email"
                label={t("common.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
              <Input
                type="password"
                label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error && <FormError message={error} />}
              <Button type="submit" disabled={submitting} size="lg" block iconAfter="arrowRight">
                {submitting ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t("auth.newHere")}{" "}
              <Link href="/register" className="font-semibold text-brand-700 underline">
                {t("auth.createAccount")}
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-100/80 p-3.5 text-[12px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-600">{t("auth.demoTitle")}</p>
            <p className="mt-1 font-mono">admin@hurrys.local · gulab.sen@hurrys.local · dinesh@hurrys.local</p>
            <p className="mt-1">{t("auth.demoStaff")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
