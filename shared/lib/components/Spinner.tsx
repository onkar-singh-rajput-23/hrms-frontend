export function Spinner({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-brand-600 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Full-height centred loader used by route-level loading states. */
export function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50">
      <Spinner size={26} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
