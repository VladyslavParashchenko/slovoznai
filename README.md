# Словознай

Щоденна гра зі словами українською: відгадайте слово з п’яти літер за шість спроб.

- Нове слово щодня опівночі (за місцевим часом гравця), прогрес і статистика зберігаються в браузері.
- Режим тренування на випадкових словах, світла й темна теми, поширення результату.
- Статичний сайт на SvelteKit + Tailwind CSS, без сервера.

## Розробка

Потрібен Node.js 22+; у проєкті закріплено 24.18.0 (`.nvmrc`, `.tool-versions`).

```sh
npm install
npm run dev       # дев-сервер
npm run check     # перевірка типів
npm run lint      # ESLint
npm run build     # статична збірка в build/
npm run preview   # перегляд збірки
```

Готовий сайт — вміст `build/`; його можна викласти на будь-який статичний хостинг. Невідомі шляхи повертають `index.html` (SPA-фолбек).

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
