import { createEmptyStats } from "./stats"
import type { GameStats, SavedDailyGame } from "./types"

const DAILY_KEY = "slovoznai:daily:v1"
const STATS_KEY = "slovoznai:stats:v1"

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
  const saved = read<Partial<GameStats>>(STATS_KEY)
  if (!saved) return null
  const stats = { ...createEmptyStats(attemptLimit), ...saved }
  stats.distribution = Array.from(
    { length: attemptLimit },
    (_, index) => stats.distribution[index] ?? 0,
  )
  return stats
}

export function saveStats(stats: GameStats) {
  write(STATS_KEY, stats)
}
