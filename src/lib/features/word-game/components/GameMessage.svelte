<script lang="ts">
  let { message, success }: { message: string; success: boolean } = $props()
</script>

<div
  class:success
  class:visible={message}
  class="message"
  role="status"
  aria-live="polite"
>
  {message || " "}
</div>

<style>
  .message {
    min-height: 1.5rem;
    margin: 0 0 0.8rem;
    color: var(--color-accent-strong);
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .message.visible {
    opacity: 1;
  }
  .message.success {
    color: var(--color-correct);
  }
</style>
