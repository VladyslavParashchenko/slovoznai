import { ACCEPTED_WORDS } from "../data/dictionary"
import { getDailyWord, getDayNumber, getRandomWord } from "./daily"
import { createBoardRows, getKeyboardStates, getKnownLetters } from "./game"
import { buildShareText } from "./share"
import { createEmptyStats, getActiveStreak, recordResult } from "./stats"
import { loadDailyGame, loadStats, saveDailyGame, saveStats } from "./storage"
import type { DraftCell, GameMode } from "./types"

export const ATTEMPT_LIMIT = 6

const WIN_MESSAGES = [
  "Геніально!",
  "Неймовірно!",
  "Блискуче!",
  "Чудово!",
  "Добре!",
  "Ух, в останню мить!",
]
export const TILE_FLIP_MS = 500
export const TILE_STAGGER_MS = 250
export const SHAKE_MS = 450
const ERROR_MESSAGE_MS = 1800
const STATS_DELAY_MS = 1600

interface Options {
  reduceMotion: boolean
  onDailyFinish: () => void
}

export class WordGameState {
  mode = $state<GameMode>("daily")
  day = $state(0)
  target = $state("")
  guesses = $state<string[]>([])
  draft = $state<DraftCell[]>([])
  cursor = $state(0)
  message = $state("")
  revealRow = $state<number | null>(null)
  shakeRow = $state<number | null>(null)
  winRow = $state<number | null>(null)
  stats = $state(loadStats(ATTEMPT_LIMIT) ?? createEmptyStats(ATTEMPT_LIMIT))

  won = $derived(this.guesses.at(-1) === this.target)
  isFinished = $derived(this.won || this.guesses.length >= ATTEMPT_LIMIT)
  isRevealing = $derived(this.revealRow !== null)
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
  draftWord = $derived(this.draft.map((cell) => cell.letter).join(""))
  activeRow = $derived(this.isFinished ? null : this.guesses.length)
  editCursor = $derived(
    this.isFinished || this.isRevealing ? null : this.cursor,
  )
  streak = $derived(getActiveStreak(this.stats, this.day))

  #reduceMotion: boolean
  #onDailyFinish: () => void
  #timers: ReturnType<typeof setTimeout>[] = []
  #messageTimer: ReturnType<typeof setTimeout> | undefined
  #shakeFrame = 0

  constructor({ reduceMotion, onDailyFinish }: Options) {
    this.#reduceMotion = reduceMotion
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
    if (key === "backspace") this.#erase()
    else if (key === "arrowleft") this.#step(-1)
    else if (key === "arrowright") this.#step(1)
    else if (this.cursor < this.target.length) {
      this.draft[this.cursor] = { letter: key, hint: false }
      this.cursor = this.#nextFree(this.cursor + 1)
    }
    if (this.message) this.#showMessage("")
  }

  select(index: number) {
    if (this.editCursor === null) return
    this.cursor = Math.min(Math.max(index, 0), this.target.length - 1)
  }

  shareText() {
    return buildShareText(this.day, this.guesses, this.target, ATTEMPT_LIMIT)
  }

  destroy() {
    this.#cancelPending()
    clearTimeout(this.#messageTimer)
  }

  /** Стирає обрану клітинку, інакше найближчу набрану ліворуч; підказку — лише коли її обрано. */
  #erase() {
    const index = this.draft[this.cursor]?.letter
      ? this.cursor
      : this.draft.findLastIndex(
          (cell, index) => cell.letter && !cell.hint && index < this.cursor,
        )
    if (index === -1) return
    this.draft[index] = { letter: "", hint: false }
    this.cursor = index
  }

  /** Стрілки, як і набір, перескакують підказки; обрати підказку можна натиском. */
  #step(direction: 1 | -1) {
    for (
      let index = this.cursor + direction;
      index >= 0 && index < this.target.length;
      index += direction
    ) {
      if (!this.draft[index].hint) return (this.cursor = index)
    }
  }

  #nextFree(from: number) {
    const index = this.draft.findIndex((cell, i) => !cell.hint && i >= from)
    return index === -1 ? this.target.length : index
  }

  #startRow() {
    this.draft = this.isFinished
      ? []
      : getKnownLetters(this.guesses, this.target).map((letter) => ({
          letter,
          hint: Boolean(letter),
        }))
    this.cursor = this.#nextFree(0)
  }

  #submit() {
    const word = this.draftWord
    if (word.length !== this.target.length) {
      return this.#reject(`Потрібно ${this.target.length} літер`)
    }
    if (!ACCEPTED_WORDS.has(word)) {
      return this.#reject("Такого слова немає у словнику")
    }
    if (this.guesses.includes(word)) {
      return this.#reject("Це слово вже було")
    }

    this.guesses = [...this.guesses, word]
    this.draft = []
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
      if (!this.isFinished) return this.#startRow()
      this.#showMessage(this.#finalMessage())
      if (this.won) this.winRow = row
      if (this.mode === "daily")
        this.#later(this.#onDailyFinish, STATS_DELAY_MS)
    }, this.#revealMs())
  }

  #reject(text: string) {
    this.#showMessage(text, ERROR_MESSAGE_MS)
    this.#restartShake()
  }

  #restartShake() {
    this.shakeRow = null
    cancelAnimationFrame(this.#shakeFrame)
    this.#shakeFrame = requestAnimationFrame(() => {
      this.shakeRow = this.guesses.length
      this.#later(() => (this.shakeRow = null), SHAKE_MS)
    })
  }

  #reset(target: string, guesses: string[] = []) {
    this.#cancelPending()
    this.target = target
    this.guesses = guesses
    this.#startRow()
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

  #revealMs() {
    if (this.#reduceMotion) return 0
    return TILE_STAGGER_MS * (this.target.length - 1) + TILE_FLIP_MS
  }

  #cancelPending() {
    this.#timers.forEach(clearTimeout)
    this.#timers = []
    cancelAnimationFrame(this.#shakeFrame)
  }

  #later(callback: () => void, delay: number) {
    this.#timers.push(setTimeout(callback, delay))
  }
}
