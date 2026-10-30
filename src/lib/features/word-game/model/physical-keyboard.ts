import { PHYSICAL_KEY_MAP } from "../data/dictionary"
import { normalizeWord } from "./game"

/** Перетворює натискання фізичної клавіші на клавішу гри або null, якщо його слід ігнорувати. */
export function getGameKey(event: KeyboardEvent): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null

  if (event.key === "Enter") {
    // Enter на сфокусованій кнопці (не літері) має натиснути саме її.
    const onOtherButton =
      event.target instanceof HTMLButtonElement &&
      !event.target.closest(".keyboard")
    return event.repeat || onOtherButton ? null : "enter"
  }
  if (event.key === "Backspace") return "backspace"

  const letter = normalizeWord(event.key)
  return letter.length === 1 ? letter : (PHYSICAL_KEY_MAP[event.code] ?? null)
}
