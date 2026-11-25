import { useEffect, useRef, useState } from "react";

/** Тема конструктора: светлая «Классика», тёмная или как в системе. */
export type ColorTheme = "system" | "light" | "dark";

export const THEME_KEY = "accessible-ui-constructor:app-theme";

export function readColorTheme(): ColorTheme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

/** Ставит data-theme на <html>. Режим высокого контраста всегда светлый — у него свои цвета. */
export function applyColorTheme(theme: ColorTheme, highContrast = false) {
  const dark = !highContrast && (theme === "dark" || (theme === "system" && systemDark()));
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111513" : "#f2f4f3");
}

export function useColorTheme(highContrast: boolean) {
  const [theme, setTheme] = useState<ColorTheme>(readColorTheme);
  const first = useRef(true);
  useEffect(() => {
    // При переключении пользователем цвета меняются плавно (кроме первой отрисовки).
    if (!first.current) {
      document.documentElement.classList.add("theme-changing");
      window.setTimeout(() => document.documentElement.classList.remove("theme-changing"), 350);
    }
    first.current = false;
    applyColorTheme(theme, highContrast);
    try {
      if (theme === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Хранилище недоступно — тема действует до перезагрузки.
    }
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorTheme("system", highContrast);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, highContrast]);
  return [theme, setTheme] as const;
}
