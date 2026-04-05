<script lang="ts">
  import { Heading, Toggle } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishCondition,
    FishDurationDistribution,
  } from "@/model/API";
  import { downSampleBuckets, mergeChumBuckets } from "./data_helper";
  import HeatmapView from "./HeatmapView.svelte";
  import EtBucketView from "./EtBucketView.svelte";
  import WeatherMatrixView from "./WeatherMatrixView.svelte";

  let {
    fishes,
    tracker,
    durations,
    buckets,
    conditions,
    spotID,
  }: {
    fishes: number[];
    durations: FishDurationDistribution[];
    tracker: FishingTracker;
    buckets: DurationBucket[];
    conditions: FishCondition[];
    spotID: number;
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
      (a, b) => b.bait_id - a.bait_id,
    );
  }

  function getFishDistribution(fishID: number) {
    return durations
      .filter((d) => d.fish_id === fishID)
      .filter(filter)
      .sort((a, b) => b.bait_id - a.bait_id);
  }

  function getFishCondition(fishID: number) {
    return conditions?.find((c) => c.id === fishID);
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

      <Heading tag="h2" class="relative text-2xl leading-tight">杆时</Heading>
      <div class="flex gap-4 mt-2">
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
      {#if getFishCondition(fishID)}
        {#if getFishCondition(fishID)?.et}
          <Heading tag="h2" class="relative text-2xl leading-tight my-2">
            时间
          </Heading>
          <EtBucketView
            buckets={getFishCondition(fishID)?.et ?? []}
            bucketMinutes={getFishCondition(fishID)?.et_bucket_minutes ?? 30}
            db={tracker.db}
          />
        {/if}
        {#if getFishCondition(fishID)?.weather}
          <Heading tag="h2" class="relative text-2xl leading-tight my-2">
            天气
          </Heading>
          <WeatherMatrixView
            {spotID}
            buckets={getFishCondition(fishID)?.weather ?? []}
            db={tracker.db}
          />
        {/if}
      {/if}
    </TabItem>
  {/each}
</Tabs>

<style>
</style>
