import type { IconName } from "@/shared/lib/components/Icon";
import { MetricTile } from "@/shared/lib/components/Surface";

/** Thin wrapper kept for existing call sites; the visual is `MetricTile`. */
export function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: "default" | "brand";
}) {
  return <MetricTile label={title} value={value} hint={hint} icon={icon} tone={tone} />;
}
