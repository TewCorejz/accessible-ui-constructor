import { ArrowRight, Check, CreditCard, GraduationCap, QrCode, Smartphone } from "lucide-react";

export function TemplatePreview({
  theme,
  title,
  types,
}: {
  theme: string;
  title: string;
  types: string[];
}) {
  const student = theme === "student";
  const focused = theme === "focus";
  const contrast = theme === "contrast";
  return (
    <div className={`preset-preview preset-${theme}`} aria-hidden="true">
      <div className="preset-preview-header">
        <span>
          <Check size={15} strokeWidth={3} />
          {title}
        </span>
        {!focused && <span>{student ? <GraduationCap size={20} /> : "Аа 24"}</span>}
      </div>
      {types.includes("balance") && (
        <div className="preset-balance">
          <span>Мой баланс</span>
          <strong>128 450 ₽</strong>
          {!focused && !contrast && <span>Доступно на карте</span>}
        </div>
      )}
      {types.includes("quick") && (
        <div className="preset-payments">
          <span>{focused ? "Оплата мобильной связи" : "Быстрая оплата"}</span>
          <div className="preset-action">
            <Smartphone size={22} />
            <span>{focused ? "Перейти к оплате" : "Мобильная связь"}</span>
            <ArrowRight size={18} />
          </div>
          {!focused && (
            <div className="preset-action">
              <CreditCard size={22} />
              <span>Услуги ЖКХ</span>
              <ArrowRight size={18} />
            </div>
          )}
        </div>
      )}
      {types.includes("qr") && (
        <div className="preset-qr">
          <QrCode size={52} />
          <span>Оплата по QR-коду</span>
          <span className="preset-qr-action">Показать QR-код</span>
        </div>
      )}
      {types.includes("history") && (
        <div className="preset-extra">
          История переводов <span>+ 5 000 ₽</span>
        </div>
      )}
      {types.includes("studentQr") && (
        <div className="preset-campus">
          <span>Мои QR-коды</span>
          <div>
            {["Пропуск", "Студенческий", "Оплата"].map((text) => (
              <div key={text}>
                <QrCode size={31} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(types.includes("subscriptions") || types.includes("mobile")) && (
        <div className="preset-student-grid">
          {types.includes("subscriptions") && (
            <div>
              <CreditCard size={21} />
              <span>Подписки</span>
              <strong>498 ₽</strong>
              <span>Оплатить</span>
            </div>
          )}
          {types.includes("mobile") && (
            <div>
              <Smartphone size={21} />
              <span>СберМобайл</span>
              <strong>290 ₽</strong>
              <span>18 из 30 ГБ</span>
              <span>Пополнить</span>
            </div>
          )}
        </div>
      )}
      {!focused && (
        <div className="preset-preview-footer">
          {student
            ? "Кампус, подписки и связь"
            : contrast
              ? "Крупно. Контрастно. Без мелких деталей."
              : "Два виджета. Всё под рукой."}
        </div>
      )}
    </div>
  );
}
