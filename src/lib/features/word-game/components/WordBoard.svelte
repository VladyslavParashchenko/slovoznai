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
    cursor,
    onSelect,
  }: {
    rows: BoardCell[][]
    activeRow: number | null
    revealRow: number | null
    shakeRow: number | null
    winRow: number | null
    cursor: number | null
    onSelect: (index: number) => void
  } = $props()

  const STATE_LABELS: Record<LetterState, string> = {
    correct: "на місці",
    present: "є в слові",
    absent: "немає",
    empty: "",
  }

  function cellLabel(cell: BoardCell, index: number) {
    return `Літера ${index + 1}: ${cellText(cell)}`
  }

  function cellText(cell: BoardCell) {
    if (!cell.letter) return "порожньо"
    const letter = cell.letter.toUpperCase()
    if (cell.hint) return `${letter} — підказка`
    return cell.state === "empty"
      ? letter
      : `${letter} — ${STATE_LABELS[cell.state]}`
  }
</script>

<div
  class="board-area"
  style:--rows={rows.length}
  style:--columns={rows[0]?.length ?? 1}
>
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
        role="group"
        aria-label="Спроба {rowIndex + 1}"
      >
        {#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
          {@const active = rowIndex === activeRow}
          <svelte:element
            this={active ? "button" : "div"}
            class:filled={cell.letter}
            class:hint={cell.hint}
            class:correct={cell.state === "correct"}
            class:present={cell.state === "present"}
            class:absent={cell.state === "absent"}
            class:reveal={rowIndex === revealRow}
            class:win={rowIndex === winRow}
            class:selected={active && cellIndex === cursor}
            class="tile"
            style:--index={cellIndex}
            role={active ? undefined : "img"}
            type={active ? "button" : undefined}
            disabled={active ? cursor === null : undefined}
            aria-label={cellLabel(cell, cellIndex)}
            aria-current={active && cellIndex === cursor ? "true" : undefined}
            onclick={active ? () => onSelect(cellIndex) : undefined}
          >
            {cell.letter}
          </svelte:element>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  /* Поле займає весь вільний простір між заголовком і клавіатурою,
     а розмір клітинки підбирається так, щоб усі спроби влізли і в ширину, і у висоту. */
  .board-area {
    display: grid;
    flex: 1 1 0;
    /* На дуже низьких екранах (телефон у ландшафті) краще прокрутка, ніж зламане поле. */
    min-height: max(3rem, calc(var(--rows) * 1.85rem));
    place-items: center;
    margin: clamp(0.4rem, 1.8dvh, 1.25rem) 0 clamp(0.25rem, 1.2dvh, 1rem);
    container-type: size;
  }
  .board {
    --gap: 0.42rem;
    --tile: min(
      (19rem - (var(--columns) - 1) * var(--gap)) / var(--columns),
      (100cqw - (var(--columns) - 1) * var(--gap)) / var(--columns),
      (100cqh - (var(--rows) - 1) * var(--gap)) / var(--rows)
    );
    display: grid;
    gap: var(--gap);
  }
  .word-row {
    display: grid;
    grid-template-columns: repeat(var(--columns), var(--tile));
    gap: var(--gap);
  }
  .tile {
    --tile-bg: var(--color-surface);
    --tile-border: var(--color-muted);
    --tile-color: var(--color-ink);
    display: grid;
    height: var(--tile);
    place-items: center;
    border: 1.5px solid var(--color-border);
    border-radius: 0.45rem;
    background: var(--color-surface);
    color: var(--color-ink);
    font-size: calc(var(--tile) * 0.52);
    font-weight: 800;
    text-transform: uppercase;
    transition: border-color 0.15s;
    user-select: none;
  }
  button.tile {
    padding: 0;
    font-family: inherit;
  }
  button.tile:enabled {
    cursor: pointer;
  }
  .tile.hint {
    color: color-mix(in srgb, var(--color-ink) 40%, transparent);
    animation: none;
  }
  .tile.selected {
    border-color: var(--color-accent);
    box-shadow: inset 0 0 0 1.5px var(--color-accent);
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
    --tile-color: var(--color-absent-contrast);
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
