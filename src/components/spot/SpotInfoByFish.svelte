<script lang="ts">
  import { Heading, Toggle } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishCondition,
    FishDurationDistribution,
    SpotSampleCount,
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
    samples,
    spotID,
    fishID = $bindable(0),
  }: {
    fishes: number[];
    durations: FishDurationDistribution[];
    tracker: FishingTracker;
    buckets: DurationBucket[];
    conditions: FishCondition[];
    samples: SpotSampleCount[];
    spotID: number;
    fishID: number;
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

  function getFishSample(fishID: number) {
    return samples?.find((s) => s.id === fishID);
  }

  function fishSizeName(size: number) {
    return (size / 10).toString();
  }

  let selectedTab = $state(fishID ? fishID.toString() : "");
  $effect(() => {
    const tabID = parseInt(selectedTab);
    if (fishes.includes(tabID)) {
      if (tabID !== fishID)
        fishID = tabID;
    } else {
      selectedTab = fishes[0]?.toString() ?? "";
    }
  });

</script>

<Tabs
  tabStyle="pill"
  classes={{
    active: "bg-secondary-500 text-white",
    content: "p-0",
  }}
  ulClass="flex flex-wrap"
  bind:selected={selectedTab}
>
  {#each fishes as fishID}
    <TabItem key={fishID.toString()}>
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
      {@const sample = getFishSample(fishID)}
      {#if sample && sample.count > 0}
        <Heading tag="h2" class="relative text-2xl leading-tight my-2"
          >尺寸</Heading
        >
        <p>
          {fishSizeName(sample.size_min)} ~
          {fishSizeName(sample.size_max)} 星寸
          <span class="text-gray-500 text-sm">
            ({sample.count} 条记录)
          </span>
        </p>
      {/if}
    </TabItem>
  {/each}
</Tabs>

<style>
</style>
