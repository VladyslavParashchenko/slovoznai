import { describe, expect, it } from "vitest"
import { ACCEPTED_WORDS } from "../data/dictionary"
import {
  buildChallengeUrl,
  decodeChallenge,
  encodeChallenge,
} from "./challenge"

describe("код челенджу", () => {
  it("кожне слово словника кодується в унікальний короткий код і розкодовується назад", () => {
    const codes = new Set<string>()
    for (const word of ACCEPTED_WORDS) {
      const code = encodeChallenge(word)
      expect(code).toMatch(/^[0-9a-z]{1,5}$/)
      expect(decodeChallenge(code)).toBe(word)
      codes.add(code!)
    }
    expect(codes.size).toBe(ACCEPTED_WORDS.size)
  })

  it("не видає слово в коді", () => {
    expect(encodeChallenge("весна")).not.toContain("весна")
    // Слова, що відрізняються однією літерою, не мають схожих кодів.
    expect(encodeChallenge("мірка")).not.toBe(encodeChallenge("марка"))
    expect(encodeChallenge("мірка")?.slice(1)).not.toBe(
      encodeChallenge("марка")?.slice(1),
    )
  })

  it("не кодує слова поза словником", () => {
    expect(encodeChallenge("ааааа")).toBeNull()
    expect(encodeChallenge("весн")).toBeNull()
    expect(encodeChallenge("ВЕСНА")).toBeNull()
  })

  it("приймає код у будь-якому регістрі", () => {
    const code = encodeChallenge("мірка")!
    expect(decodeChallenge(code.toUpperCase())).toBe("мірка")
    expect(decodeChallenge(` ${code} `)).toBe("мірка")
  })

  it("відкидає зіпсовані коди", () => {
    for (const code of [
      null,
      "",
      "zzzzzz",
      "ZZZ",
      "a-b",
      "весна",
      "zzzzz",
      "ZZZZZZ",
    ]) {
      expect(decodeChallenge(code)).toBeNull()
    }
  })

  it("будує посилання з кодом у параметрі", () => {
    const code = encodeChallenge("весна")
    expect(buildChallengeUrl("весна", "https://example.com/")).toBe(
      `https://example.com/?c=${code}`,
    )
    expect(
      buildChallengeUrl("весна", "https://example.com/game/?c=old#x"),
    ).toBe(`https://example.com/game/?c=${code}`)
    expect(buildChallengeUrl("ааааа", "https://example.com/")).toBeNull()
  })
})
