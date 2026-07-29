<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";

  let {
    tracker,
  }: {
    tracker: FishingTracker;
  } = $props();

  let remainTime = $state(0);
  let intervalId: number;

  $effect(() => {
    const inIntuition = tracker.intuition.IntuitionDuration > 0;
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

  function updateRemain() {
    remainTime = tracker.intuition.IntuitionDuration;
  }

  let remainText = $derived.by(() => {
    if (remainTime === 0) {
      return "";
    }
    const seconds = (remainTime).toFixed(1);
    return `${seconds}s`;
  });
</script>

{#if remainText}
  <span class="xiv-text blue spectral-hint">鱼识</span>
  <span class="xiv-text blue remain-text">{remainText}</span>
{/if}

<style>
</style>
