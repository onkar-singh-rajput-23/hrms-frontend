import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** The single card surface used everywhere, so radius/border/shadow stay consistent. */
export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 ${
        padded ? "p-4" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name={icon} size={17} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ message, icon = "spark" }: { message: string; icon?: IconName }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name={icon} size={20} />
      </span>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

/**
 * One record rendered as a tappable card. This is what replaces table rows on mobile: the label
 * lives beside its value, so nothing gets clipped on a narrow screen.
 */
export function ListCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children && <div className="mt-3 border-t border-slate-100 pt-3">{children}</div>}
    </Card>
  );
}

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

/** Label-above-value pairs; two columns fit comfortably on a 360px screen. */
export function KeyValueGrid({ items, columns = 2 }: { items: KeyValueItem[]; columns?: 1 | 2 | 3 }) {
  const gridClass = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <dl className={`grid gap-x-3 gap-y-2.5 ${gridClass}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{item.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Compact metric tile for the stat rails at the top of a page. */
export function MetricTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: "default" | "brand";
}) {
  const isBrand = tone === "brand";
  return (
    <div
      className={`flex min-w-0 flex-col rounded-2xl border p-3.5 shadow-sm ${
        isBrand
          ? "border-brand-600 bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-brand-600/25"
          : "border-slate-200/80 bg-white shadow-slate-200/50"
      }`}
    >
      {/* Labels wrap to a second line rather than truncate — two tiles per row on a 360px screen
          leaves too little width for phrases like "Pending approvals". */}
      <div className="flex items-start gap-1.5">
        {icon && (
          <Icon
            name={icon}
            size={14}
            className={`mt-px shrink-0 ${isBrand ? "text-brand-100" : "text-slate-400"}`}
          />
        )}
        <p
          className={`text-[11px] font-semibold uppercase leading-snug tracking-wide ${
            isBrand ? "text-brand-100" : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>
      <p
        className={`mt-1.5 truncate text-xl font-bold tabular-nums ${
          isBrand ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className={`mt-0.5 truncate text-[11.5px] ${isBrand ? "text-brand-100" : "text-slate-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** Scrolling table wrapper — tables are kept for the desktop surface only. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
