<script lang="ts">
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import { onMount } from "svelte"
  import ChallengeCreator from "./components/ChallengeCreator.svelte"
  import GameHeader from "./components/GameHeader.svelte"
  import GameMessage from "./components/GameMessage.svelte"
  import HelpDialog from "./components/HelpDialog.svelte"
  import ResultActions from "./components/ResultActions.svelte"
  import StatsDialog from "./components/StatsDialog.svelte"
  import WordBoard from "./components/WordBoard.svelte"
  import WordKeyboard from "./components/WordKeyboard.svelte"
  import { decodeChallenge } from "./model/challenge"
  import { ATTEMPT_LIMIT, WordGameState } from "./model/game-state.svelte"
  import { getGameKey } from "./model/physical-keyboard"
  import { shareResult } from "./model/share"

  /**
   * `home` — слово дня і тренування; `challenge` — гра за кодом челенджу,
   * а без коду чи з поламаним кодом — форма, щоб загадати своє слово.
   */
  let {
    page = "home",
    challengeCode = null,
  }: { page?: "home" | "challenge"; challengeCode?: string | null } = $props()

  let dialog = $state<"help" | "stats" | null>(null)

  const game = new WordGameState({
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    onDailyFinish: () => (dialog = "stats"),
  })
  // Сторінка перемонтовується при зміні коду, тож читаємо пропси один раз.
  // svelte-ignore state_referenced_locally
  const challengeWord =
    page === "challenge" ? decodeChallenge(challengeCode) : null
  // svelte-ignore state_referenced_locally
  const creating = page === "challenge" && !challengeWord
  // svelte-ignore state_referenced_locally
  const invalidLink = creating && Boolean(challengeCode)
  if (challengeWord) game.startChallenge(challengeWord)
  else game.startDaily()

  const TITLES = {
    daily: "Слово дня",
    practice: "Тренування",
    challenge: "Челендж",
  } as const

  function startDaily() {
    if (page === "home") game.startDaily()
    else goto(resolve("/"))
  }
  const createChallenge = () => goto(resolve("/challenge"))
  const closeDialog = () => (dialog = null)
  const share = () => shareResult(`${game.shareText()}\n\n${location.origin}`)

  onMount(() => {
    if (!creating && !game.stats.played && !game.guesses.length) {
      dialog = "help"
    }

    const handleKey = (event: KeyboardEvent) => {
      const key =
        dialog || creating || game.isFinished ? null : getGameKey(event)
      if (!key) return
      event.preventDefault()
      game.press(key)
    }
    const checkNewDay = () => game.checkNewDay()
    const dayTimer = setInterval(checkNewDay, 30_000)

    window.addEventListener("keydown", handleKey)
    document.addEventListener("visibilitychange", checkNewDay)
    return () => {
      clearInterval(dayTimer)
      window.removeEventListener("keydown", handleKey)
      document.removeEventListener("visibilitychange", checkNewDay)
      game.destroy()
    }
  })
</script>

<main class="page-shell">
  <GameHeader
    onLogoClick={startDaily}
    onHelp={() => (dialog = "help")}
    onStats={() => (dialog = "stats")}
    onChallenge={createChallenge}
  />
  {#if creating}
    <section class="game" aria-labelledby="game-title">
      <h1 id="game-title">Кинути челендж</h1>
      <ChallengeCreator {invalidLink} keysEnabled={!dialog} />
    </section>
  {:else}
    <section class="game" aria-labelledby="game-title">
      <h1 id="game-title">
        {TITLES[game.mode]}
        <span class="title-separator" aria-hidden="true"></span>
        <em>{game.target.length} літер</em>
      </h1>
      <WordBoard
        rows={game.rows}
        activeRow={game.activeRow}
        revealRow={game.revealRow}
        shakeRow={game.shakeRow}
        winRow={game.winRow}
        cursor={game.editCursor}
        onSelect={(index) => game.select(index)}
      />
      <GameMessage
        message={game.message}
        success={game.showResult && game.won}
      />
      <!-- Кнопки результату стають на місце клавіатури, яка лишається невидимою
           і тримає висоту, щоб поле не змінювало розмір після кінця гри. -->
      <div class="controls" class:finished={game.showResult}>
        <WordKeyboard
          keyboardStates={game.keyboardStates}
          disabled={game.isFinished}
          onKeyPress={(key) => game.press(key)}
        />
        {#if game.showResult}
          <ResultActions
            mode={game.mode}
            onStats={() => (dialog = "stats")}
            onDaily={startDaily}
            onPractice={() => game.startPractice()}
            onChallenge={createChallenge}
          />
        {/if}
      </div>
    </section>
  {/if}
</main>

<HelpDialog
  open={dialog === "help"}
  attemptLimit={ATTEMPT_LIMIT}
  onClose={closeDialog}
/>
<StatsDialog
  open={dialog === "stats"}
  stats={game.stats}
  streak={game.streak}
  highlightAttempt={game.mode === "daily" && game.showResult && game.won
    ? game.guesses.length
    : null}
  canShare={game.mode === "daily" && game.showResult}
  onShare={share}
  onClose={closeDialog}
/>

<style>
  .page-shell {
    --space: clamp(0.4rem, 2dvh, 1.25rem);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    padding: var(--space) max(1.25rem, calc((100vw - 31rem) / 2));
    padding-bottom: max(var(--space), env(safe-area-inset-bottom));
    background: var(--color-paper);
  }
  .game {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    margin-top: clamp(0.25rem, 2dvh, 1.6rem);
    text-align: center;
  }
  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    margin: clamp(0.15rem, 1dvh, 0.8rem) 0 0;
    font-family: var(--font-sans);
    font-size: clamp(1.3rem, min(6vw, 4.2dvh), 2.4rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.04em;
  }
  h1 em {
    color: var(--color-accent);
    font-style: normal;
  }
  .title-separator {
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: var(--color-accent);
  }
  .controls {
    display: grid;
  }
  .controls > :global(*) {
    grid-area: 1 / 1;
  }
  .controls.finished > :global(.keyboard) {
    visibility: hidden;
  }
  @media (max-width: 420px) {
    .page-shell {
      padding-inline: 0.85rem;
    }
  }
</style>
