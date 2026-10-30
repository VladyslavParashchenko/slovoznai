import { scoreGuess } from "./game"

const SHARE_SYMBOLS = {
  correct: "🟧",
  present: "⬜",
  absent: "⬛",
  empty: "⬛",
}

export function buildShareText(
  day: number,
  guesses: string[],
  target: string,
  attemptLimit: number,
) {
  const won = guesses.at(-1) === target
  const grid = guesses
    .map((guess) =>
      scoreGuess(guess, target)
        .map((state) => SHARE_SYMBOLS[state])
        .join(""),
    )
    .join("\n")
  const score = won ? guesses.length : "X"
  return `Словознай №${day + 1} ${score}/${attemptLimit}\n\n${grid}`
}

/** Системне меню «Поділитися» на телефонах, інакше — копіювання. Повертає підпис для кнопки. */
export async function shareResult(text: string): Promise<string | null> {
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text })
      return null
    }
    await navigator.clipboard.writeText(text)
    return "Скопійовано!"
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? null
      : "Не вдалося"
  }
}
