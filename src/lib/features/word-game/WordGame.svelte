<script lang="ts">
  import { onMount } from "svelte"
  import HelpDialog from "./components/HelpDialog.svelte"
  import StatsDialog from "./components/StatsDialog.svelte"
  import WordBoard from "./components/WordBoard.svelte"
  import WordKeyboard from "./components/WordKeyboard.svelte"
  import { ACCEPTED_WORDS, PHYSICAL_KEY_MAP } from "./data/dictionary"
  import { getDailyWord, getDayNumber, getRandomWord } from "./model/daily"
  import { createBoardRows, getKeyboardStates, normalizeWord } from "./model/game"
  import { buildShareText } from "./model/share"
  import { createEmptyStats, getActiveStreak, recordResult } from "./model/stats"
  import { loadDailyGame, loadStats, saveDailyGame, saveStats } from "./model/storage"
  import type { GameMode } from "./model/types"
  import { getTheme, setTheme } from "$lib/theme"

  const ATTEMPT_LIMIT = 6
  const WIN_MESSAGES = ["Геніально!", "Неймовірно!", "Блискуче!", "Чудово!", "Добре!", "Ух, в останню мить!"]
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const REVEAL_MS = reduceMotion ? 0 : 250 * 4 + 500
  const SHAKE_MS = 450
  const STATS_DELAY_MS = 1600

  let mode = $state<GameMode>("daily")
  let day = $state(0)
  let target = $state("")
  let guesses = $state<string[]>([])
  let draft = $state("")
  let message = $state("")
  let revealRow = $state<number | null>(null)
  let shakeRow = $state<number | null>(null)
  let winRow = $state<number | null>(null)
  let stats = $state(loadStats(ATTEMPT_LIMIT) ?? createEmptyStats(ATTEMPT_LIMIT))
  let dialog = $state<"help" | "stats" | null>(null)
  let theme = $state(getTheme())
  let timers: ReturnType<typeof setTimeout>[] = []
  let messageTimer: ReturnType<typeof setTimeout> | undefined

  const won = $derived(guesses.at(-1) === target)
  const isFinished = $derived(won || guesses.length >= ATTEMPT_LIMIT)
  const isRevealing = $derived(revealRow !== null)
  const keyboardStates = $derived(getKeyboardStates(isRevealing ? guesses.slice(0, -1) : guesses, target))
  const rows = $derived(createBoardRows(guesses, draft, target, ATTEMPT_LIMIT))
  const activeRow = $derived(isFinished ? null : guesses.length)
  const showResult = $derived(isFinished && !isRevealing)
  const streak = $derived(getActiveStreak(stats, day))

  function later(callback: () => void, delay: number) {
    timers.push(setTimeout(callback, delay))
  }

  function resetBoard(nextTarget: string, nextGuesses: string[] = []) {
    timers.forEach(clearTimeout)
    timers = []
    target = nextTarget
    guesses = nextGuesses
    draft = ""
    revealRow = null
    shakeRow = null
    winRow = null
    showMessage("")
  }

  function showMessage(text: string, duration?: number) {
    clearTimeout(messageTimer)
    message = text
    if (duration) messageTimer = setTimeout(() => (message = ""), duration)
  }

  function finalMessage() {
    return won ? WIN_MESSAGES[guesses.length - 1] : `Загадане слово: ${target.toUpperCase()}`
  }

  function startDaily() {
    mode = "daily"
    day = getDayNumber()
    const word = getDailyWord(day)
    const saved = loadDailyGame(day)?.guesses ?? []
    const restored = saved.filter((guess) => typeof guess === "string" && guess.length === word.length).slice(0, ATTEMPT_LIMIT)
    const winIndex = restored.indexOf(word)
    resetBoard(word, winIndex === -1 ? restored : restored.slice(0, winIndex + 1))
    if (isFinished) showMessage(finalMessage())
  }

  function startPractice() {
    mode = "practice"
    resetBoard(getRandomWord(target))
  }

  function reject(text: string) {
    showMessage(text, 1800)
    shakeRow = null
    requestAnimationFrame(() => {
      shakeRow = guesses.length
      later(() => (shakeRow = null), SHAKE_MS)
    })
  }

  function submit() {
    if (draft.length !== target.length) return reject(`Потрібно ${target.length} літер`)
    if (!ACCEPTED_WORDS.has(draft)) return reject("Такого слова немає у словнику")
    if (guesses.includes(draft)) return reject("Це слово вже було")

    guesses = [...guesses, draft]
    draft = ""
    showMessage("")
    const row = guesses.length - 1

    if (mode === "daily") {
      saveDailyGame({ day, guesses })
      if (isFinished) {
        stats = recordResult(stats, day, won ? guesses.length : null)
        saveStats(stats)
      }
    }

    revealRow = row
    later(() => {
      revealRow = null
      if (!isFinished) return
      showMessage(finalMessage())
      if (won) winRow = row
      if (mode === "daily") later(() => (dialog = "stats"), STATS_DELAY_MS)
    }, REVEAL_MS)
  }

  function press(key: string) {
    if (isFinished || isRevealing) return
    if (key === "enter") return submit()
    if (key === "backspace") draft = draft.slice(0, -1)
    else if (draft.length < target.length) draft += key
    if (message) showMessage("")
  }

  async function share() {
    const text = `${buildShareText(day, guesses, target, ATTEMPT_LIMIT)}\n\n${location.origin}`
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text })
        return null
      }
      await navigator.clipboard.writeText(text)
      return "Скопійовано!"
    } catch (error) {
      return error instanceof DOMException && error.name === "AbortError" ? null : "Не вдалося"
    }
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark"
    setTheme(theme)
  }

  startDaily()

  onMount(() => {
    if (!stats.played && !guesses.length) dialog = "help"

    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || dialog) return
      let key: string | undefined
      if (event.key === "Enter") {
        // Enter на сфокусованій кнопці (не літері) має натиснути саме її.
        if (event.repeat || (event.target instanceof HTMLButtonElement && !event.target.closest(".keyboard"))) return
        key = "enter"
      } else if (event.key === "Backspace") key = "backspace"
      else {
        const letter = normalizeWord(event.key)
        key = letter.length === 1 ? letter : PHYSICAL_KEY_MAP[event.code]
      }
      if (!key) return
      event.preventDefault()
      press(key)
    }

    // Слово змінюється опівночі — підхоплюємо новий день, якщо вкладка лишалась відкритою.
    const checkNewDay = () => {
      if (mode === "daily" && !isRevealing && getDayNumber() !== day) startDaily()
    }
    const dayTimer = setInterval(checkNewDay, 30_000)
    // Поки вибір не збережено, тема слідує за системою — оновлюємо іконку.
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
    const syncTheme = () => (theme = getTheme())
    colorScheme.addEventListener("change", syncTheme)

    window.addEventListener("keydown", handleKey)
    document.addEventListener("visibilitychange", checkNewDay)
    return () => {
      clearInterval(dayTimer)
      colorScheme.removeEventListener("change", syncTheme)
      timers.forEach(clearTimeout)
      clearTimeout(messageTimer)
      window.removeEventListener("keydown", handleKey)
      document.removeEventListener("visibilitychange", checkNewDay)
    }
  })
</script>

<main class="page-shell">
  <header>
    <button class="brand" onclick={startDaily} aria-label="Словознай — слово дня"><span class="brand-mark">С</span><span>Словознай</span></button>
    <div class="header-actions">
      <button class="icon-button" aria-label={theme === "dark" ? "Світла тема" : "Темна тема"} title={theme === "dark" ? "Світла тема" : "Темна тема"} onclick={toggleTheme}>
        {#if theme === "dark"}
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        {:else}
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M13.5 9.6A6 6 0 0 1 6.4 2.5a6 6 0 1 0 7.1 7.1z" fill="currentColor" /></svg>
        {/if}
      </button>
      <button class="icon-button" aria-label="Як грати" title="Як грати" onclick={() => (dialog = "help")}>?</button>
      <button class="icon-button" aria-label="Статистика" title="Статистика" onclick={() => (dialog = "stats")}>
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2.5 14V9M8 14V2.5M13.5 14V6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
      </button>
    </div>
  </header>
  <section class="game" aria-labelledby="game-title">
    <h1 id="game-title">{mode === "daily" ? "Слово дня" : "Тренування"} <span class="title-separator" aria-hidden="true"></span> <em>{target.length} літер</em></h1>
    <WordBoard {rows} {activeRow} {revealRow} {shakeRow} {winRow} />
    <div class:success={showResult && won} class:visible={message} class="message" role="status" aria-live="polite">{message || " "}</div>
    {#if showResult}
      <div class="result-actions">
        {#if mode === "daily"}
          <button class="secondary" onclick={() => (dialog = "stats")}>Статистика</button>
          <button class="new-game" onclick={startPractice}>Тренуватися <span>→</span></button>
        {:else}
          <button class="secondary" onclick={startDaily}>До слова дня</button>
          <button class="new-game" onclick={startPractice}>Нове слово <span>→</span></button>
        {/if}
      </div>
    {/if}
    <WordKeyboard {keyboardStates} disabled={isFinished} onKeyPress={press} />
  </section>
</main>

<HelpDialog open={dialog === "help"} attemptLimit={ATTEMPT_LIMIT} onClose={() => (dialog = null)} />
<StatsDialog
  open={dialog === "stats"}
  {stats}
  {streak}
  highlightAttempt={mode === "daily" && showResult && won ? guesses.length : null}
  canShare={mode === "daily" && showResult}
  onShare={share}
  onClose={() => (dialog = null)}
/>

<style>
  .page-shell{min-height:100dvh;padding:1.25rem max(1.25rem,calc((100vw - 29rem)/2));padding-bottom:max(1.25rem,env(safe-area-inset-bottom));background:var(--color-paper)} header{display:flex;align-items:center;justify-content:space-between}.brand{display:inline-flex;align-items:center;gap:.6rem;border:0;background:transparent;color:var(--color-ink);font-family:var(--font-display);font-size:1.3rem;font-weight:800;letter-spacing:-.04em}.brand-mark{display:grid;width:2.2rem;height:2.2rem;place-items:center;border-radius:50% 50% 50% 0;background:var(--color-accent);color:var(--color-accent-contrast);font-family:var(--font-sans);font-size:1rem;transform:rotate(-20deg)}.header-actions{display:flex;gap:.55rem}.icon-button{display:grid;width:2.3rem;height:2.3rem;place-items:center;border:1px solid var(--color-border);border-radius:50%;background:var(--color-surface);color:var(--color-muted);font-weight:800;transition:color .15s,border-color .15s}.icon-button:hover{border-color:var(--color-muted);color:var(--color-ink)}button:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}.game{margin:2.4rem auto 0;text-align:center}h1{display:flex;align-items:center;justify-content:center;gap:.55rem;margin:.8rem 0 1.5rem;font-family:var(--font-sans);font-size:clamp(1.65rem,6vw,2.4rem);font-weight:800;line-height:1.1;letter-spacing:-.04em}h1 em{color:var(--color-accent);font-style:normal}.title-separator{width:.35rem;height:.35rem;border-radius:50%;background:var(--color-accent)}.message{min-height:1.5rem;margin:0 0 .8rem;color:var(--color-accent-strong);font-size:.8rem;font-weight:700;opacity:0;transition:opacity .2s}.message.visible{opacity:1}.message.success{color:var(--color-correct)}.result-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin:-.15rem 0 .9rem}.new-game,.secondary{border-radius:999px;padding:.65rem 1rem;font-weight:800}.new-game{border:0;background:var(--color-accent);color:var(--color-accent-contrast)}.new-game:hover{background:var(--color-accent-strong)}.new-game span{margin-left:.35rem;color:inherit}.secondary{border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-ink)}.secondary:hover{border-color:var(--color-muted)}@media(max-width:420px){.page-shell{padding-inline:.85rem}.game{margin-top:1.8rem}}
</style>
