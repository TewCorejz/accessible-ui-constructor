import { useEffect, useState } from "react";

/**
 * Анимации пака «Живой» (выбор команды). Демо: docs/design/animations/4-lively.mp4
 * При системной настройке «Уменьшить движение» всё показывается сразу, без анимаций.
 */
export const reducedMotion = () =>
  typeof window === "undefined" ||
  !window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches;

/** Флаг «экран только что открылся» — пока он true, на виджетах мерцает скелет. */
export function useLoadingSkeleton(ms = 900) {
  const [loading, setLoading] = useState(() => !reducedMotion());
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timer);
  }, [loading, ms]);
  return loading;
}

const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

/**
 * Число досчитывается от нуля до значения. Скринридер читает текст по запросу,
 * а не во время счёта (это не live-регион), поэтому услышит итоговую сумму.
 */
export function CountUp({
  value,
  duration = 900,
  delay = 250,
  instant = false,
}: {
  value: number;
  duration?: number;
  delay?: number;
  /** Сразу показать итог (например, в шаблоне «Фокус»). */
  instant?: boolean;
}) {
  const [shown, setShown] = useState(() => (instant || reducedMotion() ? value : 0));
  useEffect(() => {
    if (instant || reducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      setShown(Math.round(value * easeOutCubic(p)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay, instant]);
  return <>{shown.toLocaleString("ru-RU")}</>;
}
