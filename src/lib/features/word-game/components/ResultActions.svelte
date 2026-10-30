<script lang="ts">
  import type { GameMode } from "../model/types"

  let {
    mode,
    onStats,
    onDaily,
    onPractice,
  }: {
    mode: GameMode
    onStats: () => void
    onDaily: () => void
    onPractice: () => void
  } = $props()
</script>

<div class="result-actions">
  {#if mode === "daily"}
    <button class="secondary" onclick={onStats}>Статистика</button>
    <button class="primary" onclick={onPractice}
      >Тренуватися <span>→</span></button
    >
  {:else}
    <button class="secondary" onclick={onDaily}>До слова дня</button>
    <button class="primary" onclick={onPractice}
      >Нове слово <span>→</span></button
    >
  {/if}
</div>

<style>
  .result-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: -0.15rem 0 0.9rem;
  }
  button {
    border-radius: 999px;
    padding: 0.65rem 1rem;
    font-weight: 800;
  }
  .primary {
    border: 0;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }
  .primary:hover {
    background: var(--color-accent-strong);
  }
  .primary span {
    margin-left: 0.35rem;
    color: inherit;
  }
  .secondary {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-ink);
  }
  .secondary:hover {
    border-color: var(--color-muted);
  }
</style>
