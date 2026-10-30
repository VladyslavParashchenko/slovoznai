import { ANSWER_WORDS } from "../data/dictionary"

const DAY_MS = 24 * 60 * 60 * 1000
const LAUNCH_DAY = Date.UTC(2026, 9, 29)

export function getDayNumber(now = new Date()) {
  const localDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((localDay - LAUNCH_DAY) / DAY_MS)
}

export function getDailyWord(day: number): string {
  const index =
    ((day % ANSWER_WORDS.length) + ANSWER_WORDS.length) % ANSWER_WORDS.length
  return ANSWER_WORDS[index]
}

export function getRandomWord(exclude: string): string {
  const words = ANSWER_WORDS.filter((word) => word !== exclude)
  return words[Math.floor(Math.random() * words.length)]
}

export function getMsUntilNextDay(now = new Date()) {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  )
  return midnight.getTime() - now.getTime()
}
