<script lang="ts">
  import overlayToolkit from "overlay-toolkit";
  import { routes } from "@/router/index";
  import Page from "./components/page.svelte";

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

  let url = $state("");
  function handleHashChange() {
    url = location.hash.replace("#", "");
    if (url === "") url = "/";
  }
  addEventListener("hashchange", handleHashChange);
  handleHashChange();
</script>

<main data-prod={prodMode}>
  {#each routes as route}
    <Page
      path={route.path}
      title={route.name}
      {url}
      component={route.component}
    />
  {/each}
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
