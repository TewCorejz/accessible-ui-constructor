/**
 * Сохранение состояния конструктора в localStorage, чтобы собранный
 * интерфейс и настройки доступности не пропадали после перезагрузки.
 *
 * Данные хранятся только в браузере пользователя. Любая ошибка чтения
 * или записи (приватный режим, переполнение, испорченные данные)
 * не ломает приложение — просто используется состояние по умолчанию.
 */

const STORAGE_KEY = "accessible-ui-constructor:v1";

export type StoredWidget = { id: string; type: string; wide: boolean };
export type StoredConfig = { id: string; name: string; widgets: StoredWidget[]; theme: string };

export type Snapshot = {
  name: string;
  widgets: StoredWidget[];
  theme: string;
  activeId: string | null;
  dirty: boolean;
  saved: StoredConfig[];
  largeText: boolean;
  highContrast: boolean;
};

const THEMES = ["default", "senior", "focus", "contrast", "student"];

function isWidget(value: unknown, types: readonly string[]): value is StoredWidget {
  const w = value as StoredWidget;
  return (
    !!w &&
    typeof w.id === "string" &&
    typeof w.type === "string" &&
    types.includes(w.type) &&
    typeof w.wide === "boolean"
  );
}

function isConfig(value: unknown, types: readonly string[]): value is StoredConfig {
  const c = value as StoredConfig;
  return (
    !!c &&
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    THEMES.includes(c.theme) &&
    Array.isArray(c.widgets) &&
    c.widgets.every((w) => isWidget(w, types))
  );
}

/** Читает сохранённое состояние. Возвращает null, если его нет или оно некорректно. */
export function loadSnapshot(widgetTypes: readonly string[]): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Snapshot;
    if (
      !s ||
      typeof s.name !== "string" ||
      !THEMES.includes(s.theme) ||
      !Array.isArray(s.widgets) ||
      !s.widgets.every((w) => isWidget(w, widgetTypes)) ||
      !Array.isArray(s.saved) ||
      !s.saved.every((c) => isConfig(c, widgetTypes))
    ) {
      return null;
    }
    return {
      name: s.name,
      widgets: s.widgets,
      theme: s.theme,
      activeId: typeof s.activeId === "string" ? s.activeId : null,
      dirty: Boolean(s.dirty),
      saved: s.saved,
      largeText: Boolean(s.largeText),
      highContrast: Boolean(s.highContrast),
    };
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: Snapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Хранилище недоступно — работаем без сохранения.
  }
}

export function clearSnapshot() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Нечего очищать.
  }
}
