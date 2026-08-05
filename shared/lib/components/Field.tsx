import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Icon } from "./Icon";

/* 44px min-height and 16px text keep fields comfortable to tap and stop iOS zooming on focus. */
const CONTROL =
  "w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-800 shadow-sm shadow-slate-100 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400";

function Wrapper({
  label,
  hint,
  children,
  className = "",
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11.5px] font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

interface BaseProps {
  label?: string;
  hint?: string;
  /** Class applied to the outer label, e.g. `sm:col-span-2`. */
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  wrapperClassName,
  className = "",
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label} hint={hint} className={wrapperClassName}>
      <input className={`${CONTROL} ${className}`} {...rest} />
    </Wrapper>
  );
}

export function Textarea({
  label,
  hint,
  wrapperClassName,
  className = "",
  rows = 3,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper label={label} hint={hint} className={wrapperClassName}>
      <textarea rows={rows} className={`${CONTROL} resize-y leading-6 ${className}`} {...rest} />
    </Wrapper>
  );
}

export function Select({
  label,
  hint,
  wrapperClassName,
  className = "",
  children,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper label={label} hint={hint} className={wrapperClassName}>
      <span className="relative block">
        <select className={`${CONTROL} appearance-none pr-10 ${className}`} {...rest}>
          {children}
        </select>
        <Icon
          name="chevronDown"
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </span>
    </Wrapper>
  );
}

export function FileField({
  label,
  hint,
  wrapperClassName,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label} hint={hint} className={wrapperClassName}>
      <input
        type="file"
        className="block w-full rounded-xl border border-slate-200 bg-white p-2 text-[13px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-brand-700"
        {...rest}
      />
    </Wrapper>
  );
}

export function Checkbox({
  label,
  className = "",
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex min-h-11 items-center gap-3 text-sm text-slate-600 ${className}`}>
      <input
        type="checkbox"
        className="size-5 shrink-0 rounded-md border-slate-300 text-brand-600 accent-brand-600"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
      <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
      <Icon name="check" size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
