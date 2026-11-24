import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { WidgetArrangement } from "./WidgetArrangement";
import { StudentWidget, QuickActions, QrPayment, type StudentWidgetType } from "./StudentWidgets";
import { TemplatePreview } from "./TemplatePreview";
import { LogoMark } from "./Logo";
import { MobileGate } from "./MobileGate";
import { parseFile, serialize, validateConfig } from "./configFormat";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "./storage";
import { AppearancePanel } from "./AppearancePanel";
import {
  DEFAULT_APPEARANCE,
  appearanceProps,
  normalizeAppearance,
  type Appearance,
} from "./appearance";
import {
  Accessibility,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CodeXml,
  CreditCard,
  Download,
  Eye,
  FileCode2,
  FileJson,
  GraduationCap,
  History,
  Landmark,
  Info,
  LayoutGrid,
  Maximize2,
  Monitor,
  Move,
  Plus,
  QrCode,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type WidgetType = "balance" | "qr" | "history" | "quick" | StudentWidgetType;
type Widget = { id: string; type: WidgetType; wide: boolean; column?: 1 | 2 };
type Config = {
  id: string;
  name: string;
  widgets: Widget[];
  theme: string;
  appearance?: Appearance;
};
/** Цвета шаблонов по умолчанию — от них отсчитывается своя палитра. */
const themeColors: Record<string, { primary: string; secondary: string }> = {
  default: { primary: "#157838", secondary: "#ffffff" },
  senior: { primary: "#157838", secondary: "#ffffff" },
  focus: { primary: "#4b4f6b", secondary: "#ffffff" },
  contrast: { primary: "#12150f", secondary: "#ffe784" },
  student: { primary: "#157838", secondary: "#ffffff" },
};
const normalizeColumn = (value: unknown) => (value === 1 || value === 2 ? value : undefined);
type Page = "create" | "select" | "export" | "import";
const catalog = [
  {
    type: "qr" as const,
    title: "Оплата по QR-коду",
    description: "Платежи одним сканированием",
    icon: QrCode,
    color: "green",
  },
  {
    type: "history" as const,
    title: "История переводов",
    description: "Все операции под рукой",
    icon: History,
    color: "blue",
  },
  {
    type: "balance" as const,
    title: "Баланс",
    description: "Средства на ваших счетах",
    icon: Wallet,
    color: "purple",
  },
  {
    type: "quick" as const,
    title: "Быстрая оплата",
    description: "Важные платежи в один шаг",
    icon: Zap,
    color: "orange",
  },
  {
    type: "studentQr" as const,
    title: "Мои QR-коды",
    description: "Пропуск, студенческий и оплата",
    icon: GraduationCap,
    color: "blue",
  },
  {
    type: "subscriptions" as const,
    title: "Подписки",
    description: "Оплата сервисов в одном месте",
    icon: CreditCard,
    color: "purple",
  },
  {
    type: "mobile" as const,
    title: "Мобильная связь",
    description: "Тариф, баланс и пополнение",
    icon: Smartphone,
    color: "green",
  },
];
const startingWidgets: Widget[] = [
  { id: "balance-1", type: "balance", wide: false },
  { id: "qr-1", type: "qr", wide: false },
  { id: "history-1", type: "history", wide: true },
];
const initialConfigs: Config[] = [
  { id: "one", name: "Интерфейс 1", widgets: startingWidgets, theme: "default" },
  {
    id: "two",
    name: "Интерфейс 2",
    widgets: [
      { id: "b2", type: "balance", wide: true },
      { id: "q2", type: "quick", wide: true },
    ],
    theme: "default",
  },
];
const templates = [
  {
    title: "Крупный текст",
    subtitle: "Баланс и быстрая оплата в одной колонке, с крупным текстом и большими кнопками.",
    tag: "Просто и крупно",
    theme: "senior",
    icon: Accessibility,
    types: ["balance", "quick"] as WidgetType[],
    features: ["Основной текст 24 px", "Кнопки от 64 px", "2 виджета в одну колонку"],
  },
  {
    title: "Фокус",
    subtitle: "Начните оплату мобильной связи сразу, без поиска среди других виджетов.",
    tag: "Без отвлечений",
    theme: "focus",
    icon: Sparkles,
    types: ["quick"] as WidgetType[],
    features: ["Один виджет", "Одна основная кнопка", "Без анимаций"],
  },
  {
    title: "Высокий контраст",
    subtitle: "Крупный баланс и оплата по QR-коду в жёлто-чёрной палитре.",
    tag: "Чёткие границы",
    theme: "contrast",
    icon: Eye,
    types: ["balance", "qr"] as WidgetType[],
    features: ["Основной текст 24 px", "Жёлтый / чёрный", "Кнопки от 64 px"],
  },
  {
    title: "Студент",
    subtitle: "Для учёбы и жизни в кампусе: документы, подписки и связь в одном месте.",
    tag: "Кампус под рукой",
    theme: "student",
    icon: GraduationCap,
    types: ["studentQr", "subscriptions", "mobile"] as WidgetType[],
    features: ["3 QR-кода в одном виджете", "Оплата подписок", "Тариф и баланс сим-карты"],
  },
];
const pages = [
  {
    id: "create" as const,
    title: "Создать",
    icon: Plus,
    description: "Соберите удобный интерфейс из виджетов. Всё важное — на своём месте.",
  },
  {
    id: "select" as const,
    title: "Выбрать",
    icon: LayoutGrid,
    description: "Продолжите с сохранённым интерфейсом или выберите готовый шаблон.",
  },
  {
    id: "export" as const,
    title: "Экспорт",
    icon: ArrowDownToLine,
    description: "Сохраните ваш интерфейс в файл, чтобы перенести его на другое устройство.",
  },
  {
    id: "import" as const,
    title: "Импорт",
    icon: ArrowUpFromLine,
    description: "Загрузите сохранённый файл и продолжите настраивать свой интерфейс.",
  },
];

function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Запоминаем, откуда открыли окно (до showModal), и возвращаем туда фокус после закрытия (WCAG 2.4.3).
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="Закрыть" onClick={close}>
          <X size={24} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function MiniPreview({ theme = "default", types }: { theme?: string; types: WidgetType[] }) {
  const template = templates.find((item) => item.theme === theme);
  if (template) return <TemplatePreview theme={theme} title={template.title} types={types} />;
  const quick = types.includes("quick") && !types.includes("history");
  return (
    <div className={`mini-preview ${theme}`} aria-hidden="true">
      <div className="mini-top">
        <span className="mini-logo">
          <Landmark size={10} strokeWidth={2.5} />
        </span>
        <span>Мой банк</span>
        <span className="mini-dots">•••</span>
      </div>
      <div className={`mini-grid ${!types.includes("qr") ? "single-column" : ""}`}>
        {types.includes("balance") && (
          <div className="mini-balance">
            <span>Доступный баланс</span>
            <strong>128 450,00 ₽</strong>
            <small>Дебетовая карта •• 4821</small>
          </div>
        )}
        {types.includes("qr") && (
          <div className="mini-qr">
            <QrCode size={32} />
            <span>Оплата по QR</span>
          </div>
        )}
        {(types.includes("history") || types.includes("quick")) && (
          <div className="mini-bottom">
            <span>{quick ? "Быстрая оплата" : "Последние операции"}</span>
            <div>
              <i />
              <span>{quick ? "Мобильная связь" : "Перевод от Анны"}</span>
              <b>{quick ? "500 ₽" : "+ 5 000 ₽"}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetContent({ type, theme = "default" }: { type: WidgetType; theme?: string }) {
  if (type === "studentQr" || type === "subscriptions" || type === "mobile")
    return <StudentWidget type={type} />;
  if (type === "balance")
    return (
      <>
        <div className="widget-topline">
          <span className="small-icon">
            <Wallet size={19} />
          </span>
          <span>Мой баланс</span>
          <Eye size={19} className="muted" />
        </div>
        <div className="balance-value">
          128 450<span>,00 ₽</span>
        </div>
        <div className="balance-bottom">
          <span>
            <i className="card-chip" /> Дебетовая карта
          </span>
          <span>•• 4821</span>
        </div>
      </>
    );
  if (type === "qr") return <QrPayment />;
  if (type === "quick") return <QuickActions focused={theme === "focus"} />;
  return (
    <>
      <div className="history-heading">
        <History size={21} />
        <h3>История переводов</h3>
        <ChevronRight size={20} />
      </div>
      <div className="transaction">
        <span className="transaction-avatar">
          <ArrowDownToLine size={20} />
        </span>
        <div>
          <strong>Перевод от Анны</strong>
          <span>Сегодня, 10:42</span>
        </div>
        <b>+ 5 000 ₽</b>
      </div>
      <div className="transaction">
        <span className="transaction-avatar neutral">
          <ArrowUpRight size={20} />
        </span>
        <div>
          <strong>Оплата в магазине</strong>
          <span>Сегодня, 09:15</span>
        </div>
        <b className="expense">− 1 250 ₽</b>
      </div>
    </>
  );
}

export default function App() {
  // Состояние из прошлого визита (если есть) — читаем один раз при запуске.
  const [stored] = useState(() => loadSnapshot(catalog.map((item) => item.type)));
  const [page, setPage] = useState<Page>("create");
  const [name, setName] = useState(stored?.name ?? "Мой удобный банк");
  const [widgets, setWidgets] = useState<Widget[]>(
    (stored?.widgets as Widget[] | undefined) ?? startingWidgets,
  );
  const [selected, setSelected] = useState(stored ? (stored.widgets[0]?.id ?? "") : "qr-1");
  const [saved, setSaved] = useState<Config[]>((stored?.saved as Config[] | undefined) ?? initialConfigs);
  const [activeId, setActiveId] = useState<string | null>(stored?.activeId ?? null);
  const [theme, setTheme] = useState(stored?.theme ?? "default");
  const [appearance, setAppearance] = useState<Appearance>(
    normalizeAppearance(stored?.appearance ?? DEFAULT_APPEARANCE),
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const libraryRef = useRef<HTMLElement>(null);
  const [dirty, setDirty] = useState(stored?.dirty ?? true);
  const [editing, setEditing] = useState(true);
  const [modal, setModal] = useState<"access" | "help" | "preview" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [largeText, setLargeText] = useState(stored?.largeText ?? false);
  const [highContrast, setHighContrast] = useState(stored?.highContrast ?? false);
  const [exportId, setExportId] = useState("current");
  const [imported, setImported] = useState<Config | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const currentPage = pages.find((p) => p.id === page)!;
  const visibleCatalog = catalog.filter(
    (item) => theme === "student" || !["studentQr", "subscriptions", "mobile"].includes(item.type),
  );
  useEffect(() => {
    saveSnapshot({
      name,
      widgets,
      theme,
      appearance,
      activeId,
      dirty,
      saved,
      largeText,
      highContrast,
    });
  }, [name, widgets, theme, appearance, activeId, dirty, saved, largeText, highContrast]);
  const workspaceLook = appearanceProps(appearance);
  const changeAppearance = (next: Appearance) => {
    setAppearance(next);
    setDirty(true);
  };
  const openCatalog = () => {
    setCatalogOpen(true);
    // Переводим фокус в открывшуюся панель — важно для клавиатуры и скринридеров.
    requestAnimationFrame(() => {
      libraryRef.current?.focus();
      libraryRef.current?.scrollIntoView({ block: "nearest" });
    });
  };
  const selectedWidget = widgets.find((w) => w.id === selected);
  const placeWidget = (column: 1 | 2) => {
    if (!selectedWidget || selectedWidget.wide) return;
    updateWidgets(widgets.map((w) => (w.id === selected ? { ...w, column } : w)));
    const title = catalog.find((item) => item.type === selectedWidget.type)!.title;
    setNotice(`Виджет «${title}» перемещён ${column === 1 ? "влево" : "вправо"}.`);
  };
  function resetAll() {
    if (!window.confirm("Удалить все сохранённые интерфейсы и настройки и начать заново?")) return;
    clearSnapshot();
    setName("Мой удобный банк");
    setWidgets(startingWidgets);
    setSelected("qr-1");
    setSaved(initialConfigs);
    setActiveId(null);
    setTheme("default");
    setAppearance(DEFAULT_APPEARANCE);
    setDirty(true);
    setLargeText(false);
    setHighContrast(false);
    setExportId("current");
    setPage("create");
    setModal(null);
    setNotice("Всё сброшено. Можно начать с чистого листа.");
  }
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const updateWidgets = (next: Widget[]) => {
    setWidgets(next);
    setDirty(true);
  };
  function addWidget(type: WidgetType) {
    const id = `${type}-${Date.now()}`;
    updateWidgets([...widgets, { id, type, wide: type === "history" }]);
    setSelected(id);
    setNotice("Виджет добавлен в рабочую область");
  }
  function save() {
    if (!name.trim()) {
      setNotice("Введите название интерфейса");
      return;
    }
    const config = {
      id: activeId || `saved-${Date.now()}`,
      name: name.trim(),
      widgets: structuredClone(widgets),
      theme,
      appearance,
    };
    setSaved((prev) =>
      prev.some((c) => c.id === config.id)
        ? prev.map((c) => (c.id === config.id ? config : c))
        : [...prev, config],
    );
    setActiveId(config.id);
    setDirty(false);
    setNotice("Интерфейс сохранён. Он доступен в разделе «Выбрать».");
  }
  function apply(config: Config) {
    setName(config.name);
    setWidgets(structuredClone(config.widgets));
    setTheme(config.theme);
    setAppearance(normalizeAppearance(config.appearance ?? DEFAULT_APPEARANCE));
    setActiveId(saved.some((c) => c.id === config.id) ? config.id : null);
    setSelected(config.widgets[0]?.id || "");
    setDirty(false);
    setPage("create");
    setNotice("Интерфейс применён. Можно настроить его под себя.");
  }
  async function download(format: string) {
    const config =
      exportId === "current"
        ? { name, widgets, theme, appearance }
        : saved.find((c) => c.id === exportId)!;
    const content = await serialize(config, format as "JSON" | "YAML" | "XML");
    const url = URL.createObjectURL(
      new Blob([content], {
        type:
          format === "JSON"
            ? "application/json"
            : format === "XML"
              ? "application/xml"
              : "application/yaml",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-interface.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Интерфейс экспортирован в ${format}`);
  }
  async function readFile(file?: File) {
    if (!file) return;
    setImportError("");
    setImported(null);
    try {
      if (file.size > 2_000_000) throw new Error("Размер файла не должен превышать 2 МБ.");
      const text = await file.text();
      const result = validateConfig(await parseFile(file.name, text));
      if (!result.ok)
        throw new Error(
          `В файле нет корректной конфигурации интерфейса. ${result.errors.slice(0, 3).join(" ")}`,
        );
      const c = result.config;
      setImported({
        id: `import-${Date.now()}`,
        name: c.name,
        theme: c.theme,
        appearance: normalizeAppearance(c.appearance),
        widgets: c.widgets.map((w, i) => ({
          id: `import-widget-${i}`,
          type: w.type,
          wide: w.wide,
          column: normalizeColumn(w.column),
        })),
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Не удалось прочитать файл.");
    }
  }

  return (
    <>
      <div className={`app ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("create");
          }}
          aria-label="Конструктор доступных интерфейсов — главная"
        >
          <LogoMark size={44} />
          <span className="brand-name">
            Конструктор<span>доступных интерфейсов</span>
          </span>
        </a>
        <div className="sidebar-label">ВАШЕ РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav aria-label="Основная навигация">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => setPage(item.id)}
            >
              <item.icon size={23} />
              <span>{item.title}</span>
              {page === item.id && <ChevronRight size={18} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="access-card">
            <span className="access-icon">
              <Accessibility size={25} />
            </span>
            <p className="access-card-title">Удобно каждому</p>
            <p>
              Настройте размер текста
              <br />и контраст под себя.
            </p>
            <button onClick={() => setModal("access")}>
              Настройки доступности <ArrowRight size={17} />
            </button>
          </div>
          <button className="help-button" onClick={() => setModal("help")}>
            <CircleHelp size={21} />
            <span>
              Помощь<span className="help-label-rest"> с конструктором</span>
            </span>
          </button>
          <div className="sidebar-version">
            <span className="local-dot" />
            Работает на вашем устройстве<span>Версия 1.0</span>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-product">
            <Monitor size={19} />
            <span>Личное пространство</span>
            <span className="topbar-divider" />
            <span className="local-tag">
              <span className="local-dot" />
              Локальная версия
            </span>
          </div>
          <button className="access-top" onClick={() => setModal("access")}>
            <Accessibility size={21} />
            <span>Доступность</span>
          </button>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="breadcrumb">
            Конструктор <ChevronRight size={15} />
            <span>{currentPage.title}</span>
          </div>
          <div className="page-heading">
            <div>
              <h1>
                {page === "create"
                  ? "Создать интерфейс"
                  : page === "select"
                    ? "Выбрать интерфейс"
                    : page === "export"
                      ? "Экспорт интерфейса"
                      : "Импорт интерфейса"}
              </h1>
              <p>{currentPage.description}</p>
            </div>
            <span className="page-step">
              0{pages.findIndex((p) => p.id === page) + 1}
              <span> / 04</span>
            </span>
          </div>
          {page === "create" && (
            <>
              <section className="name-panel" aria-labelledby="name-label">
                <div className="name-input-area">
                  <label id="name-label" htmlFor="interface-name">
                    Название интерфейса
                  </label>
                  <div className="name-input-wrap">
                    <LayoutGrid size={21} />
                    <input
                      id="interface-name"
                      value={name}
                      maxLength={80}
                      placeholder="Например, Мой удобный банк"
                      onChange={(e) => {
                        setName(e.target.value);
                        setDirty(true);
                      }}
                    />
                  </div>
                </div>
                <span className={`save-status ${!dirty ? "is-saved" : ""}`}>
                  {dirty ? (
                    <>
                      <span />
                      Есть несохранённые изменения
                    </>
                  ) : (
                    <>
                      <CheckCheck size={18} />
                      Все изменения сохранены
                    </>
                  )}
                </span>
              </section>
              <AppearancePanel
                value={appearance}
                defaults={themeColors[theme] ?? themeColors.default}
                onChange={changeAppearance}
              />
              <div className={`creator-grid ${catalogOpen ? "catalog-open" : "catalog-closed"}`}>
                {catalogOpen && (
                <section
                  className="widget-library"
                  id="widget-library"
                  ref={libraryRef}
                  tabIndex={-1}
                  aria-labelledby="widget-library-title"
                >
                  <div className="section-title">
                    <h2 id="widget-library-title">Добавить виджет</h2>
                    <span className="count-badge">{visibleCatalog.length}</span>
                    <button
                      type="button"
                      className="library-close"
                      onClick={() => setCatalogOpen(false)}
                      aria-label="Скрыть панель «Добавить виджет»"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <p className="section-description">
                    Нажмите на виджет, чтобы
                    <br className="desktop-break" /> добавить его в интерфейс.
                  </p>
                  <div className="catalog">
                    {visibleCatalog.map((w) => (
                      <button
                        className="catalog-card"
                        key={w.type}
                        onClick={() => addWidget(w.type)}
                      >
                        <span className={`catalog-icon ${w.color}`}>
                          <w.icon size={26} strokeWidth={1.8} />
                        </span>
                        <span className="catalog-text">
                          <strong>{w.title}</strong>
                          <span className="visually-hidden">. </span>
                          <span>{w.description}</span>
                        </span>
                        <Plus size={20} className="catalog-plus" />
                      </button>
                    ))}
                  </div>
                  <div className="library-tip">
                    <Info size={19} />
                    <p>
                      Добавляйте только то,
                      <br />
                      чем пользуетесь каждый день.
                    </p>
                  </div>
                </section>
                )}
                <section className="workspace-section">
                  <div className="workspace-heading">
                    <div className="section-title">
                      <h2>Рабочая область</h2>
                      <span className="count-badge">{widgets.length}</span>
                    </div>
                    <button
                      className={`edit-mode ${editing ? "enabled" : ""}`}
                      aria-pressed={editing}
                      onClick={() => setEditing(!editing)}
                    >
                      <span className="mode-dot" />
                      {editing ? "Режим расстановки" : "Режим просмотра"}
                      <Settings2 size={16} />
                    </button>
                  </div>
                  <div
                    className={`workspace ${theme} ${workspaceLook.className}`}
                    style={workspaceLook.style}
                  >
                    <div className="preview-header">
                      <span className="preview-brand">
                        <span className="preview-logo">
                          <Landmark size={13} strokeWidth={2.5} />
                        </span>
                        Мой банк
                      </span>
                      <span>Всё, что нужно, — рядом</span>
                      <ShieldCheck size={19} />
                    </div>
                    <WidgetArrangement
                      widgets={widgets}
                      editing={editing}
                      selected={selected}
                      onSelect={setSelected}
                      onReorder={updateWidgets}
                      columns={theme === "default"}
                      label={(widget) => catalog.find((item) => item.type === widget.type)!.title}
                      renderWidget={(widget) => <WidgetContent type={widget.type} theme={theme} />}
                    >
                      <button
                        className="add-placeholder"
                        onClick={() => (catalogOpen ? setCatalogOpen(false) : openCatalog())}
                        aria-expanded={catalogOpen}
                        aria-controls="widget-library"
                      >
                        {catalogOpen ? <X size={22} /> : <Plus size={22} />}
                        <span>{catalogOpen ? "Скрыть список виджетов" : "Добавить виджет"}</span>
                      </button>
                    </WidgetArrangement>
                    <div className="preview-bottom">
                      <ShieldCheck size={14} />
                      Ваши данные видны только вам
                    </div>
                  </div>
                  <div className="editing-toolbar">
                    <span className="toolbar-label">
                      {editing ? "Действия с виджетом" : "Просмотр интерфейса"}
                    </span>
                    <div>
                      <button
                        disabled={!editing || !widgets.some((w) => w.id === selected)}
                        onClick={() =>
                          updateWidgets(
                            widgets.map((w) =>
                              w.id === selected ? { ...w, wide: !w.wide, column: undefined } : w,
                            ),
                          )
                        }
                      >
                        <Maximize2 size={17} />
                        Изменить размер
                      </button>
                      <button
                        disabled={
                          !editing || widgets.length < 2 || !widgets.some((w) => w.id === selected)
                        }
                        onClick={() => {
                          const next = [...widgets];
                          const i = next.findIndex((w) => w.id === selected);
                          const j = (i + 1) % next.length;
                          [next[i], next[j]] = [next[j], next[i]];
                          updateWidgets(next);
                          const title = catalog.find((item) => item.type === next[j].type)!.title;
                          setNotice(
                            `Виджет «${title}» перемещён на позицию ${j + 1} из ${next.length}.`,
                          );
                        }}
                      >
                        <Move size={17} />
                        Переставить
                      </button>
                      <button
                        className="column-button"
                        disabled={
                          !editing || theme !== "default" || !selectedWidget || selectedWidget.wide
                        }
                        aria-pressed={selectedWidget?.column === 1}
                        onClick={() => placeWidget(1)}
                      >
                        <ArrowLeft size={17} />
                        Влево
                      </button>
                      <button
                        className="column-button"
                        disabled={
                          !editing || theme !== "default" || !selectedWidget || selectedWidget.wide
                        }
                        aria-pressed={selectedWidget?.column === 2}
                        onClick={() => placeWidget(2)}
                      >
                        Вправо
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="danger"
                        disabled={!editing || !widgets.some((w) => w.id === selected)}
                        onClick={() => {
                          updateWidgets(widgets.filter((w) => w.id !== selected));
                          setSelected("");
                        }}
                      >
                        <Trash2 size={17} />
                        Удалить
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              <div className="save-bar">
                <span>
                  <Info size={18} />
                  Вы всегда сможете изменить интерфейс позже
                </span>
                <div>
                  <button className="button secondary" onClick={() => setModal("preview")}>
                    <Eye size={20} />
                    Предпросмотр
                  </button>
                  <button className="button primary" onClick={save}>
                    <Check size={21} />
                    Сохранить
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "select" && (
            <div className="selector">
              <div className="section-title">
                <h2>Сохранённые интерфейсы</h2>
                <span className="count-badge">{saved.length}</span>
                <span className="section-note">Всегда под рукой</span>
              </div>
              <div className="saved-grid">
                {saved.map((c) => (
                  <article className="saved-card" key={c.id}>
                    <MiniPreview theme={c.theme} types={c.widgets.map((w) => w.type)} />
                    <div className="saved-card-body">
                      <div className="saved-card-title">
                        <h3>{c.name}</h3>
                        {activeId === c.id && (
                          <span className="applied-tag">
                            <Check size={14} />
                            Выбран
                          </span>
                        )}
                      </div>
                      <p>Виджетов: {c.widgets.length} · Сохранён на этом устройстве</p>
                      <div className="card-actions">
                        <button className="button primary" onClick={() => apply(c)}>
                          <Check size={19} />
                          ОК · Применить
                        </button>
                        <button
                          className="button secondary danger"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 size={18} />
                          Удалить
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                <button
                  className="new-interface"
                  onClick={() => {
                    setName("Новый интерфейс");
                    setWidgets([]);
                    setActiveId(null);
                    setTheme("default");
                    setAppearance(DEFAULT_APPEARANCE);
                    setDirty(true);
                    setPage("create");
                  }}
                >
                  <span>
                    <Plus size={28} />
                  </span>
                  <strong>Новый интерфейс</strong>
                  <span>Соберите свой с чистого листа</span>
                </button>
              </div>
              <div className="templates-heading">
                <div>
                  <h2>
                    <button
                      type="button"
                      className="templates-toggle"
                      aria-expanded={templatesOpen}
                      aria-controls="template-list"
                      onClick={() => setTemplatesOpen(!templatesOpen)}
                    >
                      Шаблоны
                      <span className="visually-hidden">, </span>
                      <span className="count-badge">{templates.length}</span>
                      <ChevronDown size={22} aria-hidden="true" />
                    </button>
                  </h2>
                  <p>Продуманные решения для разных потребностей. Выберите и настройте под себя.</p>
                </div>
                <span className="template-label">
                  <Sparkles size={17} />
                  Забота в каждой детали
                </span>
              </div>
              {templatesOpen && (
              <div className="template-grid" id="template-list">
                {templates.map((t) => (
                  <article
                    className={`template-card template-${t.theme} ${templatePreview === t.theme ? "with-preview" : "no-preview"}`}
                    key={t.theme}
                  >
                    {templatePreview === t.theme && (
                      <div id={`template-preview-${t.theme}`}>
                        <MiniPreview theme={t.theme} types={t.types} />
                      </div>
                    )}
                    <div className="template-body">
                      <span className={`template-tag ${t.theme}`}>
                        <t.icon size={15} />
                        {t.tag}
                      </span>
                      <h3>{t.title}</h3>
                      <p>{t.subtitle}</p>
                      <ul className="template-features" aria-label="Особенности шаблона">
                        {t.features.map((feature) => (
                          <li key={feature}>
                            <Check size={16} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {t.theme === "student" && (
                        <p className="template-proposal">Предлагаемый состав · для согласования</p>
                      )}
                      <button
                        type="button"
                        className="template-preview-toggle"
                        aria-expanded={templatePreview === t.theme}
                        aria-controls={`template-preview-${t.theme}`}
                        onClick={() =>
                          setTemplatePreview(templatePreview === t.theme ? null : t.theme)
                        }
                      >
                        <Eye size={17} aria-hidden="true" />
                        {templatePreview === t.theme ? "Скрыть превью" : "Показать превью"}
                      </button>
                      <button
                        className="button secondary"
                        aria-label={`Выбрать шаблон «${t.title}»`}
                        onClick={() =>
                          apply({
                            id: `template-${t.theme}`,
                            name: t.title,
                            theme: t.theme,
                            widgets: t.types.map((type, i) => ({
                              type,
                              id: `${t.theme}-${i}`,
                              wide: t.theme !== "student" || type === "studentQr",
                            })),
                          })
                        }
                      >
                        Выбрать шаблон
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              )}
              <div className="inline-note">
                <ShieldCheck size={21} />
                <span>
                  Сохранённые интерфейсы хранятся только в этом браузере. Чтобы перенести их на
                  другое устройство, воспользуйтесь разделом «Экспорт».
                </span>
              </div>
            </div>
          )}
          {page === "export" && (
            <div className="export-view">
              <section className="export-config">
                <span className="export-config-icon">
                  <LayoutGrid size={28} />
                </span>
                <div>
                  <label htmlFor="export-interface">Какой интерфейс экспортировать?</label>
                  <div className="select-wrap">
                    <select
                      id="export-interface"
                      value={exportId}
                      onChange={(e) => setExportId(e.target.value)}
                    >
                      <option value="current">{name} — текущий интерфейс</option>
                      {saved.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={19} />
                  </div>
                </div>
                <span className="export-config-badge">
                  <CircleCheck size={17} />
                  Готов к экспорту
                </span>
              </section>
              <div className="format-heading">
                <h2>Выберите формат файла</h2>
                <p>Все форматы сохраняют виджеты, их расположение и настройки доступности.</p>
              </div>
              <div className="format-grid">
                {[
                  {
                    name: "XML",
                    icon: CodeXml,
                    color: "green",
                    description: "Универсальный формат для обмена данными между системами.",
                    extension: ".xml",
                  },
                  {
                    name: "JSON",
                    icon: FileJson,
                    color: "blue",
                    description: "Компактный формат для интеграций и работы с приложениями.",
                    extension: ".json",
                  },
                  {
                    name: "YAML",
                    icon: FileCode2,
                    color: "purple",
                    description: "Простой и читаемый формат для хранения настроек.",
                    extension: ".yaml",
                  },
                ].map((f) => (
                  <article className="format-card" key={f.name}>
                    <span className={`file-icon ${f.color}`}>
                      <f.icon size={38} strokeWidth={1.5} />
                    </span>
                    <span className="file-extension">{f.extension}</span>
                    <h3>{f.name}</h3>
                    <p>{f.description}</p>
                    <div className="format-details">
                      <Check size={17} />
                      Полная конфигурация
                    </div>
                    <button className="button secondary" onClick={() => download(f.name)}>
                      <Download size={20} />
                      Скачать {f.name}
                    </button>
                  </article>
                ))}
              </div>
              <div className="export-info">
                <ShieldCheck size={25} />
                <div>
                  <h3>Ваш интерфейс остаётся только у вас</h3>
                  <p>
                    Файл содержит настройки, но не включает баланс, историю переводов или другие
                    банковские данные. Экспорт работает без подключения к интернету.
                  </p>
                </div>
              </div>
              <button className="text-link" onClick={() => setPage("create")}>
                <ArrowLeft size={18} />
                Вернуться к редактированию
              </button>
            </div>
          )}
          {page === "import" && (
            <div className="import-view">
              <div
                className="import-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void readFile(e.dataTransfer.files[0]);
                }}
              >
                <span className="import-symbol">
                  <ArrowUpFromLine size={38} />
                </span>
                <h2>Перенесите свой интерфейс</h2>
                <p>Перетащите файл сюда или выберите его на устройстве</p>
                <button className="button primary" onClick={() => fileRef.current?.click()}>
                  <Plus size={20} />
                  Выбрать файл
                </button>
                <span className="import-formats">XML, JSON или YAML · до 2 МБ</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml,.json,.yaml,.yml"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => {
                    void readFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              {importError && (
                <p className="error-message" role="alert">
                  {importError}
                </p>
              )}
              {imported && (
                <div className="import-result">
                  <CircleCheck size={27} />
                  <div>
                    <h3>{imported.name}</h3>
                    <p>Файл проверен · Виджетов: {imported.widgets.length}</p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => {
                      apply(imported);
                      setImported(null);
                    }}
                  >
                    Применить
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              <div className="inline-note">
                <Info size={21} />
                <span>Текущий интерфейс не изменится, пока вы не нажмёте «Применить».</span>
              </div>
            </div>
          )}
          <footer className="main-footer">
            <span>Конструктор доступных интерфейсов</span>
            <span>
              <ShieldCheck size={15} />
              Просто. Понятно. По-вашему.
            </span>
          </footer>
        </main>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
      {notice && (
        <div className="toast">
          <CircleCheck size={22} />
          <span>{notice}</span>
          <button
            className="icon-button"
            onClick={() => setNotice("")}
            aria-label="Закрыть уведомление"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {modal === "access" && (
        <Modal title="Настройки доступности" close={() => setModal(null)}>
          <p className="modal-description">Сделайте конструктор удобнее для себя.</p>
          <label className="setting-row">
            <span>
              <strong>Крупный текст</strong>
              <small>Увеличить размер текста и элементов</small>
            </span>
            <input
              type="checkbox"
              checked={largeText}
              onChange={(e) => setLargeText(e.target.checked)}
            />
          </label>
          <label className="setting-row">
            <span>
              <strong>Высокий контраст</strong>
              <small>Более чёткие границы и тёмный текст</small>
            </span>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
          </label>
          <div className="inline-note">
            <Info size={20} />
            <span>Все действия доступны с клавиатуры: используйте Tab и Enter.</span>
          </div>
          <button className="button primary modal-done" onClick={() => setModal(null)}>
            <Check size={19} />
            Готово
          </button>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Ваш банк — по вашим правилам" close={() => setModal(null)}>
          <p className="modal-description">Четыре простых шага к удобному интерфейсу.</p>
          <ol className="help-steps">
            {[
              {
                title: "Дайте интерфейсу название",
                text: "Так его будет легко найти среди сохранённых.",
              },
              {
                title: "Добавьте нужные виджеты",
                text: "Нажмите на карточку слева. Виджет появится в рабочей области.",
              },
              {
                title: "Расставьте всё по местам",
                text: "Перетащите виджет за кнопку с точками или используйте «Переставить». С клавиатуры: Пробел на точках, стрелки вверх/вниз — позиция, влево/вправо — колонка, Пробел для подтверждения, Escape для отмены.",
              },
              {
                title: "Сохраните результат",
                text: "Он появится в разделе «Выбрать» и останется в этом браузере после перезагрузки. Чтобы перенести интерфейс на другое устройство, скачайте файл в разделе «Экспорт».",
              },
            ].map((s, i) => (
              <li key={s.title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="help-actions">
            <button className="button secondary" onClick={resetAll}>
              <Trash2 size={18} />
              Начать заново
            </button>
            <button className="button primary modal-done" onClick={() => setModal(null)}>
              Всё понятно
              <Check size={19} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "preview" && (
        <Modal title={name || "Предпросмотр интерфейса"} close={() => setModal(null)}>
          <p className="modal-description">
            Так будет выглядеть ваш интерфейс без элементов редактирования. Финансовые данные
            демонстрационные.
          </p>
          <div
            className={`live-preview workspace ${theme} ${workspaceLook.className}`}
            style={workspaceLook.style}
          >
            <div className="preview-header">
              <span className="preview-brand">
                <span className="preview-logo">
                  <Landmark size={13} strokeWidth={2.5} />
                </span>
                Мой банк
              </span>
              <ShieldCheck size={20} />
            </div>
            <div className="widget-grid">
              {widgets.map((w) => (
                <div
                  className={`workspace-widget ${w.type} ${w.wide ? "wide" : ""} ${!w.wide && w.column && theme === "default" ? `col-${w.column}` : ""}`}
                  key={w.id}
                >
                  <WidgetContent type={w.type} theme={theme} />
                </div>
              ))}
            </div>
            {!widgets.length && (
              <p className="modal-description">Добавьте виджеты, чтобы увидеть предпросмотр.</p>
            )}
          </div>
          <button className="button primary modal-done" onClick={() => setModal(null)}>
            Вернуться к редактированию
          </button>
        </Modal>
      )}
      {deleteId && (
        <Modal title="Удалить интерфейс?" close={() => setDeleteId(null)}>
          <p className="modal-description">
            «{saved.find((c) => c.id === deleteId)?.name}» будет удалён из сохранённых интерфейсов.
            Это действие нельзя отменить.
          </p>
          <div className="confirm-actions">
            <button className="button secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </button>
            <button
              className="button delete-button"
              onClick={() => {
                setSaved(saved.filter((c) => c.id !== deleteId));
                if (activeId === deleteId) setActiveId(null);
                if (exportId === deleteId) setExportId("current");
                setDeleteId(null);
                setNotice("Интерфейс удалён");
              }}
            >
              <Trash2 size={18} />
              Удалить
            </button>
          </div>
        </Modal>
      )}
      </div>
      <MobileGate />
    </>
  );
}
