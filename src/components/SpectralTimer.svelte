<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";
  import { type Snippet } from "svelte";

  let {
    tracker,
    childrenLeft,
    childrenRight,
  }: {
    tracker: FishingTracker;
    childrenLeft: Snippet;
    childrenRight: Snippet;
  } = $props();

  let fullTime = $derived(
    tracker.currentOceanFishingPhase?.spectralDuration ?? 0,
  );
  let remainTime = $state(0);
  let intervalId: number;

  $effect(() => {
    const isSpectral = (tracker.currentOceanFishingPhase?.spectralDuration ?? 0) > 0;
    updateRemain();
    if (isSpectral) {
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
    const phase = tracker.currentOceanFishingPhase;
    if (!phase || phase.spectralAt === 0) {
      remainTime = 0;
      return;
    }
    const endAt = Math.min(
      phase.spectralAt + phase.spectralDuration,
      phase.beginAt + phase.duration,
    );
    const remain = endAt - Date.now();
    remainTime = remain > 0 ? remain : 0;
  }

  let remainText = $derived.by(() => {
    if (remainTime === 0) {
      return "";
    }
    const seconds = (remainTime / 1000).toFixed(1);
    return `${seconds}s`;
  });

  let style = $derived.by(() => {
    let str = "";
    str += `--now-time:${remainTime};`;
    str += `--total-time:${fullTime};`;
    return str;
  });
</script>

<div class="control-bar" data-style={tracker.config.Theme}>
  {#if fullTime > 0}
    <div class="bkg-bar" {style}></div>
  {/if}
  <div class="left">
    {@render childrenLeft()}
  </div>
  <div class="right">
    {@render childrenRight()}
    {#if remainText}
      <span class="xiv-text blue spectral-hint">幻海流</span>
      <span class="xiv-text blue remain-text">{remainText}</span>
    {/if}
  </div>
</div>

<style>
  .control-bar {
    position: relative;
    display: flex;
    justify-content: space-between;
    user-select: none;
    margin-top: -20px;
    height: 20px;
    text-align: left;
    font-size: 13px;

    & div {
      display: flex;
      gap: 5px;
    }
  }

  [data-style="minimal"] .bkg-bar {
    position: absolute;
    width: calc(100% * var(--now-time) / var(--total-time));
    right: 0;
    top: 2px;
    height: 16px;
    background-color: #7f0f9b80;
    z-index: -1;
    border-radius: 10px;
  }

  [data-style="minimal"] .spectral-hint {
    display: none;
  }

  [data-style="minimal"] .remain-text {
    font-size: 12px;
    line-height: 20px;
    padding: 0 5px;
  }
</style>
