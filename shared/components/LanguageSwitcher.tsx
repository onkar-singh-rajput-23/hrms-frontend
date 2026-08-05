"use client";

import { useState } from "react";
import { useLocale } from "@/client/AppStore/LocaleContext";
import { LOCALES } from "@/shared/constants/locales";
import { Icon } from "@/shared/lib/components/Icon";
import { Sheet, SheetOption } from "@/shared/lib/components/Sheet";

type Tone = "onBrand" | "plain";

/**
 * The navbar language button. Shows the active language and opens a picker — a bottom sheet on
 * mobile, a centred dialog on desktop.
 */
export function LanguageSwitcher({ tone = "plain" }: { tone?: Tone }) {
  const { locale, option, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const onBrand = tone === "onBrand";

  function choose(next: typeof locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t("language.change")} — ${option.label}`}
        aria-haspopup="dialog"
        className={`tap inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          onBrand
            ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Icon name="globe" size={17} />
        <span>{option.shortLabel}</span>
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("language.select")}
        description={t("language.hint")}
        closeLabel={t("common.close")}
      >
        <div className="space-y-1">
          {LOCALES.map((item) => {
            const selected = item.value === locale;
            return (
              <SheetOption
                key={item.value}
                label={item.nativeLabel}
                selected={selected}
                onClick={() => choose(item.value)}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ${
                    selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.shortLabel}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.nativeLabel}</span>
                  {item.nativeLabel !== item.label && (
                    <span className="block truncate text-[12px] font-normal text-slate-400">{item.label}</span>
                  )}
                </span>
                {selected && <Icon name="check" size={18} className="shrink-0 text-brand-600" />}
              </SheetOption>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
