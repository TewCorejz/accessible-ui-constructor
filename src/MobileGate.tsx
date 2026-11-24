import { Monitor, Smartphone } from "lucide-react";
import { LogoMark } from "./Logo";

/** Ссылка на инструкцию по установке мобильного приложения. */
export const MOBILE_APP_URL =
  "https://github.com/TewCorejz/accessible-ui-constructor-mobile/blob/main/docs/install.md";

export const FORCE_WEB_KEY = "accessible-ui-constructor:force-web";

/** Показать веб-версию вместо заглушки (запоминается в браузере). */
export function openWebVersion() {
  try {
    localStorage.setItem(FORCE_WEB_KEY, "1");
  } catch {
    // Хранилище недоступно — веб-версия откроется только до перезагрузки.
  }
  document.documentElement.classList.add("force-web");
  document.getElementById("main")?.focus();
}

/**
 * На сенсорных телефонах вместо веб-конструктора предлагается мобильное
 * приложение (см. index.css: узкий экран и pointer: coarse). Узкое окно на
 * компьютере — например, при увеличении страницы — получает обычную раскладку.
 */
export function MobileGate() {
  return (
    <main className="mobile-gate" aria-labelledby="mobile-gate-title">
      <div className="mobile-gate-card">
        <LogoMark size={72} />
        <h1 id="mobile-gate-title">Конструктор доступных интерфейсов</h1>
        <p>На телефоне удобнее в мобильном приложении: крупные кнопки, всё под рукой.</p>
        <a className="mobile-gate-action" href={MOBILE_APP_URL}>
          <Smartphone size={22} aria-hidden="true" />
          Установить приложение
        </a>
        <div className="mobile-gate-note">
          <Monitor size={20} aria-hidden="true" />
          <span>Веб-версия конструктора рассчитана на компьютер и планшет.</span>
        </div>
        <button type="button" className="mobile-gate-secondary" onClick={openWebVersion}>
          Открыть веб-версию всё равно
        </button>
      </div>
    </main>
  );
}
