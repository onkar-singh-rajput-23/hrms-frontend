import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger" | "onBrand";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 active:bg-brand-700",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  success: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700",
  onBrand: "bg-white/15 text-white backdrop-blur hover:bg-white/25",
};

/* Every size clears the 44px minimum touch target on `md` and above. */
const SIZES: Record<Size, string> = {
  sm: "min-h-9 gap-1.5 px-3 py-1.5 text-[13px]",
  md: "min-h-11 gap-2 px-4 py-2.5 text-sm",
  lg: "min-h-13 gap-2 px-5 py-3 text-[15px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretches to the full width of its container — the default shape for mobile forms. */
  block?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  iconAfter,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`tap inline-flex items-center justify-center rounded-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 ${
        VARIANTS[variant]
      } ${SIZES[size]} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

/** Square icon-only button, used in the mobile header where space is tight. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  className = "",
  ...rest
}: Omit<ButtonProps, "children" | "size" | "block" | "iconAfter"> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`tap inline-flex size-10 shrink-0 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-45 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      <Icon name={icon} size={19} />
    </button>
  );
}
