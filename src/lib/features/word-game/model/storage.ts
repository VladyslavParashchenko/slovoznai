import { createEmptyStats } from "./stats"
import type { GameStats, SavedDailyGame } from "./types"

const DAILY_KEY = "slovoznai:daily:v1"
const STATS_KEY = "slovoznai:stats:v1"

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Приватний режим або переповнене сховище — гра працює й без збереження.
  }
}

export function loadDailyGame(day: number): SavedDailyGame | null {
  const saved = read<SavedDailyGame>(DAILY_KEY)
  return saved?.day === day && Array.isArray(saved.guesses) ? saved : null
}

export function saveDailyGame(game: SavedDailyGame) {
  write(DAILY_KEY, game)
}

export function loadStats(attemptLimit: number): GameStats | null {
  const saved = read<Record<string, unknown>>(STATS_KEY)
  if (typeof saved !== "object" || saved === null) return null

  const empty = createEmptyStats(attemptLimit)
  const count = (key: "played" | "wins" | "currentStreak" | "maxStreak") =>
    isCount(saved[key]) ? saved[key] : empty[key]
  const day = (key: "lastPlayedDay" | "lastWonDay") =>
    Number.isInteger(saved[key]) ? (saved[key] as number) : null
  const distribution = Array.isArray(saved.distribution)
    ? saved.distribution
    : []

  return {
    played: count("played"),
    wins: count("wins"),
    currentStreak: count("currentStreak"),
    maxStreak: count("maxStreak"),
    distribution: Array.from({ length: attemptLimit }, (_, index) =>
      isCount(distribution[index]) ? distribution[index] : 0,
    ),
    lastPlayedDay: day("lastPlayedDay"),
    lastWonDay: day("lastWonDay"),
  }
}

export function saveStats(stats: GameStats) {
  write(STATS_KEY, stats)
}
