import { useEffect, useId, useRef, useState } from "react";
import { Check, CreditCard, GraduationCap, QrCode, Smartphone, Ticket, Wifi } from "lucide-react";

export type StudentWidgetType = "studentQr" | "subscriptions" | "mobile";
const money = (amount: number) => new Intl.NumberFormat("ru-RU").format(amount);

function StudentQr() {
  const [tab, setTab] = useState(0);
  const prefix = useId();
  const tabs = [
    {
      title: "Пропуск",
      icon: Ticket,
      heading: "Пропуск в кампус",
      detail: "Учебный корпус № 2 · Действует до 31.08.2026",
    },
    {
      title: "Студенческий",
      icon: GraduationCap,
      heading: "Студенческий билет",
      detail: "Анастасия Соколова · № 24-0816",
    },
    {
      title: "Оплата",
      icon: CreditCard,
      heading: "QR-код для оплаты",
      detail: "Демонстрация оплаты в столовой и на кампусе",
    },
  ];
  return (
    <div className="student-widget-content">
      <div className="student-widget-heading">
        <QrCode size={22} />
        <h3>Мои QR-коды</h3>
      </div>
      <div className="student-qr-tabs" role="tablist" aria-label="Тип QR-кода">
        {tabs.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            id={`${prefix}-tab-${index}`}
            aria-selected={tab === index}
            aria-controls={`${prefix}-panel`}
            tabIndex={tab === index ? 0 : -1}
            onClick={() => setTab(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              event.stopPropagation();
              setTab(next);
              document.getElementById(`${prefix}-tab-${next}`)?.focus();
            }}
          >
            <item.icon size={18} />
            {item.title}
          </button>
        ))}
      </div>
      <div
        className="student-qr-panel"
        id={`${prefix}-panel`}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`${prefix}-tab-${tab}`}
      >
        <div className="student-demo-code">
          <QrCode size={104} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h4>{tabs[tab].heading}</h4>
        <p>{tabs[tab].detail}</p>
        <span className="bank-demo-label">Демонстрационный код · не для использования</span>
      </div>
    </div>
  );
}

function Subscriptions() {
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (paid) statusRef.current?.focus();
    else if (confirming) confirmRef.current?.focus();
    else if (opened.current) actionRef.current?.focus();
    if (confirming) opened.current = true;
  }, [confirming, paid]);
  return (
    <div className="student-widget-content">
      <div className="student-widget-heading">
        <CreditCard size={22} />
        <h3>Подписки</h3>
      </div>
      <p className="student-widget-description">Всё для учёбы и отдыха</p>
      <ul className="subscription-list">
        <li>
          <span className="subscription-avatar">М</span>
          <div>
            <strong>Музыка</strong>
            <span>Студенческая подписка</span>
          </div>
          <b>
            199 ₽<small>/ мес.</small>
          </b>
        </li>
        <li>
          <span className="subscription-avatar cloud">
            <Wifi size={21} />
          </span>
          <div>
            <strong>Облако 200 ГБ</strong>
            <span>Для конспектов и проектов</span>
          </div>
          <b>
            299 ₽<small>/ мес.</small>
          </b>
        </li>
      </ul>
      <div className="student-total">
        <span>К оплате в этом месяце</span>
        <strong>{paid ? "0" : "498"} ₽</strong>
      </div>
      {paid ? (
        <p className="bank-inline-status" role="status" tabIndex={-1} ref={statusRef}>
          <Check size={20} />
          Оплачено в демоверсии. Реальных списаний нет.
        </p>
      ) : confirming ? (
        <div className="bank-confirm-panel" role="group" aria-label="Подтверждение оплаты подписок">
          <p>Демонстрация оплаты 498 ₽. Средства не будут списаны.</p>
          <button
            ref={confirmRef}
            className="bank-action"
            onClick={() => {
              setPaid(true);
              setConfirming(false);
            }}
          >
            Подтвердить в демоверсии
          </button>
          <button className="bank-text-button" onClick={() => setConfirming(false)}>
            Отмена
          </button>
        </div>
      ) : (
        <button ref={actionRef} className="bank-action" onClick={() => setConfirming(true)}>
          Оплатить подписки · 498 ₽
        </button>
      )}
      <span className="bank-demo-label">Демонстрационные подписки</span>
    </div>
  );
}

function Mobile() {
  const [balance, setBalance] = useState(290);
  const [topUp, setTopUp] = useState(false);
  const [amount, setAmount] = useState("500");
  const [message, setMessage] = useState("");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (topUp) inputRef.current?.focus();
    else if (opened.current) buttonRef.current?.focus();
    if (topUp) opened.current = true;
  }, [topUp]);
  return (
    <div className="student-widget-content">
      <div className="student-widget-heading">
        <Smartphone size={22} />
        <h3>Мобильная связь</h3>
      </div>
      <p className="student-widget-description">СберМобайл · +7 999 123-45-67</p>
      <div className="sim-balance">
        <span>Баланс сим-карты</span>
        <strong>{money(balance)} ₽</strong>
      </div>
      <div className="sim-plan">
        <div>
          <strong>Тариф «Студенческий»</strong>
          <span>350 ₽ / месяц</span>
        </div>
        <div>
          <span>Интернет</span>
          <b>18 из 30 ГБ</b>
        </div>
        <div>
          <span>Звонки</span>
          <b>240 из 500 мин.</b>
        </div>
      </div>
      {topUp ? (
        <form
          className="bank-confirm-panel"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(amount);
            if (!Number.isInteger(value) || value < 100 || value > 5000) return;
            setBalance((current) => current + value);
            setTopUp(false);
            setMessage(
              `Демонстрационный баланс пополнен на ${money(value)} ₽. Реальных списаний нет.`,
            );
          }}
        >
          <label htmlFor={id}>Сумма пополнения, ₽</label>
          <input
            ref={inputRef}
            id={id}
            type="number"
            inputMode="numeric"
            min={100}
            max={5000}
            step={1}
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <p>От 100 до 5 000 ₽. Пополнение только в демоверсии.</p>
          <button className="bank-action" type="submit">
            Пополнить в демоверсии
          </button>
          <button className="bank-text-button" type="button" onClick={() => setTopUp(false)}>
            Отмена
          </button>
        </form>
      ) : (
        <button
          ref={buttonRef}
          className="bank-action"
          onClick={() => {
            setTopUp(true);
            setMessage("");
          }}
        >
          Пополнить баланс
        </button>
      )}
      {message && (
        <p className="bank-inline-status" role="status">
          {message}
        </p>
      )}
      <span className="bank-demo-label">Демонстрационный номер и тариф</span>
    </div>
  );
}

export function StudentWidget({ type }: { type: StudentWidgetType }) {
  if (type === "studentQr") return <StudentQr />;
  if (type === "subscriptions") return <Subscriptions />;
  return <Mobile />;
}

export function QuickActions({ focused }: { focused: boolean }) {
  const [service, setService] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const sourceRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (service) confirmRef.current?.focus();
    else sourceRef.current?.focus();
  }, [service]);
  useEffect(() => {
    if (paid) closeRef.current?.focus();
  }, [paid]);
  return (
    <>
      <div className="history-heading">
        <CreditCard size={22} />
        <h3>{focused ? "Оплата мобильной связи" : "Быстрая оплата"}</h3>
      </div>
      <div className="quick-options">
        {(focused ? ["Мобильная связь"] : ["Мобильная связь", "Услуги ЖКХ"]).map((title, index) => (
          <button
            key={title}
            className="quick-service-button"
            onClick={(event) => {
              sourceRef.current = event.currentTarget;
              setService(title);
              setPaid(false);
            }}
          >
            {index === 0 ? <Smartphone /> : <CreditCard />}
            {focused ? "Перейти к оплате" : title}
          </button>
        ))}
      </div>
      {service && (
        <div className="bank-confirm-panel" role="group" aria-label={service}>
          <p role={paid ? "status" : undefined}>
            {paid
              ? `${service}: демонстрационная оплата выполнена. Реальных списаний нет.`
              : `${service}. Демонстрация оплаты ${service === "Мобильная связь" ? "500" : "2 450"} ₽ без списания средств.`}
          </p>
          {!paid && (
            <button ref={confirmRef} className="bank-action" onClick={() => setPaid(true)}>
              Подтвердить в демоверсии
            </button>
          )}
          <button ref={closeRef} className="bank-text-button" onClick={() => setService(null)}>
            Закрыть
          </button>
        </div>
      )}
    </>
  );
}

export function QrPayment() {
  const [open, setOpen] = useState(false);
  return (
    <div className="qr-content">
      <span className="qr-symbol">
        <QrCode size={43} strokeWidth={1.8} />
      </span>
      <h3>Оплата по QR-коду</h3>
      <p>Оплата без ввода реквизитов</p>
      <button className="bank-action" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Скрыть QR-код" : "Показать QR-код"}
      </button>
      {open && (
        <div className="bank-qr-expanded">
          <QrCode size={124} aria-hidden="true" />
          <p role="status">Демонстрационный код. Не используйте для оплаты.</p>
        </div>
      )}
    </div>
  );
}
