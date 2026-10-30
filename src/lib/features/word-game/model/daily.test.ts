import { afterEach, describe, expect, it, vi } from "vitest"
import { ANSWER_WORDS } from "../data/dictionary"
import {
  getDailyWord,
  getDayNumber,
  getMsUntilNextDay,
  getRandomWord,
} from "./daily"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("getDayNumber", () => {
  it("рахує дні від запуску за місцевим календарем", () => {
    expect(getDayNumber(new Date(2026, 9, 29, 0, 0))).toBe(0)
    expect(getDayNumber(new Date(2026, 9, 29, 23, 59))).toBe(0)
    expect(getDayNumber(new Date(2026, 9, 30, 0, 1))).toBe(1)
  })

  it("не збивається під час переходу на літній час", () => {
    const beforeDst = new Date(2027, 2, 27, 23, 30)
    const afterDst = new Date(2027, 2, 28, 23, 30)
    expect(afterDst.getTimezoneOffset()).not.toBe(beforeDst.getTimezoneOffset())

    expect(getDayNumber(afterDst)).toBe(getDayNumber(beforeDst) + 1)
    expect(getDayNumber(new Date(2027, 9, 31, 23, 30))).toBe(
      getDayNumber(new Date(2027, 9, 30, 23, 30)) + 1,
    )
  })
})

describe("getDailyWord", () => {
  it("видає слова по порядку і йде по колу", () => {
    expect(getDailyWord(0)).toBe(ANSWER_WORDS[0])
    expect(getDailyWord(1)).toBe(ANSWER_WORDS[1])
    expect(getDailyWord(ANSWER_WORDS.length)).toBe(ANSWER_WORDS[0])
    expect(getDailyWord(-1)).toBe(ANSWER_WORDS.at(-1))
  })
})

describe("getRandomWord", () => {
  it("ніколи не повторює поточне слово", () => {
    for (const random of [0, 0.5, 0.999]) {
      vi.spyOn(Math, "random").mockReturnValue(random)
      const word = getRandomWord(ANSWER_WORDS[0])
      expect(word).not.toBe(ANSWER_WORDS[0])
      expect(ANSWER_WORDS).toContain(word)
    }
  })
})

describe("getMsUntilNextDay", () => {
  it("рахує час до місцевої півночі", () => {
    expect(getMsUntilNextDay(new Date(2026, 9, 30, 23, 0))).toBe(60 * 60 * 1000)
  })
})
