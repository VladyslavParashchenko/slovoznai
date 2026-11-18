<script lang="ts">
  import { resolve } from "$app/paths"
  import { onMount } from "svelte"
  import { buildChallengeUrl, WORD_LENGTH } from "../model/challenge"
  import { ChallengeDraft } from "../model/challenge-draft.svelte"
  import { SHAKE_MS } from "../model/game-state.svelte"
  import { getGameKey } from "../model/physical-keyboard"
  import { shareResult } from "../model/share"
  import GameMessage from "./GameMessage.svelte"
  import WordBoard from "./WordBoard.svelte"
  import WordKeyboard from "./WordKeyboard.svelte"

  let {
    invalidLink = false,
    keysEnabled = true,
  }: { invalidLink?: boolean; keysEnabled?: boolean } = $props()

  const ERROR_MS = 1800
  const draft = new ChallengeDraft()

  // Форма перемонтовується разом зі сторінкою, тож проп достатньо прочитати один раз.
  // svelte-ignore state_referenced_locally
  let message = $state(
    invalidLink ? "Посилання пошкоджене — загадайте своє слово" : "",
  )
  let success = $state(false)
  let link = $state<string | null>(null)
  let shakeRow = $state<number | null>(null)
  let messageTimer: ReturnType<typeof setTimeout> | undefined
  let shakeTimer: ReturnType<typeof setTimeout> | undefined
  let shakeFrame = 0

  function showMessage(text: string, { error = false } = {}) {
    clearTimeout(messageTimer)
    message = text
    success = !error && Boolean(text)
    if (error) messageTimer = setTimeout(() => (message = ""), ERROR_MS)
  }

  function reject(text: string) {
    link = null
    showMessage(text, { error: true })
    shakeRow = null
    cancelAnimationFrame(shakeFrame)
    clearTimeout(shakeTimer)
    shakeFrame = requestAnimationFrame(() => {
      shakeRow = 0
      shakeTimer = setTimeout(() => (shakeRow = null), SHAKE_MS)
    })
  }

  async function submit() {
    if (draft.word.length !== WORD_LENGTH) {
      return reject(`Потрібно ${WORD_LENGTH} літер`)
    }
    const url = buildChallengeUrl(
      draft.word,
      new URL(resolve("/challenge"), location.origin).href,
    )
    if (!url) return reject("Такого слова немає у словнику")
    link = url
    showMessage("")
    const status = await shareResult(
      `Відгадай моє слово у «Словознаї»!\n${url}`,
    )
    // Поки йшло поширення, слово могли змінити — тоді статус уже не про нього.
    if (link !== url) return
    // Буфер обміну буває недоступний — тоді посилання лишається в полі нижче.
    showMessage(
      status === "Скопійовано!"
        ? "Посилання скопійовано!"
        : status
          ? "Скопіюйте посилання вище"
          : "Посилання готове",
    )
  }

  function press(key: string) {
    if (key === "enter") return void submit()
    if (key === "backspace") draft.erase()
    else if (key === "arrowleft") draft.step(-1)
    else if (key === "arrowright") draft.step(1)
    else draft.type(key)
    link = null
    if (message) showMessage("")
  }

  onMount(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = keysEnabled ? getGameKey(event) : null
      if (!key) return
      event.preventDefault()
      press(key)
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
      clearTimeout(messageTimer)
      clearTimeout(shakeTimer)
      cancelAnimationFrame(shakeFrame)
    }
  })
</script>

<!-- Готове посилання стає на місце пояснення, щоб сторінка не росла у висоту. -->
{#if link}
  <input
    class="link"
    aria-label="Посилання на челендж"
    value={link}
    readonly
    onfocus={(event) => event.currentTarget.select()}
  />
{:else}
  <p class="intro">
    Загадайте слово з п’яти літер — друг відгадуватиме його за посиланням. Саме
    слово в посиланні не видно.
  </p>
{/if}
<WordBoard
  rows={draft.rows}
  activeRow={0}
  revealRow={null}
  {shakeRow}
  winRow={null}
  cursor={draft.cursor}
  onSelect={(index) => draft.select(index)}
/>
<GameMessage {message} {success} />
<WordKeyboard keyboardStates={{}} onKeyPress={press} />
<button class="share" onclick={submit}>Поділитися посиланням</button>

<style>
  .share {
    width: min(100%, 22rem);
    margin: clamp(0.5rem, 1.8dvh, 1.1rem) auto 0;
    padding: clamp(0.55rem, 1.6dvh, 0.8rem) 1.15rem;
    border: 0;
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-weight: 800;
  }
  .share:hover {
    background: var(--color-accent-strong);
  }
  .intro {
    margin: clamp(0.4rem, 1.5dvh, 1rem) auto 0;
    max-width: 24rem;
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.45;
  }
  .link {
    width: min(100%, 22rem);
    margin: clamp(0.4rem, 1.5dvh, 1rem) auto 0;
    padding: 0.5rem 0.8rem;
    border: 1.5px solid var(--color-border);
    border-radius: 0.6rem;
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
  }
  .link:focus-visible {
    border-color: var(--color-accent);
    outline: none;
  }
</style>
