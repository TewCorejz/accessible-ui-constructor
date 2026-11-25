// Генерирует src/theme-dark.css из src/index.css.
// Каждый цвет переводится в тёмную тему: яркость переворачивается, оттенок сохраняется.
// Почти белые поверхности остаются чуть светлее фона — карточки «приподняты», как в макете.
// Запуск: pnpm theme:dark (после изменения цветов в index.css).
import fs from "node:fs";
import postcss from "postcss";

const SRC = "src/index.css";
const OUT = "src/theme-dark.css";
const PREFIX = 'html[data-theme="dark"]';

// Не перекрашиваем: жёлто-чёрный шаблон и режим высокого контраста (у них свои цвета),
// образцы цветов (показывают настоящий цвет) и заглушку для телефонов.
const SKIP = /contrast|::backdrop|\.swatch(?![\w-])|mobile-gate|forced-colors/;
const COLOR_PROPS = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left)(-color)?|border-color|outline|outline-color|fill|stroke|accent-color|caret-color|text-decoration-color|--[\w-]+)$/;

const hex = /#([0-9a-f]{3,8})\b/gi;
const rgbFn = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[\/,]\s*([\d.]+%?))?\s*\)/gi;
const named = /\b(white|black)\b/g;

function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function fromHsl(h, s, l) {
  const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map((v) => Math.round(v * 255));
}
// Почти белые (L > 0.9) → тёмные поверхности 0.08–0.15 (белый — самая светлая карточка).
// Остальные → светлые, тёмный текст становится почти белым.
function mapL(l) {
  if (l > 0.9) return 0.08 + ((l - 0.9) / 0.1) * 0.07;
  const t = (0.9 - l) / 0.9;
  return 0.2 + 0.73 * Math.pow(t, 0.75);
}
function convert(r, g, b) {
  const [h, s, l] = toHsl(r, g, b);
  // насыщенность у тёмных поверхностей чуть приглушаем, чтобы фон не «зеленел»
  const s2 = l > 0.9 ? Math.min(s, 0.18) : s;
  let l2 = mapL(l);
  // насыщенные акценты (зелёные кнопки, иконки) — сочный цвет, а не пастель
  if (s > 0.45 && l > 0.15 && l < 0.6) l2 = Math.min(l2, 0.58);
  return fromHsl(h, s2, l2);
}
const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

function mapValue(v) {
  let out = v.replace(rgbFn, (m, r, g, b, a) => {
    const c = convert(+r, +g, +b);
    return a !== undefined ? `rgb(${c.join(" ")} / ${a})` : `rgb(${c.join(" ")})`;
  });
  out = out.replace(hex, (m, h) => {
    let s = h;
    if (s.length === 3 || s.length === 4) s = s.split("").map((x) => x + x).join("");
    const rgb = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    const alpha = s.length === 8 ? s.slice(6) : "";
    return toHex(convert(...rgb)) + alpha;
  });
  out = out.replace(named, (m) => toHex(convert(...(m === "white" ? [255, 255, 255] : [0, 0, 0]))));
  return out;
}

const root = postcss.parse(fs.readFileSync(SRC, "utf8"));
const outRoot = postcss.root();
outRoot.append(postcss.comment({ text: " Сгенерировано scripts/build-dark-theme.mjs из src/index.css — не править вручную. " }));

root.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
  if (SKIP.test(rule.selector)) return;
  const decls = [];
  rule.walkDecls((d) => {
    if (!COLOR_PROPS.test(d.prop)) return;
    if (!/#|rgb|\bwhite\b|\bblack\b/.test(d.value)) return;
    if (/var\(--ws-/.test(d.value)) return; // цвета, выбранные пользователем для своего интерфейса
    decls.push(postcss.decl({ prop: d.prop, value: mapValue(d.value), important: d.important }));
  });
  if (!decls.length) return;
  // Внутри жёлто-чёрного шаблона «Высокий контраст» свои цвета — их не трогаем.
  const KEEP = ":not(:is(.contrast, .preset-contrast) *):not(:is(.contrast, .preset-contrast))";
  const guard = (sel) => {
    const m = sel.match(/(::[\w-]+(\([^)]*\))?)$/);
    return m ? sel.slice(0, -m[0].length) + KEEP + m[0] : sel + KEEP;
  };
  const selector = rule.selectors
    .map((s) => s.trim())
    .map((s) => (s === ":root" || s === "html" ? PREFIX : `${PREFIX} ${guard(s)}`))
    .join(",\n");
  const nr = postcss.rule({ selector });
  decls.forEach((d) => nr.append(d));
  // сохраняем вложенность в @media / @layer / @supports
  let target = outRoot; const chain = [];
  for (let p = rule.parent; p && p.type === "atrule"; p = p.parent) chain.unshift(p);
  for (const at of chain) {
    if (at.name === "layer") continue; // без слоя — чтобы тёмная тема перекрывала базовые стили
    const nat = postcss.atRule({ name: at.name, params: at.params });
    target.append(nat); target = nat;
  }
  target.append(nr);
});

fs.writeFileSync(OUT, outRoot.toString() + "\n");
console.log(`${OUT}: ${outRoot.nodes.length} правил`);
