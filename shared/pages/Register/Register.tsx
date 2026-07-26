"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/client/AppStore/AuthContext";
import { PUBLIC_ROLES, type RegistrationDocument, type Role } from "@/shared/types/hrms";

const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const fieldClassName =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function readDocument(file: File): Promise<RegistrationDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        mimeType: file.type as RegistrationDocument["mimeType"],
        data: String(reader.result),
      });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function Register() {
  const { register, user, loading } = useAuth();
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
  const [role, setRole] = useState<Role>("manager");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  useEffect(() => {
    if (sameAddress) setPermanentAddress(temporaryAddress);
  }, [sameAddress, temporaryAddress]);

  if (!loading && user) return null;

  function selectDocument(event: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return setFile(null);
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
      event.target.value = "";
      setError("Documents must be PDF, JPG, or PNG files");
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      event.target.value = "";
      setError("Each document must be 5 MB or smaller");
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

    if (!/^[6-9]\d{9}$/.test(normalizedMobileNumber)) return setError("Enter a valid 10-digit Aadhaar-linked mobile number");
    if (!/^\d{12}$/.test(normalizedAadhaarNumber)) return setError("Enter a valid 12-digit Aadhaar number");
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(normalizedPanNumber)) return setError("Enter a valid PAN number, for example ABCDE1234F");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setSubmitting(true);
    try {
      const [aadhaarDocument, panDocument] = await Promise.all([
        aadhaarDocumentFile ? readDocument(aadhaarDocumentFile) : undefined,
        panDocumentFile ? readDocument(panDocumentFile) : undefined,
      ]);
      await register({
        name: name.trim(), fathersName: fathersName.trim(), temporaryAddress: temporaryAddress.trim(),
        permanentAddress: permanentAddress.trim(), aadhaarLinkedMobileNumber: normalizedMobileNumber,
        aadhaarNumber: normalizedAadhaarNumber, aadhaarDocument, panNumber: normalizedPanNumber,
        panDocument, email: email.trim().toLowerCase(), password, role,
      });
      router.push("/dashboard");
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || caughtError?.message || "Could not create your account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-800">Employee registration</h1>
        <p className="mt-1 text-sm text-slate-500">Complete your personal and identity details. Fields marked with * are required.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Personal details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField label="Full name *" value={name} onChange={setName} autoComplete="name" />
              <TextField label="Father's name *" value={fathersName} onChange={setFathersName} />
              <AddressField label="Temporary address *" value={temporaryAddress} onChange={setTemporaryAddress} />
              <AddressField label="Permanent address *" value={permanentAddress} onChange={setPermanentAddress} disabled={sameAddress} />
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input type="checkbox" checked={sameAddress} onChange={(event) => setSameAddress(event.target.checked)} className="size-4 rounded border-slate-300" />
                Permanent address is the same as temporary address
              </label>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Identity details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Aadhaar-linked mobile number *
                <input type="tel" inputMode="numeric" value={aadhaarLinkedMobileNumber}
                  onChange={(event) => setAadhaarLinkedMobileNumber(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  required pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" autoComplete="tel" className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Aadhaar number *
                <input type="text" inputMode="numeric" value={aadhaarNumber}
                  onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, "").slice(0, 12))}
                  required pattern="[0-9]{12}" maxLength={12} placeholder="12-digit Aadhaar number" className={fieldClassName} />
              </label>
              <DocumentField label="Aadhaar document" onChange={(event) => selectDocument(event, setAadhaarDocumentFile)} />
              <label className="block text-sm font-medium text-slate-700">
                PAN number *
                <input type="text" value={panNumber}
                  onChange={(event) => setPanNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  required pattern="[A-Z]{5}[0-9]{4}[A-Z]" maxLength={10} placeholder="ABCDE1234F" className={`${fieldClassName} uppercase`} />
              </label>
              <DocumentField label="PAN document" onChange={(event) => selectDocument(event, setPanDocumentFile)} />
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Email address *
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password *
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password *
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} autoComplete="new-password" className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Role *
                <select value={role} onChange={(event) => setRole(event.target.value as Role)} className={fieldClassName}>
                  {PUBLIC_ROLES.map((publicRole) => <option key={publicRole.value} value={publicRole.value}>{publicRole.label}</option>)}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-400">An HR admin can change this later.</span>
              </label>
            </div>
          </section>

          {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}
    <input type="text" value={value} onChange={(event) => onChange(event.target.value)} required autoComplete={autoComplete} className={fieldClassName} />
  </label>;
}

function AddressField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700 sm:col-span-2">{label}
    <textarea value={value} onChange={(event) => onChange(event.target.value)} required disabled={disabled} rows={3}
      className={`${fieldClassName} resize-y disabled:bg-slate-100`} />
  </label>;
}

function DocumentField({ label, onChange }: { label: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="block text-sm font-medium text-slate-700">{label} <span className="font-normal text-slate-400">(optional)</span>
    <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChange}
      className="mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700" />
    <span className="mt-1 block text-xs font-normal text-slate-400">PDF, JPG, or PNG up to 5 MB</span>
  </label>;
}
