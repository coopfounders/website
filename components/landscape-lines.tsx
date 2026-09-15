export function LandscapeLines({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`landscape-lines ${className}`}
      viewBox="0 0 1600 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 380C360 570 745 490 1080 280C1320 130 1480 70 1600 0V600H0Z"
        fill="var(--surface-blue)"
      />
      <path
        d="M0 455C450 585 830 485 1150 320C1370 208 1490 180 1600 164V600H0Z"
        fill="var(--blue-light)"
      />
      <path
        d="M0 528C470 605 825 540 1200 408C1380 345 1500 335 1600 330V600H0Z"
        fill="var(--blue-midtone)"
      />
      <path
        d="M0 402C360 590 745 512 1080 302C1320 152 1480 92 1600 22M0 477C450 607 830 507 1150 342C1370 230 1490 202 1600 186M0 548C470 625 825 560 1200 428C1380 365 1500 355 1600 350"
        stroke="#ffffff"
        strokeOpacity=".65"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
