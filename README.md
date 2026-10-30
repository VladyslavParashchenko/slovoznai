# Словознай

Щоденна гра зі словами українською: відгадайте слово з п’яти літер за шість спроб.

- Нове слово щодня опівночі (за місцевим часом гравця), прогрес і статистика зберігаються в браузері.
- Режим тренування на випадкових словах, світла й темна теми, поширення результату.
- Статичний сайт на SvelteKit + Tailwind CSS, без сервера.

## Розробка

Потрібен Node.js 26+; у проєкті закріплено 26.5.1 (`.nvmrc`, `.tool-versions`).

```sh
npm install
npm run dev       # дев-сервер
npm run check     # перевірка типів
npm run lint      # ESLint
npm test          # тести (Vitest), npm run test:watch — у режимі спостереження
npm run build     # статична збірка в build/
npm run preview   # перегляд збірки
```

Готовий сайт — вміст `build/`; його можна викласти на будь-який статичний хостинг. Невідомі шляхи повертають `index.html` (SPA-фолбек).

## Git-хуки та коміти

Хуки керуються [prek](https://prek.j178.dev) і встановлюються автоматично під час `npm install` (скрипт `prepare`). Конфігурація — `.pre-commit-config.yaml`.

- **pre-commit:** пробіли й кінці файлів, конфлікти злиття, YAML/JSON, великі файли, приватні ключі, Prettier, ESLint, svelte-check, тести.
- **commit-msg:** [commitlint](https://commitlint.js.org) з [Conventional Commits](https://www.conventionalcommits.org/uk/): `feat: додати темну тему`, `fix(board): …`, `chore: …`. Тип і опис — з малої літери.

```sh
npm run hooks     # усі хуки по всьому репозиторію
```

## Словник

- `src/lib/features/word-game/data/dictionary.ts` — загадані слова (`ANSWER_WORDS`). Порядок визначає слово кожного дня: №1 — 29.10.2026 (`LAUNCH_DAY` у `model/daily.ts`). Нові слова додавайте **в кінець**, щоб не зсунути вже минулі дні.
- `src/lib/features/word-game/data/accepted-words.ts` — дозволені спроби: усі 5-літерні леми зі словника [dictionary-uk](https://github.com/wooorm/dictionaries/tree/main/dictionaries/uk) (GPL-3.0).

## Структура

```
src/
  app.css                       кольори та теми
  lib/theme.ts                  перемикання теми
  lib/features/word-game/
    WordGame.svelte             стан гри
    components/                 поле, клавіатура, діалоги
    model/                      логіка: оцінка спроб, день, статистика, сховище
    data/                       словники
static/                         іконки та маніфест
```
