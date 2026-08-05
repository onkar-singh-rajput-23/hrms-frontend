import type { SVGProps } from "react";

/**
 * Small inline stroke-icon set. Inline SVG keeps the bundle dependency-free and renders far more
 * crisply on mobile than the emoji this app used before.
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5M9.5 21v-6h5v6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2",
  palm: "M12 21v-8M12 13c0-3-2.5-5-5-4.5M12 13c0-3 2.5-5 5-4.5M12 13c-.5-3 .8-5.6 3-6.5M12 13c-.5-3-1.8-5.6-4-6.5M12 13c0-2 1-3.5 2.5-4",
  wallet:
    "M3 8.5A2.5 2.5 0 0 1 5.5 6H18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8.5ZM3 9.5h13.5M16.5 14h1.5",
  clipboard:
    "M9 4.5h6M8.5 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-1.5M9 11h6M9 15h4",
  users:
    "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 5 18.5V20M10.5 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM19 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 5.2a3.25 3.25 0 0 1 0 6.1",
  shield: "M12 21s7-3.2 7-9V6l-7-3-7 3v6c0 5.8 7 9 7 9ZM9.5 12l1.8 1.8L15 10",
  user: "M20 21v-1.5A4.5 4.5 0 0 0 15.5 15h-7A4.5 4.5 0 0 0 4 19.5V21M12 11.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 12h17M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3Z",
  logout: "M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M10.5 12H21M18 9l3 3-3 3",
  check: "M5 12.5 9.5 17 19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  chevronDown: "M6 9.5 12 15.5l6-6",
  chevronRight: "M9.5 6 15.5 12l-6 6",
  chevronLeft: "M14.5 6 8.5 12l6 6",
  plus: "M12 5v14M5 12h14",
  ellipsis: "M6 12h.01M12 12h.01M18 12h.01",
  calendar: "M7 3.5V6M17 3.5V6M4 9.5h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  trash: "M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12a1 1 0 0 0 1 1h7.4a1 1 0 0 0 1-1l.8-12M10.5 11v6M13.5 11v6",
  pencil: "M4 20h4L20 8l-4-4L4 16v4ZM14.5 5.5 18.5 9.5",
  alert: "M12 4 3 19.5h18L12 4ZM12 10v4.5M12 17.5h.01",
  trendUp: "M4 17 9.5 11.5l3.5 3.5L20 8M20 8h-4.5M20 8v4.5",
  briefcase: "M4 8.5h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-10ZM9 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2.5M4 13h16",
  arrowRight: "M4.5 12h15M14 6.5 19.5 12 14 17.5",
  spark: "M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9 12 3.5Z",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: IconName;
  /** Rendered size in px; matches the CSS `em` box of nearby text well at 20–24. */
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.8, className, ...rest }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
