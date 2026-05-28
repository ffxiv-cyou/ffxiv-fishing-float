<script lang="ts">
  import overlayToolkit from "overlay-toolkit";
  import { routes } from "@/router/index";
  import Page from "./components/page.svelte";
  import * as Sentry from "@sentry/svelte";

  let prodMode = $state(false);
  let desktopMode = $state(false);

  function reloadEnvMode() {
    prodMode = overlayToolkit.IsOverlayPluginCEF();
    desktopMode = !!(window as any).OverlayPluginApi?.desktopApp;

    if (prodMode) {
      const overlayUuid = (window as any).OverlayPluginApi?.overlayUuid;
      const overlayName = (window as any).OverlayPluginApi?.overlayName;
      Sentry.setContext("overlay_env", { 
        uuid: overlayUuid, 
        name: overlayName, 
        desktop: desktopMode 
      });
    }
  }

  reloadEnvMode();

  $effect(() => {
    if (prodMode) 
      return;

    const interval = setInterval(() => {
      reloadEnvMode();
      if (prodMode) {
        clearInterval(interval);
      }
    }, 1000);
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

<main data-prod={prodMode} data-desktop={desktopMode}>
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
