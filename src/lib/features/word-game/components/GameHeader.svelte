<script lang="ts">
  import logoWordmark from "$lib/assets/logo-wordmark.webp"
  import IconButton from "$lib/components/IconButton.svelte"
  import ThemeToggle from "$lib/components/ThemeToggle.svelte"
  import StatsIcon from "$lib/components/icons/StatsIcon.svelte"

  let {
    onLogoClick,
    onHelp,
    onStats,
  }: { onLogoClick: () => void; onHelp: () => void; onStats: () => void } =
    $props()
</script>

<header>
  <button class="brand" onclick={onLogoClick} aria-label="Словознай — слово дня"
    ><img src={logoWordmark} alt="" width="207" height="52" /></button
  >
  <div class="actions">
    <ThemeToggle />
    <IconButton label="Статистика" onclick={onStats}>
      <StatsIcon />
    </IconButton>
    <IconButton label="Як грати" onclick={onHelp}>?</IconButton>
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    margin-left: -0.2rem;
    padding: 0;
    border: 0;
    background: transparent;
    transition: transform 0.15s;
  }
  .brand:hover {
    transform: rotate(-2deg) scale(1.03);
  }
  .brand img {
    display: block;
    width: auto;
    height: 3.25rem;
  }
  .actions {
    display: flex;
    gap: 0.55rem;
  }
  @media (max-width: 400px) {
    .brand img {
      height: 2.75rem;
    }
  }
  @media (max-width: 360px) {
    .brand img {
      height: 2.3rem;
    }
  }
</style>
