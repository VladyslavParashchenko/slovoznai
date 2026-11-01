import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest"
import { ACCEPTED_WORDS } from "../data/dictionary"
import { getDailyWord } from "./daily"
import { getKnownLetters } from "./game"
import { ATTEMPT_LIMIT, WordGameState } from "./game-state.svelte"

const TODAY = new Date(2026, 9, 30, 12)
const TARGET = getDailyWord(1)
const WRONG_WORDS = ["моряк", "подив", "мірка", "марка", "корал", "сходи"]

let game: WordGameState
let onDailyFinish: Mock<() => void>

function createGame() {
  game?.destroy()
  game = new WordGameState({ reduceMotion: true, onDailyFinish })
  game.startDaily()
  return game
}

function type(word: string) {
  for (const letter of word) game.press(letter)
}

/** Вписує слово поверх усього рядка, включно з підказками. */
function guess(word: string) {
  ;[...word].forEach((letter, index) => {
    game.select(index)
    game.press(letter)
  })
  game.press("enter")
  vi.runAllTimers()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
  localStorage.clear()
  onDailyFinish = vi.fn<() => void>()
  createGame()
})

afterEach(() => {
  game.destroy()
  vi.useRealTimers()
})

describe("набір слова", () => {
  it("починає з чистого поля і слова дня", () => {
    expect(game.mode).toBe("daily")
    expect(game.target).toBe(TARGET)
    expect(game.rows).toHaveLength(ATTEMPT_LIMIT)
    expect(game.activeRow).toBe(0)
  })

  it("обмежує чернетку довжиною слова і стирає літери", () => {
    for (const letter of "подивись") game.press(letter)
    expect(game.draftWord).toBe("подив")

    game.press("backspace")
    expect(game.draftWord).toBe("поди")
    game.press("backspace")
    expect(game.draftWord).toBe("под")
  })

  it("вписує літеру в обрану клітинку і йде далі по порядку", () => {
    type("по")
    game.select(3)
    game.press("и")
    expect(game.draft.map((cell) => cell.letter)).toEqual([
      "п",
      "о",
      "",
      "и",
      "",
    ])
    expect(game.cursor).toBe(4)

    game.select(2)
    type("д")
    expect(game.cursor).toBe(3)
    game.select(4)
    type("в")
    expect(game.draftWord).toBe("подив")
  })

  it("Backspace не стирає літери праворуч від курсора", () => {
    type("по")
    game.select(0)
    game.press("backspace")
    expect(game.draftWord).toBe("о")
    game.press("backspace")
    expect(game.draftWord).toBe("о")
    expect(game.cursor).toBe(0)
  })

  it("стрілки рухають курсор у межах рядка", () => {
    game.press("arrowleft")
    expect(game.cursor).toBe(0)
    for (let step = 0; step < 9; step++) game.press("arrowright")
    expect(game.cursor).toBe(4)
  })

  describe("підказки з відгаданих літер", () => {
    let hint: string

    beforeEach(() => {
      hint = [...ACCEPTED_WORDS].find(
        (word) =>
          word !== TARGET &&
          word.length === TARGET.length &&
          word[0] === TARGET[0] &&
          word[1] !== TARGET[1],
      )!
      guess(hint)
    })

    it("підставляються в новий рядок, набір їх перескакує", () => {
      expect(game.draft.map((cell) => cell.letter)).toEqual(
        getKnownLetters([hint], TARGET),
      )
      expect(game.draft[0].hint).toBe(true)
      expect(game.cursor).toBe(game.draft.findIndex((cell) => !cell.hint))

      type([...TARGET].filter((_, index) => !game.draft[index].hint).join(""))
      expect(game.draftWord).toBe(TARGET)
    })

    it("Backspace їх не чіпає, але обрану підказку стирає", () => {
      type(TARGET.slice(1, 2))
      game.press("backspace")
      game.press("backspace")
      expect(game.draft[0].letter).toBe(TARGET[0])

      game.select(0)
      game.press("backspace")
      expect(game.draft[0].letter).toBe("")
      expect(game.draft[0].hint).toBe(false)
    })

    it("стрілки перескакують підказки", () => {
      const free = game.cursor
      game.press("arrowleft")
      expect(game.cursor).toBe(free)
    })

    it("вписана в обрану підказку літера стає звичайною", () => {
      game.select(0)
      game.press("я")
      expect(game.draft[0].letter).toBe("я")
      expect(game.draft[0].hint).toBe(false)
    })
  })

  it("курсор недоступний під час анімації і після кінця гри", () => {
    type(TARGET)
    game.press("enter")
    expect(game.editCursor).toBeNull()
    vi.runAllTimers()
    expect(game.editCursor).toBeNull()
  })
})

describe("перевірка спроби", () => {
  it.each([
    ["коротке слово", "под", "Потрібно 5 літер"],
    ["слово не зі словника", "ааааа", "Такого слова немає у словнику"],
  ])("відхиляє %s", (_, word, message) => {
    type(word)
    game.press("enter")

    expect(game.guesses).toEqual([])
    expect(game.message).toBe(message)
    vi.advanceTimersToNextFrame()
    expect(game.shakeRow).toBe(0)
    vi.runAllTimers()
    expect(game.message).toBe("")
    expect(game.shakeRow).toBeNull()
  })

  it("не трясе рядок нової гри після помилки в попередній", () => {
    game.press("enter")
    game.startPractice()
    vi.advanceTimersToNextFrame()

    expect(game.shakeRow).toBeNull()
  })

  it("не приймає те саме слово двічі", () => {
    guess("подив")
    type("подив")
    game.press("enter")

    expect(game.guesses).toEqual(["подив"])
    expect(game.message).toBe("Це слово вже було")
  })
})

describe("слово дня", () => {
  it("перемога записується в статистику і відкриває її", () => {
    guess("подив")
    guess(TARGET)

    expect(game.won).toBe(true)
    expect(game.showResult).toBe(true)
    expect(game.winRow).toBe(1)
    expect(game.message).toBe("Неймовірно!")
    expect(game.stats).toMatchObject({ played: 1, wins: 1, currentStreak: 1 })
    expect(game.stats.distribution[1]).toBe(1)
    expect(game.streak).toBe(1)
    expect(onDailyFinish).toHaveBeenCalledOnce()
  })

  it("після кінця гри клавіші не працюють", () => {
    guess(TARGET)
    game.press("а")

    expect(game.draft).toEqual([])
  })

  it("поразка показує загадане слово", () => {
    WRONG_WORDS.forEach(guess)

    expect(game.won).toBe(false)
    expect(game.isFinished).toBe(true)
    expect(game.message).toBe(`Загадане слово: ${TARGET.toUpperCase()}`)
    expect(game.stats).toMatchObject({ played: 1, wins: 0, currentStreak: 0 })
    expect(game.shareText()).toMatch(/^Словознай №2 X\/6/)
  })

  it("спроби переживають перезавантаження сторінки", () => {
    guess("подив")
    createGame()

    expect(game.guesses).toEqual(["подив"])
    expect(game.activeRow).toBe(1)
  })

  it("завершена гра відновлюється з результатом", () => {
    guess(TARGET)
    createGame()

    expect(game.draft).toEqual([])
    expect(game.rows[1].every((cell) => !cell.letter && !cell.hint)).toBe(true)
    expect(game.showResult).toBe(true)
    expect(game.message).toBe("Геніально!")
    expect(game.stats.played).toBe(1)
  })

  it("відкидає зіпсовані збережені спроби", () => {
    localStorage.setItem(
      "slovoznai:daily:v1",
      JSON.stringify({ day: 1, guesses: ["подив", "ой", 42, TARGET, "марка"] }),
    )
    createGame()

    expect(game.guesses).toEqual(["подив", TARGET])
  })

  it("опівночі переходить на нове слово", () => {
    guess("подив")
    vi.setSystemTime(new Date(2026, 9, 31, 0, 1))
    game.checkNewDay()

    expect(game.day).toBe(2)
    expect(game.target).toBe(getDailyWord(2))
    expect(game.guesses).toEqual([])
  })
})

describe("тренування", () => {
  it("дає інше слово і не чіпає статистику", () => {
    game.startPractice()
    expect(game.mode).toBe("practice")
    expect(game.target).not.toBe(TARGET)

    guess(game.target)
    expect(game.won).toBe(true)
    expect(game.stats.played).toBe(0)
    expect(onDailyFinish).not.toHaveBeenCalled()
  })

  it("не переходить на новий день посеред тренування", () => {
    game.startPractice()
    const practiceWord = game.target
    vi.setSystemTime(new Date(2026, 9, 31, 0, 1))
    game.checkNewDay()

    expect(game.target).toBe(practiceWord)
  })
})
