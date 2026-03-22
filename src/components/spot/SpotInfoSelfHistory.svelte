<script lang="ts">
  import SelfFishList from "./SelfFishList.svelte";

  import type { FishingTracker } from "@/model/FishingTracker";
  import { ButtonToggleGroup, ButtonToggle } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishDurationDistribution } from "@/model/API";

  let {
    tracker,
    spotID,
    baitID = $bindable(-1),
  }: {
    tracker: FishingTracker;
    spotID: number;
    baitID: number;
  } = $props();

  let historyCount = $state(0);
  let baits: number[] = $state([]);
  $effect(() => {
    tracker.history.storage.countHistory(spotID).then((count) => {
      historyCount = count;
    });
    tracker.history.storage.getBait(spotID).then((bait) => {
      baits = bait;
    });
  });

  function selectBait(id: string | string[] | null) {
    if (id === null) {
      baitID = -1;
      return;
    }
    if (Array.isArray(id)) {
      id = id[0];
    }

    const baitIdNumber = parseInt(id, 10);
    if (baitID === baitIdNumber) {
      baitID = -1;
    } else {
      baitID = baitIdNumber;
    }
  }

  let durations: FishDurationDistribution[] = $state([]);
  $effect(() => {
    let bait = baitID > 0 ? baitID : undefined;

    tracker.history.storage.getHistory(spotID, bait).then((records) => {
      durations = records.map((record) => ({
        fish_id: record.fish,
        bait_id: record.bait,
        is_chum: record.chum,
        count: record.count,
        tug_type: record.tugType + 1,
        outlier: 0,
        range: {
          min: record.minBiteTime * 1000,
          max: record.maxBiteTime * 1000,
          effective_min: record.minBiteTime * 1000,
          effective_max: record.maxBiteTime * 1000,
        },
        percentiles: {
          p1: 0,
          p5: 0,
          p10: 0,
          p25: 0,
          p50: ((record.minBiteTime + record.maxBiteTime) / 2) * 1000,
          p75: 0,
          p90: 0,
          p95: 0,
          p99: 0,
        },
      }));
    });
  });
</script>

{#if historyCount === 0}
  <div>
    <div>暂无本地钓鱼记录</div>
    <div class="text-sm">此功能仅在悬浮窗环境下可用</div>
  </div>
{:else}
  <ButtonToggleGroup onSelect={selectBait} value={baitID.toString()}>
    {#each baits as bait}
      <ButtonToggle
        value={bait.toString()}
        selected={baitID === bait}
        class="text-sm"
      >
        {tracker.db.getItemName(bait)}
      </ButtonToggle>
    {/each}
  </ButtonToggleGroup>

  <SpotFishView db={tracker.db} {durations} title="fish" />

  <SelfFishList {tracker} {spotID} {baitID} />
{/if}
