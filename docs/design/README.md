# Дизайн

Решение команды (25.11.2026):

| Что | Выбор | Где посмотреть |
|---|---|---|
| Интерфейс | **«Классика»** (светлая) + **«Тёмная»** | [mockups/1-classic.png](mockups/1-classic.png), [mockups/3-dark.png](mockups/3-dark.png) |
| Логотип | **A. Модули** — без изменений | [mockups/6-logos.png](mockups/6-logos.png), исходник [brand/logo.svg](../brand/logo.svg) |
| Анимации | **«Живой»** (сначала был выбран «Плавный») | [animations/4-lively.mp4](animations/4-lively.mp4) |

Остальные варианты оставлены для истории: `mockups/2-senior`, `4-glass`, `5-mono`, логотипы B–E, паки анимаций 1–3, 5.

## Как устроено в коде

### Веб
- **Шрифт:** Onest (`@fontsource-variable/onest`), входит в сборку.
- **«Классика»:** блок «Дизайн „Классика“» в конце `src/index.css`.
- **Тёмная тема:** `src/theme-dark.css` генерируется из `src/index.css` скриптом `pnpm theme:dark` (яркость каждого цвета переворачивается, оттенок сохраняется). Ручные правки — `src/theme-dark-overrides.css`. **После изменения цветов в `index.css` запустите `pnpm theme:dark`.**
- **Переключатель:** верхняя панель (солнце / луна / монитор) и «Доступность → Тема оформления». По умолчанию — как в системе. В режиме высокого контраста тема всегда светлая.
- **Анимации:** блок «Анимации: пак „Живой“» в конце `src/index.css` и `src/motion.tsx` (скелет при открытии экрана, счётчик баланса). В шаблоне «Фокус» анимаций нет. Все анимации внутри `@media (prefers-reduced-motion: no-preference)` — при системной настройке «Уменьшить движение» их нет.

### Мобильное приложение
См. README репозитория [accessible-ui-constructor-mobile](https://github.com/TewCorejz/accessible-ui-constructor-mobile).

## Исходники макетов
`mockups/mockups.html?v=classic|senior|dark|glass|mono`, `mockups/logos.html`, `animations/animations.html?p=calm|smooth|spring|lively|tactile` — открываются в браузере; PNG/MP4/GIF перезаписывались скриптами Puppeteer + ffmpeg.
