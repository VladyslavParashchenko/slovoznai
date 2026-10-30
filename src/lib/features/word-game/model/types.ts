export type LetterState = "correct" | "present" | "absent" | "empty"

export interface BoardCell {
  letter: string
  state: LetterState
}

export type KeyboardStates = Record<string, LetterState>

export type GameMode = "daily" | "practice"

export interface SavedDailyGame {
  day: number
  guesses: string[]
}

export interface GameStats {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
  lastPlayedDay: number | null
  lastWonDay: number | null
}
