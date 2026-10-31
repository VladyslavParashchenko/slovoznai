import { afterEach, describe, expect, it } from "vitest"
import { getGameKey } from "./physical-keyboard"

function press(init: KeyboardEventInit, target: EventTarget = document.body) {
  let key: string | null = null
  target.addEventListener(
    "keydown",
    (event) => (key = getGameKey(event as KeyboardEvent)),
    { once: true },
  )
  target.dispatchEvent(new KeyboardEvent("keydown", { ...init, bubbles: true }))
  return key
}

afterEach(() => {
  document.body.replaceChildren()
})

describe("getGameKey", () => {
  it("приймає українські літери в будь-якому регістрі", () => {
    expect(press({ key: "ї", code: "BracketRight" })).toBe("ї")
    expect(press({ key: "Ґ", code: "Backslash" })).toBe("ґ")
  })

  it("перекладає латинську розкладку за фізичною клавішею", () => {
    expect(press({ key: "q", code: "KeyQ" })).toBe("й")
    expect(press({ key: "'", code: "Quote" })).toBe("є")
  })

  it("розпізнає Enter, Backspace і стрілки", () => {
    expect(press({ key: "Enter" })).toBe("enter")
    expect(press({ key: "Backspace" })).toBe("backspace")
    expect(press({ key: "ArrowLeft" })).toBe("arrowleft")
    expect(press({ key: "ArrowRight" })).toBe("arrowright")
  })

  it("ігнорує комбінації, автоповтор Enter і невідомі клавіші", () => {
    expect(press({ key: "r", code: "KeyR", ctrlKey: true })).toBeNull()
    expect(press({ key: "Enter", repeat: true })).toBeNull()
    expect(press({ key: "1", code: "Digit1" })).toBeNull()
  })

  it("не перехоплює Enter на інших кнопках", () => {
    const button = document.createElement("button")
    document.body.append(button)
    expect(press({ key: "Enter" }, button)).toBeNull()

    const keyboard = document.createElement("div")
    keyboard.className = "keyboard"
    const letterKey = document.createElement("button")
    keyboard.append(letterKey)
    document.body.append(keyboard)
    expect(press({ key: "Enter" }, letterKey)).toBe("enter")
  })
})
