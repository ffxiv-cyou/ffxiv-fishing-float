<script lang="ts">
  import overlayToolkit from "overlay-toolkit";
  import Main from "./pages/Main.svelte";

  let prodMode = $state(overlayToolkit.IsOverlayPluginCEF());
  $effect(() => {
    if (prodMode) return;

    const interval = setInterval(() => {
      prodMode = overlayToolkit.IsOverlayPluginCEF();
    }, 1000);

    return () => clearInterval(interval);
  });

  // Loaded, remove loading hint
  document.getElementById("loading-hint")?.remove();

  let hash = $state(location.hash);
  window.addEventListener("hashchange", () => {
    hash = location.hash;
  });

  let route = $derived.by(() => {
    const pat = /#\/?(.+)/
    const match = pat.exec(hash);
    if (match && match.length > 1) {
      return `${match[1]}`;
    }
    return "main";
  });
</script>

<main data-prod={prodMode}>
  {#if route === "main"}
    <Main></Main>
  {/if}
</main>

<style>
  main[data-prod="true"] {
    width: 100%;
    height: 100%;
  }
  main {
    position: relative;
  }
</style>
