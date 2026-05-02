<script lang="ts">
  import SpotInfoByFish from "./SpotInfoByFish.svelte";
  import SpotInfoByBait from "./SpotInfoByBait.svelte";
  import SpotInfoBasic from "./SpotInfoBasic.svelte";

  import { P, Skeleton, Toggle } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishDurationDistribution,
    SpotStatsResponse,
  } from "@/model/API";
  import SpotInfoSelfHistory from "./SpotInfoSelfHistory.svelte";

  let {
    spotID = $bindable(0),
    myBaitID = $bindable(0),
    baitID = $bindable(0),
    fishID = $bindable(0),
    tracker,
  }: {
    spotID: number;
    myBaitID: number;
    baitID: number;
    fishID: number;
    tracker: FishingTracker;
  } = $props();

  let spotName = $derived(tracker.db.getZoneName(spotID));
  let spot = $derived(tracker.db.getPlaceTreeByID(spotID));

  $effect(() => {
    console.log(spotID, spot);
    loadFishingDuration(spotID);
  });

  let loading = $state(false);
  let spotStats: SpotStatsResponse | null = $state(null);
  let merged: FishDurationDistribution[] = $derived.by(() => {
    const d = new Array(...(spotStats?.duration?.merged ?? []));
    d.sort((a, b) => b.fish_id - a.fish_id);
    return d;
  });

  let all: FishDurationDistribution[] = $derived.by(() => {
    const d = new Array(...(spotStats?.duration?.distributions ?? []));
    d.sort((a, b) => b.fish_id - a.fish_id);
    return d;
  });

  let baits: number[] = $derived.by(() =>
    Array.from(new Set(all.map((d) => d.bait_id))).sort((a, b) => b - a),
  );

  let buckets: DurationBucket[] = $derived.by(
    () => spotStats?.duration?.buckets ?? [],
  );
  let rates = $derived.by(() => spotStats?.probability.rates ?? []);

  async function loadFishingDuration(spot: number) {
    loading = true;
    try {
      spotStats = await tracker.api.getSpotStats(spot, {});
    } catch (error) {
      console.error("Failed to load fishing duration:", error);
    } finally {
      loading = false;
    }
  }

  let fishes = $derived.by(() => {
    let fromCfg = spot?.fish ?? [];
    let fromMerged = merged.map((d) => d.fish_id);
    return Array.from(new Set([...fromCfg, ...fromMerged])).sort(
      (a, b) => b - a,
    );
  });

  let selectedTab = "";
  function getSelectedTab() {
    if (selectedTab)
      return selectedTab;
    if (myBaitID > 0) {
      return "my-history";
    } else if (fishID > 0) {
      return "by-fish";
    } else if (baitID > 0) {
      return "by-bait";
    } else {
      return "basic";
    }
  }

  function setSelectedTab(tab: string) {
    if (tab !== "my-history" && myBaitID > 0) {
      myBaitID = 0;
    }
    if (tab !== "by-fish" && fishID > 0) {
      fishID = 0;
    }
    if (tab !== "by-bait" && baitID > 0) {
      baitID = 0;
    }
    selectedTab = tab;
  }
</script>

<Tabs tabStyle="underline" bind:selected={getSelectedTab, setSelectedTab}>
  <TabItem title="基本信息" key="basic">
    {#if loading}
      <Skeleton />
    {:else}
      <SpotInfoBasic {spot} {tracker} stats={spotStats} durations={merged} />
    {/if}
  </TabItem>
  <TabItem title="按鱼饵" key="by-bait">
    {#if loading}
      <Skeleton />
    {:else}
      <SpotInfoByBait {tracker} {baits} durations={all} {buckets} {rates} bind:baitID={baitID} />
    {/if}
  </TabItem>
  <TabItem title="按渔获" key="by-fish">
    {#if loading}
      <Skeleton />
    {:else}
      <SpotInfoByFish
        {tracker}
        {fishes}
        {spotID}
        durations={all}
        {buckets}
        samples={spotStats?.samples ?? []}
        conditions={spotStats?.conditions ?? []}
        bind:fishID={fishID}
      />
    {/if}
  </TabItem>
  <TabItem title="我的记录" key="my-history">
    <SpotInfoSelfHistory {tracker} {spotID} bind:baitID={myBaitID} />
  </TabItem>
</Tabs>

<style>
</style>
