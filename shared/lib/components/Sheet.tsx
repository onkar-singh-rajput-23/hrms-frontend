"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "@/client/AppStore/AppDataContext";
import { IconButton } from "./Button";

/**
 * Bottom sheet on touch surfaces, centred dialog on desktop. Used for the language picker and the
 * overflow nav menu, both of which need to appear above the fixed bottom navigation.
 *
 * Rendered through a portal on `document.body`: the language button lives inside the mobile header,
 * which is a flex item with a `z-index`, and a flex item with a z-index creates a stacking context
 * even while statically positioned — so an in-place sheet would be trapped beneath the bottom nav.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const { isMobile } = useAppData();
  // `document` only exists after mount, so the portal target is captured client-side.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => setContainer(document.body), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !container) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${isMobile ? "items-end" : "items-center justify-center p-6"}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-slate-900/45 backdrop-blur-sm"
      />

      <div
        className={`relative w-full bg-white shadow-2xl ${
          isMobile
            ? "safe-bottom animate-sheet-in max-h-[85dvh] overflow-y-auto rounded-t-3xl"
            : "animate-dialog-in max-h-[80dvh] max-w-md overflow-y-auto rounded-2xl"
        }`}
      >
        {isMobile && (
          <div className="sticky top-0 z-10 flex justify-center bg-white pt-2.5 pb-1">
            <span className="h-1.5 w-10 rounded-full bg-slate-200" />
          </div>
        )}
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          <IconButton icon="x" label={closeLabel} onClick={onClose} className="-mt-1 -mr-1.5" />
        </div>
        <div className="px-4 pb-5 pt-1">{children}</div>
      </div>
    </div>,
    container
  );
}

/** Full-width row used inside a sheet — a nav link or a language option. */
export function SheetOption({
  onClick,
  label,
  selected = false,
  children,
}: {
  onClick: () => void;
  /** Explicit accessible name, since the visible label sits inside decorated child nodes. */
  label: string;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={selected || undefined}
      className={`tap flex min-h-13 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium ${
        selected ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
