<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    open,
    title,
    onClose,
    children,
  }: { open: boolean; title: string; onClose: () => void; children: Snippet } =
    $props()

  let dialog = $state<HTMLDialogElement>()

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  })

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialog) onClose()
  }
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="modal-title"
  onclose={onClose}
  onclick={handleBackdropClick}
>
  <div class="modal-body">
    <header>
      <h2 id="modal-title">{title}</h2>
      <button class="close" aria-label="Закрити" onclick={onClose}>✕</button>
    </header>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    width: min(calc(100% - 2rem), 26rem);
    max-height: calc(100dvh - 2rem);
    margin: auto;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    background: var(--color-surface);
    color: var(--color-ink);
    box-shadow: 0 1.5rem 3rem rgb(0 0 0 / 0.25);
  }
  dialog[open] {
    animation: modal-in 0.2s ease-out;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }
  .modal-body {
    padding: 1.25rem 1.35rem 1.5rem;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .close {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: var(--color-surface-muted);
    color: var(--color-muted);
    font-size: 0.85rem;
    font-weight: 800;
  }
  .close:hover {
    color: var(--color-ink);
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: translateY(0.75rem) scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] {
      animation: none;
    }
  }
</style>
