<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    label,
    onclick,
    children,
  }: { label: string; onclick: () => void; children: Snippet } = $props()
</script>

<button class="icon-button" aria-label={label} title={label} {onclick}
  >{@render children()}</button
>

<style>
  .icon-button {
    display: grid;
    width: 2.3rem;
    height: 2.3rem;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-muted);
    font-weight: 800;
    transition:
      color 0.15s,
      border-color 0.15s;
  }
  .icon-button:hover {
    border-color: var(--color-muted);
    color: var(--color-ink);
  }
</style>
