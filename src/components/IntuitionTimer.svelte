<script lang="ts">
  import ProgressBar from "./ProgressBar.svelte";
  import type { IntuitionCounter } from "@/model/IntuitionCounter";
  import type { Config } from "@/model/Config";

  let {
    intuition,
    config,
  }: {
    intuition: IntuitionCounter;
    config: Config;
  } = $props();

  let remainTime = $state(0);
  let intervalId: number;

  $effect(() => {
    const inIntuition = intuition.IntuitionDurationRemain > 0;
    updateRemain();
    if (inIntuition) {
      if (!intervalId) {
        intervalId = setInterval(updateRemain, 50);
      }
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = 0;
      }
    }
  });

  let totalTime = $derived(intuition.IntuitionDurationTotal);
  function updateRemain() {
    remainTime = intuition.IntuitionDurationRemain;
  }

  let theme: "default" | "minimal" | "box" = $derived.by(() => {
    switch (config.IntuitionTimer) {
      case "off":
        return "default";
      case "status":
        return config.Theme;
      case "counter":
        switch (config.Theme) {
          case "default":
            return "box";
          case "minimal":
            return "minimal";
        }
    }
  });

  let inlineMode = $derived(config.IntuitionTimer === "status");
  let align: "left" | "right" | "center" = $derived(
    config.intuitionTimer === "status" ? "right" : "left",
  );
  let color = $derived.by(() => {
    switch (config.IntuitionTimer) {
      case "off":
        return "#00000000";
      case "status":
        return "#0f9b2d80";
      case "counter":
        return config.HistoryLightColor;
    }
  });
</script>

{#if totalTime}
  <ProgressBar
    {config}
    value={remainTime}
    total={totalTime}
    hint="鱼识"
    {color}
    {theme}
    inline={inlineMode}
    {align}
  />
{/if}
