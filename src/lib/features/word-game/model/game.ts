import type { BoardCell, KeyboardStates, LetterState } from "./types"

const STATE_PRIORITY: Record<Exclude<LetterState, "empty">, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

export function normalizeWord(value: string) {
  return value.toLocaleLowerCase("uk-UA").replace(/[^а-щьюяґєії]/g, "")
}

/** Оцінює спробу, коректно враховуючи повтори літер. */
export function scoreGuess(guess: string, target: string): LetterState[] {
  const states: LetterState[] = Array(target.length).fill("absent")
  const unmatchedLetters = target.split("")

  guess.split("").forEach((letter, index) => {
    if (letter === target[index]) {
      states[index] = "correct"
      unmatchedLetters[index] = ""
    }
  })

  guess.split("").forEach((letter, index) => {
    if (states[index] === "correct") return
    const targetIndex = unmatchedLetters.indexOf(letter)
    if (targetIndex !== -1) {
      states[index] = "present"
      unmatchedLetters[targetIndex] = ""
    }
  })

  return states
}

export function createBoardRows(
  guesses: string[],
  draft: string,
  target: string,
  attemptLimit: number,
): BoardCell[][] {
  return Array.from({ length: attemptLimit }, (_, rowIndex) => {
    const word = guesses[rowIndex] ?? (rowIndex === guesses.length ? draft : "")
    const states = guesses[rowIndex]
      ? scoreGuess(guesses[rowIndex], target)
      : []

    return Array.from({ length: target.length }, (_, columnIndex) => ({
      letter: word[columnIndex] ?? "",
      state: states[columnIndex] ?? "empty",
    }))
  })
}

export function shouldReplaceKeyState(
  current: LetterState | undefined,
  next: LetterState,
) {
  if (next === "empty") return false
  return (
    !current ||
    current === "empty" ||
    STATE_PRIORITY[next] > STATE_PRIORITY[current]
  )
}

/** Найкращий відомий стан кожної літери після всіх спроб. */
export function getKeyboardStates(
  guesses: string[],
  target: string,
): KeyboardStates {
  const states: KeyboardStates = {}
  guesses.forEach((guess) => {
    scoreGuess(guess, target).forEach((state, index) => {
      const letter = guess[index]
      if (shouldReplaceKeyState(states[letter], state)) states[letter] = state
    })
  })
  return states
}
