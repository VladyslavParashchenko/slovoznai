<script lang="ts">
  import { onMount } from "svelte"
  import GameHeader from "./components/GameHeader.svelte"
  import GameMessage from "./components/GameMessage.svelte"
  import HelpDialog from "./components/HelpDialog.svelte"
  import ResultActions from "./components/ResultActions.svelte"
  import StatsDialog from "./components/StatsDialog.svelte"
  import WordBoard from "./components/WordBoard.svelte"
  import WordKeyboard from "./components/WordKeyboard.svelte"
  import { ATTEMPT_LIMIT, WordGameState } from "./model/game-state.svelte"
  import { getGameKey } from "./model/physical-keyboard"
  import { shareResult } from "./model/share"

  let dialog = $state<"help" | "stats" | null>(null)

  const game = new WordGameState({
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    onDailyFinish: () => (dialog = "stats"),
  })
  game.startDaily()

  const closeDialog = () => (dialog = null)
  const share = () => shareResult(`${game.shareText()}\n\n${location.origin}`)

  onMount(() => {
    if (!game.stats.played && !game.guesses.length) dialog = "help"

    const handleKey = (event: KeyboardEvent) => {
      const key = dialog ? null : getGameKey(event)
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
    onLogoClick={() => game.startDaily()}
    onHelp={() => (dialog = "help")}
    onStats={() => (dialog = "stats")}
  />
  <section class="game" aria-labelledby="game-title">
    <h1 id="game-title">
      {game.mode === "daily" ? "Слово дня" : "Тренування"}
      <span class="title-separator" aria-hidden="true"></span>
      <em>{game.target.length} літер</em>
    </h1>
    <WordBoard
      rows={game.rows}
      activeRow={game.activeRow}
      revealRow={game.revealRow}
      shakeRow={game.shakeRow}
      winRow={game.winRow}
    />
    <GameMessage message={game.message} success={game.showResult && game.won} />
    {#if game.showResult}
      <ResultActions
        mode={game.mode}
        onStats={() => (dialog = "stats")}
        onDaily={() => game.startDaily()}
        onPractice={() => game.startPractice()}
      />
    {/if}
    <WordKeyboard
      keyboardStates={game.keyboardStates}
      disabled={game.isFinished}
      onKeyPress={(key) => game.press(key)}
    />
  </section>
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
    min-height: 100dvh;
    padding: 1.25rem max(1.25rem, calc((100vw - 31rem) / 2));
    padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
    background: var(--color-paper);
  }
  .game {
    margin: 2.4rem auto 0;
    text-align: center;
  }
  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    margin: 0.8rem 0 1.5rem;
    font-family: var(--font-sans);
    font-size: clamp(1.65rem, 6vw, 2.4rem);
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
  @media (max-width: 420px) {
    .page-shell {
      padding-inline: 0.85rem;
    }
    .game {
      margin-top: 1.8rem;
    }
  }
</style>
