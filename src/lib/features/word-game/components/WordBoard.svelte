<script lang="ts">
  import {
    SHAKE_MS,
    TILE_FLIP_MS,
    TILE_STAGGER_MS,
  } from "../model/game-state.svelte"
  import type { BoardCell, LetterState } from "../model/types"

  let {
    rows,
    activeRow,
    revealRow,
    shakeRow,
    winRow,
  }: {
    rows: BoardCell[][]
    activeRow: number | null
    revealRow: number | null
    shakeRow: number | null
    winRow: number | null
  } = $props()

  const STATE_LABELS: Record<LetterState, string> = {
    correct: "на місці",
    present: "є в слові",
    absent: "немає",
    empty: "",
  }

  function cellLabel(cell: BoardCell) {
    if (!cell.letter) return "порожньо"
    const letter = cell.letter.toUpperCase()
    return cell.state === "empty"
      ? letter
      : `${letter} — ${STATE_LABELS[cell.state]}`
  }
</script>

<div
  class="board"
  role="group"
  aria-label="Ігрове поле"
  style:--flip-ms="{TILE_FLIP_MS}ms"
  style:--stagger-ms="{TILE_STAGGER_MS}ms"
  style:--shake-ms="{SHAKE_MS}ms"
>
  {#each rows as row, rowIndex (rowIndex)}
    <div
      class:active-row={rowIndex === activeRow}
      class:shake={rowIndex === shakeRow}
      class="word-row"
      style:--columns={row.length}
      role="group"
      aria-label="Спроба {rowIndex + 1}"
    >
      {#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
        <div
          class:filled={cell.letter}
          class:correct={cell.state === "correct"}
          class:present={cell.state === "present"}
          class:absent={cell.state === "absent"}
          class:reveal={rowIndex === revealRow}
          class:win={rowIndex === winRow}
          class="tile"
          style:--index={cellIndex}
          role="img"
          aria-label={cellLabel(cell)}
        >
          {cell.letter}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    gap: 0.42rem;
    margin: 1.25rem auto 1rem;
  }
  .word-row {
    display: grid;
    grid-template-columns: repeat(var(--columns), 1fr);
    gap: 0.42rem;
    width: min(100%, 19rem);
    margin: 0 auto;
  }
  .tile {
    --tile-bg: var(--color-surface);
    --tile-border: var(--color-muted);
    --tile-color: var(--color-ink);
    display: grid;
    aspect-ratio: 1;
    place-items: center;
    border: 1.5px solid var(--color-border);
    border-radius: 0.45rem;
    background: var(--color-surface);
    color: var(--color-ink);
    font-size: clamp(1.2rem, 6vw, 1.9rem);
    font-weight: 800;
    text-transform: uppercase;
    transition: border-color 0.15s;
    user-select: none;
  }
  .tile.filled {
    border-color: var(--color-muted);
    animation: pop 0.12s ease-out;
  }
  .tile.correct {
    --tile-bg: var(--color-correct);
    --tile-border: var(--color-correct);
    --tile-color: var(--color-correct-contrast);
  }
  .tile.present {
    --tile-bg: var(--color-present);
    --tile-border: var(--color-present);
    --tile-color: var(--color-present-contrast);
  }
  .tile.absent {
    --tile-bg: var(--color-absent);
    --tile-border: var(--color-absent);
    --tile-color: #fff;
  }
  .tile.correct,
  .tile.present,
  .tile.absent {
    border-color: var(--tile-border);
    background: var(--tile-bg);
    color: var(--tile-color);
    animation: none;
  }
  .tile.reveal {
    animation: flip var(--flip-ms) ease-in-out backwards;
    animation-delay: calc(var(--index) * var(--stagger-ms));
  }
  .tile.win {
    animation: bounce 0.5s ease-out;
    animation-delay: calc(var(--index) * 90ms);
  }
  .shake {
    animation: shake var(--shake-ms) ease-in-out;
  }

  @keyframes pop {
    50% {
      transform: scale(1.1);
    }
  }
  @keyframes flip {
    0% {
      transform: rotateX(0);
      border-color: var(--color-muted);
      background: var(--color-surface);
      color: var(--color-ink);
    }
    50% {
      transform: rotateX(90deg);
      border-color: var(--color-muted);
      background: var(--color-surface);
      color: var(--color-ink);
    }
    50.1% {
      transform: rotateX(90deg);
      border-color: var(--tile-border);
      background: var(--tile-bg);
      color: var(--tile-color);
    }
    100% {
      transform: rotateX(0);
    }
  }
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-30%);
    }
    70% {
      transform: translateY(5%);
    }
  }
  @keyframes shake {
    10%,
    90% {
      transform: translateX(-2px);
    }
    20%,
    80% {
      transform: translateX(4px);
    }
    30%,
    50%,
    70% {
      transform: translateX(-7px);
    }
    40%,
    60% {
      transform: translateX(7px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tile,
    .tile.filled,
    .tile.reveal,
    .tile.win,
    .shake {
      animation: none;
    }
  }
</style>
