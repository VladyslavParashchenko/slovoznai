<script lang="ts">
  import BackspaceIcon from "$lib/components/icons/BackspaceIcon.svelte"
  import { KEYBOARD_ROWS } from "../data/dictionary"
  import type { KeyboardStates, LetterState } from "../model/types"

  let {
    keyboardStates,
    disabled = false,
    onKeyPress,
  }: {
    keyboardStates: KeyboardStates
    disabled?: boolean
    onKeyPress: (key: string) => void
  } = $props()

  const STATE_LABELS: Partial<Record<LetterState, string>> = {
    correct: "на місці",
    present: "є в слові",
    absent: "немає в слові",
  }

  function keyLabel(key: string) {
    const state = STATE_LABELS[keyboardStates[key]]
    return state ? `${key.toUpperCase()}, ${state}` : key.toUpperCase()
  }
</script>

<div class="keyboard" role="group" aria-label="Екранна клавіатура">
  {#each KEYBOARD_ROWS as keys, rowIndex (rowIndex)}
    <div class="key-row">
      {#each keys as key (key)}
        <button
          class:correct={keyboardStates[key] === "correct"}
          class:present={keyboardStates[key] === "present"}
          class:absent={keyboardStates[key] === "absent"}
          class="key"
          aria-label={keyLabel(key)}
          {disabled}
          onclick={() => onKeyPress(key)}>{key}</button
        >
      {/each}
    </div>
  {/each}
  <div class="key-row wide-row">
    <button class="key special" {disabled} onclick={() => onKeyPress("enter")}
      >ввід</button
    >
    <button
      class="key special delete-key"
      aria-label="Видалити літеру"
      {disabled}
      onclick={() => onKeyPress("backspace")}
    >
      <BackspaceIcon />
    </button>
  </div>
</div>

<style>
  .keyboard {
    display: grid;
    gap: 0.35rem;
    margin: 1rem auto 0;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .key-row {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
  }
  .wide-row {
    margin-top: 0.05rem;
  }
  .key {
    flex: none;
    width: min(2.25rem, calc((100% - 2.75rem) / 12));
    height: 2.8rem;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: var(--color-surface-muted);
    color: var(--color-ink);
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    transition:
      background-color 0.2s,
      color 0.2s;
  }
  .key:hover:not(:disabled, .correct, .present, .absent) {
    background: var(--color-accent-soft);
  }
  .key:active:not(:disabled) {
    transform: scale(0.92);
  }
  .key:disabled {
    cursor: default;
  }
  .key:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .key.correct {
    background: var(--color-correct);
    color: var(--color-accent-contrast);
  }
  .key.present {
    background: var(--color-present);
    color: var(--color-present-contrast);
  }
  .key.absent {
    background: var(--color-absent);
    color: #fff;
  }
  .key.special {
    width: 4.2rem;
    font-size: 0.68rem;
  }
  .key.delete-key {
    display: inline-grid;
    place-items: center;
  }
  @media (max-width: 420px) {
    .key {
      height: 2.65rem;
    }
    .key.special {
      width: 4rem;
    }
  }
</style>
