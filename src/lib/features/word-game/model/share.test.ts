import { afterEach, describe, expect, it, vi } from "vitest"
import { buildShareText, shareResult } from "./share"

describe("buildShareText", () => {
  it("показує номер дня, рахунок і сітку без літер", () => {
    expect(buildShareText(1, ["сесть", "честь"], "честь", 6)).toBe(
      "Словознай №2 2/6\n\n⬛🟧🟧🟧🟧\n🟧🟧🟧🟧🟧",
    )
  })

  it("позначає поразку як X", () => {
    const guesses = Array(6).fill("подив")
    expect(buildShareText(0, guesses, "честь", 6)).toMatch(/^Словознай №1 X\/6/)
  })
})

describe("shareResult", () => {
  const writeText = vi.fn()
  const share = vi.fn()

  function mockBrowser({ coarse }: { coarse: boolean }) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: coarse }),
    })
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    })
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
  }

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("копіює текст на комп'ютері", async () => {
    mockBrowser({ coarse: false })

    expect(await shareResult("текст")).toBe("Скопійовано!")
    expect(writeText).toHaveBeenCalledWith("текст")
    expect(share).not.toHaveBeenCalled()
  })

  it("відкриває системне меню на телефоні", async () => {
    mockBrowser({ coarse: true })

    expect(await shareResult("текст")).toBeNull()
    expect(share).toHaveBeenCalledWith({ text: "текст" })
  })

  it("мовчить, якщо гравець закрив меню", async () => {
    mockBrowser({ coarse: true })
    share.mockRejectedValue(new DOMException("", "AbortError"))

    expect(await shareResult("текст")).toBeNull()
  })

  it("повідомляє про помилку копіювання", async () => {
    mockBrowser({ coarse: false })
    writeText.mockRejectedValue(new Error("denied"))

    expect(await shareResult("текст")).toBe("Не вдалося")
  })
})
