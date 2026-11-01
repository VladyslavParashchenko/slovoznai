import { describe, expect, it } from "vitest"
import {
  createBoardRows,
  getKnownLetters,
  getKeyboardStates,
  normalizeWord,
  scoreGuess,
  shouldReplaceKeyState,
} from "./game"

describe("normalizeWord", () => {
  it("переводить у нижній регістр і прибирає зайві символи", () => {
    expect(normalizeWord(" ЧЕСТЬ! ")).toBe("честь")
    expect(normalizeWord("Ґанок'")).toBe("ґанок")
  })

  it("відкидає латиницю та російські літери", () => {
    expect(normalizeWord("abc")).toBe("")
    expect(normalizeWord("ыэъё")).toBe("")
  })
})

describe("scoreGuess", () => {
  it("розрізняє літери на місці, не на місці та відсутні", () => {
    expect(scoreGuess("карма", "марка")).toEqual([
      "present",
      "correct",
      "correct",
      "present",
      "correct",
    ])
    expect(scoreGuess("подив", "честь")).toEqual(Array(5).fill("absent"))
  })

  it("не підсвічує повтор, якщо літеру вже зараховано на її місці", () => {
    expect(scoreGuess("сесть", "честь")).toEqual([
      "absent",
      "correct",
      "correct",
      "correct",
      "correct",
    ])
  })

  it("зараховує повторну літеру не більше разів, ніж вона є в слові", () => {
    expect(scoreGuess("кокос", "моряк")).toEqual([
      "present",
      "correct",
      "absent",
      "absent",
      "absent",
    ])
  })
})

describe("createBoardRows", () => {
  it("будує поле зі спроб, чернетки та порожніх рядків", () => {
    const rows = createBoardRows(
      ["подив"],
      [
        { letter: "ч", hint: true },
        { letter: "о", hint: false },
      ],
      "честь",
      6,
    )

    expect(rows).toHaveLength(6)
    expect(rows[0].map((cell) => cell.letter).join("")).toBe("подив")
    expect(rows[0].every((cell) => cell.state === "absent")).toBe(true)
    expect(rows[1].map((cell) => cell.letter)).toEqual(["ч", "о", "", "", ""])
    expect(rows[1].every((cell) => cell.state === "empty")).toBe(true)
    expect(rows[1].map((cell) => cell.hint)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ])
    expect(rows[2].every((cell) => cell.letter === "")).toBe(true)
  })
})

describe("getKnownLetters", () => {
  it("збирає літери, які вже стояли на своєму місці", () => {
    expect(getKnownLetters(["часто", "місто"], "честь")).toEqual([
      "ч",
      "",
      "с",
      "т",
      "",
    ])
  })

  it("не вписує відповідь повністю", () => {
    expect(getKnownLetters(["часто", "мость"], "часть")).toEqual([
      "ч",
      "а",
      "с",
      "т",
      "",
    ])
  })
})

describe("стани клавіатури", () => {
  it("кращий стан літери не перезаписується гіршим", () => {
    expect(shouldReplaceKeyState(undefined, "absent")).toBe(true)
    expect(shouldReplaceKeyState("present", "correct")).toBe(true)
    expect(shouldReplaceKeyState("correct", "present")).toBe(false)
    expect(shouldReplaceKeyState("absent", "empty")).toBe(false)
  })

  it("збирає найкращий відомий стан кожної літери", () => {
    expect(getKeyboardStates(["сесть"], "честь")).toEqual({
      с: "correct",
      е: "correct",
      т: "correct",
      ь: "correct",
    })
    expect(getKeyboardStates(["марка", "карма"], "моряк")).toMatchObject({
      м: "correct",
      а: "absent",
      р: "correct",
      к: "present",
    })
  })
})
