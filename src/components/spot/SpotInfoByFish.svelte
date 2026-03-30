<script lang="ts">
  import { Toggle } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { DurationBucket, FishDurationDistribution } from "@/model/API";
  import { downSampleBuckets, mergeChumBuckets } from "./data_helper";
  import HeatmapView from "./HeatmapView.svelte";

  let {
    fishes,
    tracker,
    durations,
    buckets,
  }: {
    fishes: number[];
    durations: FishDurationDistribution[];
    tracker: FishingTracker;
    buckets: DurationBucket[];
  } = $props();

  let isFiltered = $state(false);
  let isChum = $state(false);
  let showHeatmap = $state(false);

  function filter(d: FishDurationDistribution) {
    if (!isFiltered) return true;
    if (isChum) {
      return d.is_chum;
    } else {
      return !d.is_chum;
    }
  }

  function filterBucket(d: DurationBucket) {
    if (!isFiltered) return true;
    if (isChum) {
      return d.is_chum;
    } else {
      return !d.is_chum;
    }
  }

  function getHeatmapBuckets(fishID: number) {
    let filtered = buckets.filter(
      (b) => b.fish_id === fishID && filterBucket(b),
    );
    if (!isFiltered) {
      filtered = mergeChumBuckets(filtered);
    }
    return downSampleBuckets(filtered, 500).sort(
      (a, b) => b.fish_id - a.fish_id,
    );
  }

  function getFishDistribution(fishID: number) {
    return durations
      .filter((d) => d.fish_id === fishID)
      .filter(filter)
      .sort((a, b) => b.bait_id - a.bait_id);
  }
</script>

<Tabs
  tabStyle="pill"
  classes={{
    active: "bg-secondary-500 text-white",
    content: "p-0",
  }}
  ulClass="flex flex-wrap"
>
  {#each fishes as fishID}
    <TabItem>
      {#snippet titleSlot()}
        <div>
          {tracker.db.getItemName(fishID)}
        </div>
      {/snippet}

      <div class="flex gap-4">
        <Toggle bind:checked={showHeatmap}>热力图</Toggle>
        <Toggle bind:checked={isFiltered}>过滤</Toggle>
        {#if isFiltered}
          <Toggle bind:checked={isChum}>撒饵</Toggle>
        {/if}
      </div>
      {#if showHeatmap}
        <HeatmapView
          title="bait"
          buckets={getHeatmapBuckets(fishID)}
          db={tracker.db}
        />
      {:else}
        <SpotFishView
          title="bait"
          durations={getFishDistribution(fishID)}
          db={tracker.db}
        />
      {/if}
    </TabItem>
  {/each}
</Tabs>

<style>
</style>
