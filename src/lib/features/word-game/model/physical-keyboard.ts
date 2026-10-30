import { PHYSICAL_KEY_MAP } from "../data/dictionary"
import { normalizeWord } from "./game"

export function getGameKey(event: KeyboardEvent): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null

  if (event.key === "Enter") {
    const activatesFocusedButton =
      event.target instanceof HTMLButtonElement &&
      !event.target.closest(".keyboard")
    return event.repeat || activatesFocusedButton ? null : "enter"
  }
  if (event.key === "Backspace") return "backspace"

  const letter = normalizeWord(event.key)
  return letter.length === 1 ? letter : (PHYSICAL_KEY_MAP[event.code] ?? null)
}
