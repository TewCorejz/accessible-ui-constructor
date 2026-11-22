import { Monitor, Smartphone } from "lucide-react";
import { LogoMark } from "./Logo";

/** Ссылка на мобильное приложение (репозиторий с инструкцией по установке). */
export const MOBILE_APP_URL = "https://github.com/TewCorejz/accessible-ui-constructor-mobile";

/**
 * На телефонах веб-конструктор не показывается: для них есть отдельное
 * мобильное приложение. Экран виден только на ширине до 700 px (см. index.css).
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
          <span>Веб-версия конструктора открывается на компьютере и планшете.</span>
        </div>
      </div>
    </main>
  );
}
