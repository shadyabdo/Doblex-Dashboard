import type { ReactNode } from "react";

const P = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="9.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="12.5" width="7.5" height="8.5" rx="1.5" />
      <rect x="3" y="16.5" width="7.5" height="4.5" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m4.5 12.8 7.5 4.2 7.5-4.2" />
      <path d="m4.5 16.8 7.5 4.2 7.5-4.2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <path d="M3 12.5h18" />
      <path d="M10.5 12.5v2h3v-2" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 6.5h16" />
      <path d="M18.5 6.5v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-13" />
      <path d="M8.5 6.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15.5-4.5-4.5L6 21.5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0Z" />
      <path d="M7 6H4.5a1 1 0 0 0-1 1c0 2.4 1.8 3.9 3.9 4" />
      <path d="M17 6h2.5a1 1 0 0 1 1 1c0 2.4-1.8 3.9-3.9 4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.2-4.2" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  arrow: (
    <>
      <path d="M19 12H5.5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="M8 15.5v2M12.5 11v6.5M17 6.5v11" />
    </>
  ),
  megaphone: (
    <>
      <path d="m3.5 10.8 13.5-5.8v14L3.5 13.2z" />
      <path d="M11.8 16.9a3 3 0 1 1-5.6-1.9" />
      <path d="M17 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  code: (
    <>
      <path d="m8 7.5-4.5 4.5L8 16.5" />
      <path d="m16 7.5 4.5 4.5L16 16.5" />
      <path d="m13.2 4.5-2.4 15" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M7.5 4.5v15M16.5 4.5v15" />
      <path d="M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 1.5-2-.6-1.3.2-2.6 1.6-2.6H17a4 4 0 0 0 4-4c0-5.2-4-9.4-9-9.4Z" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="7" r="1" fill="currentColor" />
      <circle cx="16" cy="9.5" r="1" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10.5h18" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3.5a2.6 2.6 0 1 1 3.7 3.7L8 19.9 2.8 21.2 4.1 16Z" />
      <path d="m14.5 6 3.5 3.5" />
    </>
  ),
  upload: (
    <>
      <path d="m6 9.5 6-6 6 6" />
      <path d="M12 3.5V15" />
      <path d="M4.5 20h15" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a5 5 0 0 0 7.6.4l2.5-2.5a5 5 0 0 0-7.1-7.1l-1.4 1.4" />
      <path d="M14 10.5a5 5 0 0 0-7.6-.4l-2.5 2.5a5 5 0 0 0 7.1 7.1l1.4-1.4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9Z" />
    </>
  ),
  spark: (
    <path d="M12 2.5c.5 4.6 2.6 6.7 7.2 7.2-4.6.5-6.7 2.6-7.2 7.2-.5-4.6-2.6-6.7-7.2-7.2 4.6-.5 6.7-2.6 7.2-7.2Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h10" />,
  camera: (
    <>
      <path d="M4.5 8h2l2-3h7l2 3h2a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V9.5A1.5 1.5 0 0 1 4.5 8Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 11.5V4.5a1 1 0 0 1 1-1h7l9 9-8 8-9-9Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  pen: <path d="M17 3.5a2.6 2.6 0 1 1 3.7 3.7L8 19.9 2.8 21.2 4.1 16Z" />,
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.6 1.5 2.6h4c0-1 .7-2 1.5-2.6A6 6 0 0 0 12 3Z" />
    </>
  ),
  cloud: (
    <path d="M17.5 19a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.2 11.6 4 4 0 0 0 6.5 19Z" />
  ),
  sync: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3.5V9h-5.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h13" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
      <circle cx="19" cy="12" r="2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

export function I({ n, className = "h-5 w-5" }: { n: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[n]}
    </svg>
  );
}
