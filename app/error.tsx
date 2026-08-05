"use client";

import { useLocale } from "@/client/AppStore/LocaleContext";
import { Button } from "@/shared/lib/components/Button";
import { Icon } from "@/shared/lib/components/Icon";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Icon name="alert" size={24} />
        </span>
        <h1 className="mt-3.5 text-[17px] font-bold text-slate-900">{t("common.errorTitle")}</h1>
        <Button onClick={reset} block className="mt-5">
          {t("common.tryAgain")}
        </Button>
      </div>
    </div>
  );
}
