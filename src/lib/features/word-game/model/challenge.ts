import { ACCEPTED_WORDS } from "../data/dictionary"

export const CHALLENGE_PARAM = "c"

const ALPHABET = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя"
export const WORD_LENGTH = 5
const BASE = ALPHABET.length
const SPACE = BASE ** WORD_LENGTH
// Афінна перестановка над усіма можливими словами: схожі слова дають зовсім різні коди.
// Це лише приховування від випадкового погляду, а не криптографія — ключ лежить у бандлі.
const MULTIPLIER = 15_485_863
const OFFSET = 23_456_789
const INVERSE = modInverse(MULTIPLIER, SPACE)
const CODE_PATTERN = /^[0-9a-z]{1,5}$/

/** Код слова зі словника для посилання на челендж або null, якщо слова немає у словнику. */
export function encodeChallenge(word: string): string | null {
  if (!ACCEPTED_WORDS.has(word)) return null
  let value = 0
  for (let index = WORD_LENGTH - 1; index >= 0; index--) {
    value = value * BASE + ALPHABET.indexOf(word[index])
  }
  return ((value * MULTIPLIER + OFFSET) % SPACE).toString(36)
}

/** Слово з коду посилання або null, якщо код зіпсований чи не веде до слова зі словника. */
export function decodeChallenge(code: string | null): string | null {
  const normalized = code?.trim().toLowerCase()
  if (!normalized || !CODE_PATTERN.test(normalized)) return null
  const scrambled = parseInt(normalized, 36)
  if (scrambled >= SPACE) return null

  // Добутки не перевищують SPACE² ≈ 1.5e15 — у межах точних цілих Number.
  let value = (((scrambled - OFFSET + SPACE) % SPACE) * INVERSE) % SPACE
  let word = ""
  for (let index = 0; index < WORD_LENGTH; index++) {
    word += ALPHABET[value % BASE]
    value = Math.floor(value / BASE)
  }
  return ACCEPTED_WORDS.has(word) ? word : null
}

/** Посилання на челендж відносно адреси гри, наприклад `https://site/?c=…`. */
export function buildChallengeUrl(word: string, gameUrl: string) {
  const code = encodeChallenge(word)
  if (!code) return null
  const url = new URL(gameUrl)
  url.search = ""
  url.hash = ""
  url.searchParams.set(CHALLENGE_PARAM, code)
  return url.href
}

function modInverse(value: number, modulus: number) {
  let [a, b, x, y] = [value, modulus, 1, 0]
  while (b) {
    const quotient = Math.floor(a / b)
    ;[a, b] = [b, a - quotient * b]
    ;[x, y] = [y, x - quotient * y]
  }
  if (a !== 1)
    throw new Error("Множник має бути взаємно простим з розміром простору")
  return ((x % modulus) + modulus) % modulus
}
