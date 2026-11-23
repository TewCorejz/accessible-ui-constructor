/**
 * Формат файла конфигурации интерфейса (экспорт и импорт).
 * Описание полей — schema/interface-config.schema.json и docs/config-format.md.
 * Проверка ниже повторяет схему, чтобы не тащить в приложение валидатор JSON Schema.
 */
import { MAX_FONT_SIZE, MIN_FONT_SIZE, isHexColor, type Appearance } from "./appearance";

export const FORMAT_VERSION = 1;
export const SCHEMA_URL =
  "https://raw.githubusercontent.com/TewCorejz/accessible-ui-constructor/main/schema/interface-config.schema.json";

export const THEMES = ["default", "senior", "focus", "contrast", "student"] as const;
export const WIDGET_TYPES = [
  "balance",
  "qr",
  "history",
  "quick",
  "studentQr",
  "subscriptions",
  "mobile",
] as const;

export type ConfigWidget = {
  id: string;
  type: (typeof WIDGET_TYPES)[number];
  wide: boolean;
  column?: 1 | 2;
};
export type InterfaceConfig = {
  formatVersion: typeof FORMAT_VERSION;
  name: string;
  theme: (typeof THEMES)[number];
  appearance?: Appearance;
  widgets: ConfigWidget[];
};

type Source = {
  name: string;
  theme: string;
  appearance?: Appearance;
  widgets: { id: string; type: string; wide: boolean; column?: 1 | 2 }[];
};

/** Объект для экспорта — ровно те поля, что описаны в схеме. */
export function toExportObject(config: Source) {
  return {
    $schema: SCHEMA_URL,
    formatVersion: FORMAT_VERSION,
    name: config.name,
    theme: config.theme,
    ...(config.appearance ? { appearance: config.appearance } : {}),
    widgets: config.widgets.map((w) => ({
      id: w.id,
      type: w.type,
      wide: w.wide,
      ...(!w.wide && w.column ? { column: w.column } : {}),
    })),
  };
}

const escapeXml = (text: string) =>
  text.replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );

export async function serialize(config: Source, format: "JSON" | "YAML" | "XML") {
  const data = toExportObject(config);
  if (format === "JSON") return JSON.stringify(data, null, 2);
  if (format === "YAML") return (await import("yaml")).stringify(data);
  const a = data.appearance;
  const appearance = a
    ? `  <appearance fontSize="${a.fontSize}"${a.primary ? ` primary="${a.primary}"` : ""}${a.secondary ? ` secondary="${a.secondary}"` : ""} />\n`
    : "";
  const widgets = data.widgets
    .map(
      (w) =>
        `    <widget id="${escapeXml(w.id)}" type="${w.type}" wide="${w.wide}"${"column" in w ? ` column="${w.column}"` : ""} />`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<interface formatVersion="${FORMAT_VERSION}">
  <name>${escapeXml(data.name)}</name>
  <theme>${data.theme}</theme>
${appearance}  <widgets>
${widgets}
  </widgets>
</interface>
`;
}

/** Читает JSON, YAML или XML в обычный объект (без проверки). */
export async function parseFile(fileName: string, text: string): Promise<unknown> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xml")) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Некорректный XML-файл.");
    const root = doc.querySelector("interface");
    if (!root) throw new Error("В XML-файле нет элемента <interface>.");
    const a = root.querySelector("appearance");
    const version = root.getAttribute("formatVersion");
    return {
      ...(version !== null ? { formatVersion: Number(version) } : {}),
      name: root.querySelector("name")?.textContent ?? undefined,
      theme: root.querySelector("theme")?.textContent ?? undefined,
      ...(a
        ? {
            appearance: {
              fontSize: Number(a.getAttribute("fontSize")),
              primary: a.getAttribute("primary"),
              secondary: a.getAttribute("secondary"),
            },
          }
        : {}),
      widgets: [...root.querySelectorAll("widget")].map((w) => ({
        id: w.getAttribute("id"),
        type: w.getAttribute("type"),
        wide: w.getAttribute("wide") === "true",
        ...(w.hasAttribute("column") ? { column: Number(w.getAttribute("column")) } : {}),
      })),
    };
  }
  if (lower.endsWith(".json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Некорректный JSON-файл.");
    }
  }
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    try {
      return (await import("yaml")).parse(text);
    } catch {
      throw new Error("Некорректный YAML-файл.");
    }
  }
  throw new Error("Поддерживаются файлы .json, .yaml и .xml.");
}

export type ValidationResult =
  | { ok: true; config: InterfaceConfig }
  | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Проверяет данные по схеме формата. Файлы без formatVersion (сделанные до
 * появления версии) считаются версией 1.
 */
export function validateConfig(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(data)) return { ok: false, errors: ["Файл не содержит конфигурацию интерфейса."] };

  const version = data.formatVersion ?? FORMAT_VERSION;
  if (version !== FORMAT_VERSION) {
    errors.push(
      typeof version === "number" && version > FORMAT_VERSION
        ? `Файл создан более новой версией конструктора (формат ${version}). Обновите приложение.`
        : `Неизвестная версия формата: ${String(version)}.`,
    );
  }

  const name = data.name;
  if (typeof name !== "string" || !name.trim()) errors.push("Не указано название интерфейса.");
  else if (name.length > 80) errors.push("Название длиннее 80 символов.");

  const theme = data.theme ?? "default";
  if (!THEMES.includes(theme as InterfaceConfig["theme"]))
    errors.push(`Неизвестный шаблон «${String(theme)}».`);

  let appearance: Appearance | undefined;
  if (data.appearance !== undefined && data.appearance !== null) {
    const a = data.appearance;
    if (!isObject(a)) errors.push("Блок оформления (appearance) повреждён.");
    else {
      const size = a.fontSize;
      if (!Number.isInteger(size) || (size as number) < MIN_FONT_SIZE || (size as number) > MAX_FONT_SIZE)
        errors.push(`Размер текста должен быть целым числом от ${MIN_FONT_SIZE} до ${MAX_FONT_SIZE}.`);
      for (const key of ["primary", "secondary"] as const) {
        const v = a[key];
        if (v !== undefined && v !== null && !isHexColor(v))
          errors.push(`Цвет ${key} должен быть в формате #RRGGBB.`);
      }
      appearance = {
        fontSize: size as number,
        primary: isHexColor(a.primary) ? a.primary.toLowerCase() : null,
        secondary: isHexColor(a.secondary) ? a.secondary.toLowerCase() : null,
      };
    }
  }

  const widgets: ConfigWidget[] = [];
  if (!Array.isArray(data.widgets)) errors.push("Нет списка виджетов (widgets).");
  else if (data.widgets.length > 30) errors.push("Виджетов больше 30.");
  else
    data.widgets.forEach((raw, i) => {
      const n = i + 1;
      if (!isObject(raw)) return errors.push(`Виджет ${n} повреждён.`);
      if (!WIDGET_TYPES.includes(raw.type as ConfigWidget["type"]))
        return errors.push(`Виджет ${n}: неизвестный тип «${String(raw.type)}».`);
      if (typeof raw.wide !== "boolean") return errors.push(`Виджет ${n}: не указана ширина (wide).`);
      if (raw.column !== undefined && raw.column !== 1 && raw.column !== 2)
        return errors.push(`Виджет ${n}: колонка должна быть 1 или 2.`);
      widgets.push({
        id: typeof raw.id === "string" && raw.id ? raw.id : `widget-${n}`,
        type: raw.type as ConfigWidget["type"],
        wide: raw.wide,
        ...(raw.column && !raw.wide ? { column: raw.column as 1 | 2 } : {}),
      });
    });

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    config: {
      formatVersion: FORMAT_VERSION,
      name: (name as string).trim().slice(0, 80),
      theme: theme as InterfaceConfig["theme"],
      ...(appearance ? { appearance } : {}),
      widgets,
    },
  };
}
