import { describe, expect, it } from "vitest"
import { ChallengeDraft } from "./challenge-draft.svelte"

function typed(word: string) {
  const draft = new ChallengeDraft()
  for (const letter of word) draft.type(letter)
  return draft
}

describe("набір слова для челенджу", () => {
  it("набирає не більше п’яти літер", () => {
    const draft = typed("мірками")
    expect(draft.word).toBe("мірка")
    expect(draft.cursor).toBe(5)
    expect(draft.rows).toHaveLength(1)
    expect(draft.rows[0].map((cell) => cell.letter).join("")).toBe("мірка")
  })

  it("Backspace стирає з кінця, а обрану клітинку — на місці", () => {
    const draft = typed("мірка")
    draft.erase()
    expect(draft.word).toBe("мірк")
    expect(draft.cursor).toBe(4)

    draft.select(1)
    draft.erase()
    expect(draft.letters).toEqual(["м", "", "р", "к", ""])
    expect(draft.cursor).toBe(1)
  })

  it("вписує літеру в обрану клітинку", () => {
    const draft = typed("мірка")
    draft.select(1)
    draft.type("а")
    expect(draft.word).toBe("марка")
  })

  it("стрілки не виходять за межі рядка", () => {
    const draft = new ChallengeDraft()
    draft.step(-1)
    expect(draft.cursor).toBe(0)
    draft.select(9)
    draft.step(1)
    expect(draft.cursor).toBe(4)
  })

  it("на порожньому рядку Backspace нічого не робить", () => {
    const draft = new ChallengeDraft()
    draft.erase()
    expect(draft.cursor).toBe(0)
    expect(draft.word).toBe("")
  })
})
