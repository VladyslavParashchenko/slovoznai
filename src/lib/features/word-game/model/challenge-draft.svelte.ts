import { WORD_LENGTH } from "./challenge"
import type { BoardCell } from "./types"

/** Набір слова для челенджу в одному рядку поля: та сама поведінка курсора, що й у грі. */
export class ChallengeDraft {
  letters = $state<string[]>(Array(WORD_LENGTH).fill(""))
  cursor = $state(0)

  word = $derived(this.letters.join(""))
  rows = $derived<BoardCell[][]>([
    this.letters.map((letter) => ({ letter, state: "empty" })),
  ])

  type(letter: string) {
    if (this.cursor >= WORD_LENGTH) return
    this.letters[this.cursor] = letter
    this.cursor++
  }

  /** Стирає обрану клітинку, інакше найближчу заповнену ліворуч. */
  erase() {
    const index = this.letters[this.cursor]
      ? this.cursor
      : this.letters.findLastIndex(
          (letter, index) => letter && index < this.cursor,
        )
    if (index === -1) return
    this.letters[index] = ""
    this.cursor = index
  }

  step(direction: 1 | -1) {
    this.select(this.cursor + direction)
  }

  select(index: number) {
    this.cursor = Math.min(Math.max(index, 0), WORD_LENGTH - 1)
  }
}
