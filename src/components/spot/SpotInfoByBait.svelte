<script lang="ts">
  import { Tabs, TabItem, Toggle, P } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { DurationBucket, FishDurationDistribution } from "@/model/API";
  import HeatmapView from "./HeatmapView.svelte";
  import { downSampleBuckets, mergeChumBuckets } from "./data_helper";

  let {
    baits,
    tracker,
    durations,
    buckets,
  }: {
    baits: number[];
    durations: FishDurationDistribution[];
    buckets: DurationBucket[];
    tracker: FishingTracker;
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

  function getHeatmapBuckets(baitID: number) {
    let filtered = buckets.filter(
      (b) => b.bait_id === baitID && filterBucket(b),
    );
    if (!isFiltered) {
      filtered = mergeChumBuckets(filtered);
    }
    return downSampleBuckets(filtered, 500).sort(
      (a, b) => b.fish_id - a.fish_id,
    );
  }

  function getBaitDistribution(baitID: number) {
    return durations
      .filter((d) => d.bait_id === baitID)
      .filter(filter)
      .sort((a, b) => b.fish_id - a.fish_id);
  }
</script>

{#if baits.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1">暂无数据</div>
  </div>
{:else}
  <Tabs
    tabStyle="pill"
    classes={{
      active: "bg-secondary-500 text-white",
      content: "p-0",
    }}
    ulClass="flex flex-wrap"
  >
    {#each baits as baitID}
      <TabItem>
        {#snippet titleSlot()}
          <div>
            {tracker.db.getItemName(baitID)}
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
            title="fish"
            buckets={getHeatmapBuckets(baitID)}
            db={tracker.db}
          />
        {:else}
          <SpotFishView
            title="fish"
            durations={getBaitDistribution(baitID)}
            db={tracker.db}
          />
        {/if}
      </TabItem>
    {/each}
  </Tabs>
{/if}

<style>
</style>
