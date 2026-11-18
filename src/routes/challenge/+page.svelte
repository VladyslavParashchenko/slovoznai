<script lang="ts">
  import { page } from "$app/state"
  import WordGame from "$lib/features/word-game/WordGame.svelte"
  import { CHALLENGE_PARAM } from "$lib/features/word-game/model/challenge"
</script>

<svelte:head>
  <title>Словознай — челендж</title>
  <meta
    name="description"
    content="Відгадайте слово, яке загадав друг, або загадайте своє."
  />
</svelte:head>

<!-- Новий код в адресі — нова партія: перемонтовуємо гру. -->
{#key page.url.search}
  <WordGame
    page="challenge"
    challengeCode={page.url.searchParams.get(CHALLENGE_PARAM)}
  />
{/key}
