<script lang="ts">
  import { getTheme, setTheme } from "$lib/theme"
  import IconButton from "./IconButton.svelte"
  import MoonIcon from "./icons/MoonIcon.svelte"
  import SunIcon from "./icons/SunIcon.svelte"

  let theme = $state(getTheme())

  $effect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
    const syncTheme = () => (theme = getTheme())
    colorScheme.addEventListener("change", syncTheme)
    return () => colorScheme.removeEventListener("change", syncTheme)
  })

  function toggle() {
    theme = theme === "dark" ? "light" : "dark"
    setTheme(theme)
  }
</script>

<IconButton
  label={theme === "dark" ? "Світла тема" : "Темна тема"}
  onclick={toggle}
>
  {#if theme === "dark"}
    <SunIcon />
  {:else}
    <MoonIcon />
  {/if}
</IconButton>
