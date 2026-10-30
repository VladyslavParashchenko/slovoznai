<script lang="ts">
  import { getMsUntilNextDay } from "../model/daily"
  import type { GameStats } from "../model/types"
  import Modal from "./Modal.svelte"

  let {
    open,
    stats,
    streak,
    highlightAttempt,
    canShare,
    onShare,
    onClose,
  }: {
    open: boolean
    stats: GameStats
    streak: number
    highlightAttempt: number | null
    canShare: boolean
    onShare: () => Promise<string | null>
    onClose: () => void
  } = $props()

  let msLeft = $state(getMsUntilNextDay())
  let shareStatus = $state<string | null>(null)
  let shareTimer: ReturnType<typeof setTimeout> | undefined

  async function handleShare() {
    clearTimeout(shareTimer)
    shareStatus = await onShare()
    shareTimer = setTimeout(() => (shareStatus = null), 2000)
  }

  $effect(() => {
    if (!open) return
    msLeft = getMsUntilNextDay()
    const timer = setInterval(() => (msLeft = getMsUntilNextDay()), 1000)
    return () => {
      clearInterval(timer)
      clearTimeout(shareTimer)
    }
  })

  const winRate = $derived(
    stats.played ? Math.round((stats.wins / stats.played) * 100) : 0,
  )
  const maxCount = $derived(Math.max(1, ...stats.distribution))
  const countdown = $derived(
    [msLeft / 3_600_000, (msLeft / 60_000) % 60, (msLeft / 1000) % 60]
      .map((part) => String(Math.floor(part)).padStart(2, "0"))
      .join(":"),
  )
</script>

<Modal {open} title="Статистика" {onClose}>
  <dl class="summary">
    <div>
      <dt>Зіграно</dt>
      <dd>{stats.played}</dd>
    </div>
    <div>
      <dt>Перемог</dt>
      <dd>{winRate}%</dd>
    </div>
    <div>
      <dt>Серія</dt>
      <dd>{streak}</dd>
    </div>
    <div>
      <dt>Рекорд</dt>
      <dd>{stats.maxStreak}</dd>
    </div>
  </dl>

  <h3>Розподіл спроб</h3>
  <ol class="distribution">
    {#each stats.distribution as count, index (index)}
      <li>
        <span class="attempt">{index + 1}</span>
        <span class="bar-track"
          ><span
            class:highlight={highlightAttempt === index + 1}
            class="bar"
            style:width="{Math.max(8, (count / maxCount) * 100)}%">{count}</span
          ></span
        >
      </li>
    {/each}
  </ol>

  <div class="footer">
    <div class="next">
      <span>Наступне слово через</span>
      <strong>{countdown}</strong>
    </div>
    {#if canShare}<button class="share" onclick={handleShare}
        >{shareStatus ?? "Поділитися"}</button
      >{/if}
  </div>
</Modal>

<style>
  .summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin: 0 0 1.4rem;
    text-align: center;
  }
  .summary div {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.2rem;
  }
  dt {
    color: var(--color-muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  h3 {
    margin: 0 0 0.7rem;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .distribution {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
  }
  .attempt {
    width: 0.8rem;
    color: var(--color-muted);
  }
  .bar-track {
    flex: 1;
  }
  .bar {
    display: block;
    min-width: 1.6rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.3rem;
    background: var(--color-absent);
    color: #fff;
    text-align: right;
    transition: width 0.4s ease-out;
  }
  .bar.highlight {
    background: var(--color-correct);
    color: var(--color-accent-contrast);
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.4rem;
    padding-top: 1.1rem;
    border-top: 1px solid var(--color-border);
  }
  .next {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .next strong {
    color: var(--color-ink);
    font-size: 1.35rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .share {
    min-width: 8.5rem;
    border: 0;
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    padding: 0.7rem 1.15rem;
    font-weight: 800;
  }
  .share:hover {
    background: var(--color-accent-strong);
  }
</style>
