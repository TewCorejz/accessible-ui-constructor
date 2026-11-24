import { useId } from "react";
import { Check, CircleAlert, CircleCheck, Palette, RotateCcw, Type } from "lucide-react";
import {
  BASE_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  PRIMARY_PRESETS,
  SECONDARY_PRESETS,
  contrastRatio,
  type Appearance,
} from "./appearance";

type Props = {
  value: Appearance;
  /** Цвета шаблона, которые действуют, пока пользователь не выбрал свои. */
  defaults: { primary: string; secondary: string };
  onChange: (next: Appearance) => void;
};

function ColorRow({
  label,
  hint,
  presets,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  presets: { name: string; value: string }[];
  value: string | null;
  fallback: string;
  onChange: (color: string | null) => void;
}) {
  const id = useId();
  const current = value ?? fallback;
  return (
    <fieldset className="appearance-colors">
      <legend>{label}</legend>
      <p className="appearance-hint" id={`${id}-hint`}>
        {hint}
      </p>
      <div className="swatches" role="group" aria-describedby={`${id}-hint`}>
        {presets.map((p) => {
          const active = current.toLowerCase() === p.value;
          return (
            <button
              key={p.value}
              type="button"
              className={`swatch ${active ? "active" : ""}`}
              style={{ background: p.value }}
              aria-pressed={active}
              title={p.name}
              onClick={() => onChange(p.value)}
            >
              {active && <Check size={16} aria-hidden="true" />}
            </button>
          );
        })}
        <label className="swatch-custom">
          <input
            type="color"
            value={current}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
          />
          <span>
            Свой цвет<span className="visually-hidden"> — {label.toLowerCase()}</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}

export function AppearancePanel({ value, defaults, onChange }: Props) {
  const sliderId = useId();
  const primary = value.primary ?? defaults.primary;
  const secondary = value.secondary ?? defaults.secondary;
  const ratio = contrastRatio(primary, secondary);
  const good = ratio >= 3;
  const changed =
    value.fontSize !== BASE_FONT_SIZE || value.primary !== null || value.secondary !== null;

  return (
    <section className="appearance-panel" aria-labelledby={`${sliderId}-title`}>
      <div className="appearance-heading">
        <h2 id={`${sliderId}-title`}>
          <Palette size={20} aria-hidden="true" />
          Оформление и доступность
        </h2>
        <button
          type="button"
          className="appearance-reset"
          disabled={!changed}
          onClick={() => onChange({ fontSize: BASE_FONT_SIZE, primary: null, secondary: null })}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Сбросить
        </button>
      </div>

      <div className="appearance-grid">
        <div className="appearance-size">
          <label htmlFor={sliderId}>
            <Type size={18} aria-hidden="true" />
            Размер основного текста
          </label>
          <div className="size-control">
            <span aria-hidden="true" className="size-a small">
              А
            </span>
            <input
              id={sliderId}
              type="range"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              value={value.fontSize}
              aria-valuetext={`${value.fontSize} пикселей`}
              onChange={(e) => onChange({ ...value, fontSize: Number(e.target.value) })}
            />
            <span aria-hidden="true" className="size-a large">
              А
            </span>
            <output htmlFor={sliderId} className="size-value">
              {value.fontSize} px
            </output>
          </div>
          <p className="appearance-hint">
            От {MIN_FONT_SIZE} до {MAX_FONT_SIZE} px. Виджеты увеличиваются вместе с текстом.
          </p>
        </div>

        <ColorRow
          label="Основной цвет"
          hint="Кнопки, иконки и акценты в виджетах."
          presets={PRIMARY_PRESETS}
          value={value.primary}
          fallback={defaults.primary}
          onChange={(primary) => onChange({ ...value, primary })}
        />
        <ColorRow
          label="Дополнительный цвет"
          hint="Фон виджетов. Цвет текста подбирается автоматически."
          presets={SECONDARY_PRESETS}
          value={value.secondary}
          fallback={defaults.secondary}
          onChange={(secondary) => onChange({ ...value, secondary })}
        />
      </div>

      <p className={`contrast-status ${good ? "good" : "low"}`} role="status">
        {good ? (
          <CircleCheck size={18} aria-hidden="true" />
        ) : (
          <CircleAlert size={18} aria-hidden="true" />
        )}
        Контраст основного и дополнительного цвета {ratio.toFixed(1)}:1 —{" "}
        {good
          ? "кнопки хорошо видны на фоне."
          : "низкий: кнопки и иконки могут сливаться с фоном. Выберите цвета контрастнее."}
      </p>
    </section>
  );
}
