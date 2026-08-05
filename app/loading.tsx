"use client";

import { useLocale } from "@/client/AppStore/LocaleContext";
import { FullPageLoader } from "@/shared/lib/components/Spinner";

export default function Loading() {
  const { t } = useLocale();
  return <FullPageLoader label={t("common.loading")} />;
}
