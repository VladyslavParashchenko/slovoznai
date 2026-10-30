import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createEmptyStats, recordResult } from "./stats"
import { loadDailyGame, loadStats, saveDailyGame, saveStats } from "./storage"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("партія дня", () => {
  it("відновлює спроби лише того самого дня", () => {
    saveDailyGame({ day: 5, guesses: ["подив"] })

    expect(loadDailyGame(5)).toEqual({ day: 5, guesses: ["подив"] })
    expect(loadDailyGame(6)).toBeNull()
  })

  it("ігнорує зіпсовані дані", () => {
    localStorage.setItem("slovoznai:daily:v1", "{not json")
    expect(loadDailyGame(5)).toBeNull()

    localStorage.setItem(
      "slovoznai:daily:v1",
      JSON.stringify({ day: 5, guesses: "подив" }),
    )
    expect(loadDailyGame(5)).toBeNull()
  })
})

describe("статистика", () => {
  it("зберігається і відновлюється", () => {
    const stats = recordResult(createEmptyStats(6), 3, 2)
    saveStats(stats)

    expect(loadStats(6)).toEqual(stats)
  })

  it("доповнює неповні дані значеннями за замовчуванням", () => {
    localStorage.setItem(
      "slovoznai:stats:v1",
      JSON.stringify({ played: 2, distribution: [1] }),
    )

    expect(loadStats(6)).toEqual({
      ...createEmptyStats(6),
      played: 2,
      distribution: [1, 0, 0, 0, 0, 0],
    })
  })

  it.each([
    ["null у розподілі", { played: 2, distribution: null }],
    ["рядки замість чисел", { played: "2", wins: -1, lastWonDay: "5" }],
  ])("відкидає зіпсовані поля: %s", (_, saved) => {
    localStorage.setItem("slovoznai:stats:v1", JSON.stringify(saved))

    expect(loadStats(6)).toEqual({
      ...createEmptyStats(6),
      played: typeof saved.played === "number" ? saved.played : 0,
    })
  })

  it.each(["null", "5", '"текст"'])("ігнорує статистику %s", (raw) => {
    localStorage.setItem("slovoznai:stats:v1", raw)
    expect(loadStats(6)).toBeNull()
  })

  it("повертає null, якщо статистики ще немає", () => {
    expect(loadStats(6)).toBeNull()
  })
})

it("гра не падає, якщо сховище недоступне", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("", "QuotaExceededError")
  })

  expect(() => saveStats(createEmptyStats(6))).not.toThrow()
})
