<script lang="ts">
  import Modal from "./Modal.svelte"

  let { open, attemptLimit, onClose }: { open: boolean; attemptLimit: number; onClose: () => void } = $props()

  const examples = [
    { word: "весна", index: 0, state: "correct", text: "Літера «В» є в слові й стоїть на своєму місці." },
    { word: "пісня", index: 2, state: "present", text: "Літера «С» є в слові, але в іншому місці." },
    { word: "зірка", index: 3, state: "absent", text: "Літери «К» у слові немає." },
  ] as const
</script>

<Modal {open} title="Як грати" {onClose}>
  <p>Відгадайте слово з п’яти літер за {attemptLimit} спроб. Кожна спроба має бути справжнім словом.</p>
  <p>Після кожної спроби колір плиток підкаже, наскільки ви близько.</p>
  {#each examples as example (example.word)}
    <div class="example">
      <div class="tiles" aria-hidden="true">
        {#each example.word as letter, index (index)}
          <span class={index === example.index ? `tile ${example.state}` : "tile"}>{letter}</span>
        {/each}
      </div>
      <p>{example.text}</p>
    </div>
  {/each}
  <p class="note">Щодня о півночі з’являється нове слово. Після гри можна тренуватися на випадкових словах.</p>
</Modal>

<style>
  p { margin:0 0 .8rem; color:var(--color-ink); font-size:.92rem; line-height:1.5; }
  .example { margin:1.1rem 0; }
  .example p { margin-top:.5rem; }
  .tiles { display:flex; gap:.3rem; }
  .tile { display:grid; width:2.4rem; height:2.4rem; place-items:center; border:1.5px solid var(--color-border); border-radius:.4rem; background:var(--color-surface); font-weight:800; text-transform:uppercase; }
  .tile.correct { border-color:var(--color-correct); background:var(--color-correct); color:var(--color-accent-contrast); }
  .tile.present { border-color:var(--color-present); background:var(--color-present); color:var(--color-present-contrast); }
  .tile.absent { border-color:var(--color-absent); background:var(--color-absent); color:#fff; }
  .note { margin:1.2rem 0 0; padding-top:1rem; border-top:1px solid var(--color-border); color:var(--color-muted); }
</style>
