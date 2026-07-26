const styles: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  on_leave: "bg-amber-100 text-amber-700",
  absent: "bg-rose-100 text-rose-700",
  half_day: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
  draft: "bg-amber-100 text-amber-700",
  finalized: "bg-emerald-100 text-emerald-700",
  active: "bg-emerald-100 text-emerald-700",
  exited: "bg-slate-100 text-slate-600",
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}
