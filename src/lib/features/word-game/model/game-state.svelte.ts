import { ACCEPTED_WORDS } from "../data/dictionary"
import { getDailyWord, getDayNumber, getRandomWord } from "./daily"
import { createBoardRows, getKeyboardStates } from "./game"
import { buildShareText } from "./share"
import { createEmptyStats, getActiveStreak, recordResult } from "./stats"
import { loadDailyGame, loadStats, saveDailyGame, saveStats } from "./storage"
import type { GameMode } from "./types"

export const ATTEMPT_LIMIT = 6

const WIN_MESSAGES = [
  "Геніально!",
  "Неймовірно!",
  "Блискуче!",
  "Чудово!",
  "Добре!",
  "Ух, в останню мить!",
]
/** Перевертання 5 плиток: затримка 250 мс між ними + 500 мс на останню. */
const REVEAL_MS = 250 * 4 + 500
const SHAKE_MS = 450
const ERROR_MESSAGE_MS = 1800
const STATS_DELAY_MS = 1600

interface Options {
  reduceMotion: boolean
  /** Слово дня відгадане або спроби скінчились — після анімації. */
  onDailyFinish: () => void
}

/** Увесь стан однієї партії: слово, спроби, анімації, повідомлення, статистика. */
export class WordGameState {
  mode = $state<GameMode>("daily")
  day = $state(0)
  target = $state("")
  guesses = $state<string[]>([])
  draft = $state("")
  message = $state("")
  revealRow = $state<number | null>(null)
  shakeRow = $state<number | null>(null)
  winRow = $state<number | null>(null)
  stats = $state(loadStats(ATTEMPT_LIMIT) ?? createEmptyStats(ATTEMPT_LIMIT))

  won = $derived(this.guesses.at(-1) === this.target)
  isFinished = $derived(this.won || this.guesses.length >= ATTEMPT_LIMIT)
  isRevealing = $derived(this.revealRow !== null)
  /** Результат показуємо лише після анімації останнього рядка. */
  showResult = $derived(this.isFinished && !this.isRevealing)
  keyboardStates = $derived(
    getKeyboardStates(
      this.isRevealing ? this.guesses.slice(0, -1) : this.guesses,
      this.target,
    ),
  )
  rows = $derived(
    createBoardRows(this.guesses, this.draft, this.target, ATTEMPT_LIMIT),
  )
  activeRow = $derived(this.isFinished ? null : this.guesses.length)
  streak = $derived(getActiveStreak(this.stats, this.day))

  #revealMs: number
  #onDailyFinish: () => void
  #timers: ReturnType<typeof setTimeout>[] = []
  #messageTimer: ReturnType<typeof setTimeout> | undefined

  constructor({ reduceMotion, onDailyFinish }: Options) {
    this.#revealMs = reduceMotion ? 0 : REVEAL_MS
    this.#onDailyFinish = onDailyFinish
  }

  startDaily() {
    this.mode = "daily"
    this.day = getDayNumber()
    const word = getDailyWord(this.day)
    const saved = loadDailyGame(this.day)?.guesses ?? []
    const restored = saved
      .filter(
        (guess) => typeof guess === "string" && guess.length === word.length,
      )
      .slice(0, ATTEMPT_LIMIT)
    const winIndex = restored.indexOf(word)
    this.#reset(
      word,
      winIndex === -1 ? restored : restored.slice(0, winIndex + 1),
    )
    if (this.isFinished) this.#showMessage(this.#finalMessage())
  }

  startPractice() {
    this.mode = "practice"
    this.#reset(getRandomWord(this.target))
  }

  /** Слово змінюється опівночі — підхоплюємо новий день, якщо вкладка лишалась відкритою. */
  checkNewDay() {
    if (
      this.mode === "daily" &&
      !this.isRevealing &&
      getDayNumber() !== this.day
    ) {
      this.startDaily()
    }
  }

  press(key: string) {
    if (this.isFinished || this.isRevealing) return
    if (key === "enter") return this.#submit()
    if (key === "backspace") this.draft = this.draft.slice(0, -1)
    else if (this.draft.length < this.target.length) this.draft += key
    if (this.message) this.#showMessage("")
  }

  shareText() {
    return buildShareText(this.day, this.guesses, this.target, ATTEMPT_LIMIT)
  }

  destroy() {
    this.#timers.forEach(clearTimeout)
    clearTimeout(this.#messageTimer)
  }

  #submit() {
    if (this.draft.length !== this.target.length) {
      return this.#reject(`Потрібно ${this.target.length} літер`)
    }
    if (!ACCEPTED_WORDS.has(this.draft)) {
      return this.#reject("Такого слова немає у словнику")
    }
    if (this.guesses.includes(this.draft)) {
      return this.#reject("Це слово вже було")
    }

    this.guesses = [...this.guesses, this.draft]
    this.draft = ""
    this.#showMessage("")
    const row = this.guesses.length - 1

    if (this.mode === "daily") {
      saveDailyGame({ day: this.day, guesses: this.guesses })
      if (this.isFinished) {
        this.stats = recordResult(
          this.stats,
          this.day,
          this.won ? this.guesses.length : null,
        )
        saveStats(this.stats)
      }
    }

    this.revealRow = row
    this.#later(() => {
      this.revealRow = null
      if (!this.isFinished) return
      this.#showMessage(this.#finalMessage())
      if (this.won) this.winRow = row
      if (this.mode === "daily")
        this.#later(this.#onDailyFinish, STATS_DELAY_MS)
    }, this.#revealMs)
  }

  #reject(text: string) {
    this.#showMessage(text, ERROR_MESSAGE_MS)
    this.shakeRow = null
    // Наступний кадр — щоб анімація перезапустилась при повторній помилці.
    requestAnimationFrame(() => {
      this.shakeRow = this.guesses.length
      this.#later(() => (this.shakeRow = null), SHAKE_MS)
    })
  }

  #reset(target: string, guesses: string[] = []) {
    this.#timers.forEach(clearTimeout)
    this.#timers = []
    this.target = target
    this.guesses = guesses
    this.draft = ""
    this.revealRow = null
    this.shakeRow = null
    this.winRow = null
    this.#showMessage("")
  }

  #showMessage(text: string, duration?: number) {
    clearTimeout(this.#messageTimer)
    this.message = text
    if (duration) {
      this.#messageTimer = setTimeout(() => (this.message = ""), duration)
    }
  }

  #finalMessage() {
    return this.won
      ? WIN_MESSAGES[this.guesses.length - 1]
      : `Загадане слово: ${this.target.toUpperCase()}`
  }

  #later(callback: () => void, delay: number) {
    this.#timers.push(setTimeout(callback, delay))
  }
}
