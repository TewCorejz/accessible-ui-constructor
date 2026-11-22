import { useId } from "react";

/** Знак проекта: плашка в стиле иконки приложения и четыре модуля конструктора. */
export function LogoMark({ size = 44 }: { size?: number }) {
  const id = useId();
  const gradient = `${id}-bg`;
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3FD46A" />
          <stop offset="0.55" stopColor="#14A048" />
          <stop offset="1" stopColor="#0B7A5C" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="228" fill={`url(#${gradient})`} />
      <rect x="232" y="232" width="252" height="252" rx="72" fill="#fff" />
      <rect x="540" y="232" width="252" height="252" rx="72" fill="#fff" fillOpacity="0.92" />
      <rect x="232" y="540" width="252" height="252" rx="72" fill="#fff" fillOpacity="0.92" />
      <rect
        x="558"
        y="558"
        width="216"
        height="216"
        rx="58"
        fill="none"
        stroke="#fff"
        strokeWidth="36"
      />
      <path d="M666 616V716M616 666H716" stroke="#fff" strokeWidth="40" strokeLinecap="round" />
      <circle cx="358" cy="358" r="58" fill="#14A048" />
    </svg>
  );
}
