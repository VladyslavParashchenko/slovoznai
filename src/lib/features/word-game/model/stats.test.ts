import { describe, expect, it } from "vitest"
import { createEmptyStats, getActiveStreak, recordResult } from "./stats"

const empty = createEmptyStats(6)

describe("recordResult", () => {
  it("записує перемогу в розподіл за кількістю спроб", () => {
    const stats = recordResult(empty, 10, 3)

    expect(stats).toMatchObject({
      played: 1,
      wins: 1,
      currentStreak: 1,
      maxStreak: 1,
      distribution: [0, 0, 1, 0, 0, 0],
      lastPlayedDay: 10,
      lastWonDay: 10,
    })
  })

  it("продовжує серію лише за перемоги вчора", () => {
    const twoDays = recordResult(recordResult(empty, 10, 3), 11, 4)
    expect(twoDays.currentStreak).toBe(2)

    const afterGap = recordResult(twoDays, 13, 2)
    expect(afterGap.currentStreak).toBe(1)
    expect(afterGap.maxStreak).toBe(2)
  })

  it("поразка обнуляє серію, але не рекорд", () => {
    const stats = recordResult(recordResult(empty, 10, 3), 11, null)

    expect(stats).toMatchObject({
      played: 2,
      wins: 1,
      currentStreak: 0,
      maxStreak: 1,
      lastPlayedDay: 11,
      lastWonDay: 10,
    })
  })

  it("не рахує той самий день двічі", () => {
    const stats = recordResult(empty, 10, 3)
    expect(recordResult(stats, 10, 1)).toBe(stats)
  })
})

describe("getActiveStreak", () => {
  const stats = recordResult(recordResult(empty, 10, 3), 11, 2)

  it("показує серію, поки не пропущено жодного дня", () => {
    expect(getActiveStreak(stats, 11)).toBe(2)
    expect(getActiveStreak(stats, 12)).toBe(2)
  })

  it("обнуляє серію, якщо вчорашнє слово не відгадане", () => {
    expect(getActiveStreak(stats, 13)).toBe(0)
    expect(getActiveStreak(empty, 0)).toBe(0)
  })
})
