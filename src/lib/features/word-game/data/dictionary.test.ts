import { describe, expect, it } from "vitest"
import { normalizeWord } from "../model/game"
import {
  ACCEPTED_WORDS,
  ANSWER_WORDS,
  KEYBOARD_ROWS,
  PHYSICAL_KEY_MAP,
} from "./dictionary"

const LOCKED_WORDS = 392
const KEYBOARD_LETTERS = new Set<string>(KEYBOARD_ROWS.flat())

describe("словник", () => {
  it("нові слова дня додаються лише в кінець", () => {
    expect(ANSWER_WORDS.slice(0, LOCKED_WORDS)).toMatchSnapshot()
  })

  it("загадані слова унікальні та пройдуть перевірку спроби", () => {
    expect(new Set(ANSWER_WORDS).size).toBe(ANSWER_WORDS.length)
    for (const word of ANSWER_WORDS) {
      expect(word).toHaveLength(5)
      expect(normalizeWord(word)).toBe(word)
      expect(ACCEPTED_WORDS.has(word)).toBe(true)
    }
  })

  it("кожну спробу можна набрати на екранній клавіатурі", () => {
    const invalid = [...ACCEPTED_WORDS].filter(
      (word) =>
        word.length !== 5 ||
        [...word].some((letter) => !KEYBOARD_LETTERS.has(letter)),
    )
    expect(invalid).toEqual([])
  })
})

describe("клавіатура", () => {
  it("містить усі 33 літери абетки по одному разу", () => {
    expect(KEYBOARD_ROWS.flat()).toHaveLength(33)
    expect(KEYBOARD_LETTERS.size).toBe(33)
  })

  it("фізична розкладка покриває всі літери", () => {
    expect(new Set(Object.values(PHYSICAL_KEY_MAP))).toEqual(KEYBOARD_LETTERS)
  })
})
