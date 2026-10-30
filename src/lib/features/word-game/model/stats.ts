import type { GameStats } from "./types"

export function createEmptyStats(attemptLimit: number): GameStats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: Array(attemptLimit).fill(0),
    lastPlayedDay: null,
    lastWonDay: null,
  }
}

export function recordResult(
  stats: GameStats,
  day: number,
  attempts: number | null,
): GameStats {
  if (stats.lastPlayedDay === day) return stats

  const won = attempts !== null
  const currentStreak = won
    ? stats.lastWonDay === day - 1
      ? stats.currentStreak + 1
      : 1
    : 0
  const distribution = [...stats.distribution]
  if (won) distribution[attempts - 1] = (distribution[attempts - 1] ?? 0) + 1

  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastPlayedDay: day,
    lastWonDay: won ? day : stats.lastWonDay,
  }
}

/** Серія обривається, якщо вчорашнє слово не відгадане. */
export function getActiveStreak(stats: GameStats, today: number) {
  return stats.lastWonDay !== null && stats.lastWonDay >= today - 1
    ? stats.currentStreak
    : 0
}
