"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/client/AppStore/AuthContext";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { translateRole } from "@/shared/i18n";
import { Button } from "@/shared/lib/components/Button";
import { Checkbox, FileField, FormError, Input, Select, Textarea } from "@/shared/lib/components/Field";
import { Card } from "@/shared/lib/components/Surface";
import { api } from "@/shared/apis/client";
import {
  PUBLIC_ROLES,
  type RegistrationDocument,
  type Role,
  type SelectableManager,
} from "@/shared/types/hrms";

const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

/** `readError` is passed in already localised — this helper runs outside the component. */
function readDocument(file: File, readError: string): Promise<RegistrationDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        mimeType: file.type as RegistrationDocument["mimeType"],
        data: String(reader.result),
      });
    reader.onerror = () => reject(new Error(readError));
    reader.readAsDataURL(file);
  });
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">{children}</h2>;
}

export default function Register() {
  const { register, user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [aadhaarLinkedMobileNumber, setAadhaarLinkedMobileNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarDocumentFile, setAadhaarDocumentFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [panDocumentFile, setPanDocumentFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [managers, setManagers] = useState<SelectableManager[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  // Public endpoint — the picker has to be filled before the visitor has a token.
  useEffect(() => {
    let cancelled = false;
    api
      .get<SelectableManager[]>("/auth/managers")
      .then(({ data }) => {
        if (!cancelled) setManagers(data);
      })
      .catch(() => {
        /* leave the list empty; the field then explains that HR will assign one */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sameAddress) setPermanentAddress(temporaryAddress);
  }, [sameAddress, temporaryAddress]);

  if (!loading && user) return null;

  function selectDocument(event: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return setFile(null);
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
      event.target.value = "";
      setError(t("register.errorDocumentType"));
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      event.target.value = "";
      setError(t("register.errorDocumentSize"));
      return;
    }
    setError(null);
    setFile(file);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const normalizedAadhaarNumber = aadhaarNumber.replace(/\D/g, "");
    const normalizedMobileNumber = aadhaarLinkedMobileNumber.replace(/\D/g, "");
    const normalizedPanNumber = panNumber.trim().toUpperCase();

    if (!/^[6-9]\d{9}$/.test(normalizedMobileNumber)) return setError(t("register.errorMobile"));
    if (!/^\d{12}$/.test(normalizedAadhaarNumber)) return setError(t("register.errorAadhaar"));
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(normalizedPanNumber)) return setError(t("register.errorPan"));
    if (password !== confirmPassword) return setError(t("register.errorPasswordMatch"));
    if (password.length < 6) return setError(t("register.errorPasswordLength"));
    // Mirrors the server rule: an employee must pick a manager whenever any manager exists.
    if (role === "employee" && managers.length > 0 && !reportingManagerId) {
      return setError(t("register.errorManagerRequired"));
    }

    setSubmitting(true);
    try {
      const [aadhaarDocument, panDocument] = await Promise.all([
        aadhaarDocumentFile
          ? readDocument(aadhaarDocumentFile, t("register.errorDocumentRead", { file: aadhaarDocumentFile.name }))
          : undefined,
        panDocumentFile
          ? readDocument(panDocumentFile, t("register.errorDocumentRead", { file: panDocumentFile.name }))
          : undefined,
      ]);
      await register({
        name: name.trim(), fathersName: fathersName.trim(), temporaryAddress: temporaryAddress.trim(),
        permanentAddress: permanentAddress.trim(), aadhaarLinkedMobileNumber: normalizedMobileNumber,
        aadhaarNumber: normalizedAadhaarNumber, aadhaarDocument, panNumber: normalizedPanNumber,
        panDocument, email: email.trim().toLowerCase(), password, role,
        reportingManagerId: reportingManagerId || undefined,
      });
      router.push("/dashboard");
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || caughtError?.message || t("register.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="safe-top flex items-center justify-between px-4 py-3.5">
        <Link href="/" className="text-[17px] font-bold text-slate-900">
          {t("app.name")}
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pb-10">
        <Card className="!p-5 sm:!p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("register.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-7">
            <section>
              <SectionTitle>{t("register.personalSection")}</SectionTitle>
              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <Input
                  label={`${t("register.fullName")} *`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                />
                <Input
                  label={`${t("register.fathersName")} *`}
                  value={fathersName}
                  onChange={(event) => setFathersName(event.target.value)}
                  required
                />
                <Textarea
                  label={`${t("register.temporaryAddress")} *`}
                  value={temporaryAddress}
                  onChange={(event) => setTemporaryAddress(event.target.value)}
                  required
                  wrapperClassName="sm:col-span-2"
                />
                <Textarea
                  label={`${t("register.permanentAddress")} *`}
                  value={permanentAddress}
                  onChange={(event) => setPermanentAddress(event.target.value)}
                  required
                  disabled={sameAddress}
                  wrapperClassName="sm:col-span-2"
                />
                <Checkbox
                  label={t("register.sameAddress")}
                  checked={sameAddress}
                  onChange={(event) => setSameAddress(event.target.checked)}
                  className="sm:col-span-2"
                />
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <SectionTitle>{t("register.identitySection")}</SectionTitle>
              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  label={`${t("register.aadhaarMobile")} *`}
                  value={aadhaarLinkedMobileNumber}
                  onChange={(event) =>
                    setAadhaarLinkedMobileNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  placeholder={t("register.aadhaarMobilePlaceholder")}
                  autoComplete="tel"
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  label={`${t("register.aadhaarNumber")} *`}
                  value={aadhaarNumber}
                  onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, "").slice(0, 12))}
                  required
                  pattern="[0-9]{12}"
                  maxLength={12}
                  placeholder={t("register.aadhaarNumberPlaceholder")}
                />
                <FileField
                  label={`${t("register.aadhaarDocument")} ${t("common.optional")}`}
                  hint={t("register.documentHint")}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => selectDocument(event, setAadhaarDocumentFile)}
                />
                <Input
                  type="text"
                  label={`${t("register.panNumber")} *`}
                  value={panNumber}
                  onChange={(event) =>
                    setPanNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))
                  }
                  required
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="uppercase"
                />
                <FileField
                  label={`${t("register.panDocument")} ${t("common.optional")}`}
                  hint={t("register.documentHint")}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => selectDocument(event, setPanDocumentFile)}
                />
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <SectionTitle>{t("register.accountSection")}</SectionTitle>
              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <Input
                  type="email"
                  label={`${t("register.emailAddress")} *`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  wrapperClassName="sm:col-span-2"
                />
                <Input
                  type="password"
                  label={`${t("auth.password")} *`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  label={`${t("register.confirmPassword")} *`}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Select
                  label={`${t("common.role")} *`}
                  value={role}
                  onChange={(event) => setRole(event.target.value as Role)}
                  hint={t("register.roleHint")}
                  wrapperClassName="sm:col-span-2"
                >
                  {PUBLIC_ROLES.map((publicRole) => (
                    <option key={publicRole.value} value={publicRole.value}>
                      {translateRole(t, publicRole.value)}
                    </option>
                  ))}
                </Select>

                {/* Employees must name a manager; a manager may leave it for HR to assign. */}
                <Select
                  label={`${t("register.reportingManager")}${role === "employee" && managers.length > 0 ? " *" : ""}`}
                  value={reportingManagerId}
                  onChange={(event) => setReportingManagerId(event.target.value)}
                  disabled={managers.length === 0}
                  hint={
                    managers.length === 0
                      ? t("register.noManagersAvailable")
                      : role === "employee"
                        ? t("register.managerHint")
                        : t("register.managerHintForManager")
                  }
                  wrapperClassName="sm:col-span-2"
                >
                  <option value="">
                    {managers.length === 0
                      ? t("register.noManagerOption")
                      : role === "employee"
                        ? t("register.selectManager")
                        : t("register.noManagerOption")}
                  </option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </Select>
              </div>
            </section>

            {error && <FormError message={error} />}

            <Button type="submit" disabled={submitting} size="lg" block>
              {submitting ? t("register.submitting") : t("register.submit")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-brand-700 underline">
              {t("auth.logIn")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
