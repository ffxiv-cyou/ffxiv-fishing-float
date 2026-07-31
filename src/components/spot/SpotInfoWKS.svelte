<script lang="ts">
  import { Tabs, TabItem, Hr } from "flowbite-svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishDurationDistribution,
    SpotStatsResponse,
  } from "@/model/API";
  import type { PlaceTree, WKSInfo } from "@/model/GameDB";
  import SpotInfoByBait from "./SpotInfoByBait.svelte";
  import SpotInfoByFish from "./SpotInfoByFish.svelte";

  let {
    spot,
    tracker,
    durations,
    stats,
  }: {
    spot: PlaceTree | null;
    stats: SpotStatsResponse | null;
    tracker: FishingTracker;
    durations: FishDurationDistribution[];
  } = $props();

  let wksInfos = $derived(spot?.wks);

  function getPossibleBaits(wksInfo: WKSInfo) {
    let baits = wksInfo.baits.map((x) => x.item);

    let fishes =
      stats?.duration.buckets
        .filter((x) => baits.findIndex((b) => b === x.bait_id) >= 0)
        .map((x) => x.fish_id) ?? [];
    let moochBaits =
      stats?.duration.buckets
        .filter((x) => fishes.findIndex((b) => b === x.bait_id) >= 0)
        .map((x) => x.bait_id) ?? [];

    return [...baits, ...new Set(moochBaits)];
  }

  function getPossibleFishes(wksInfo: WKSInfo) {
    let baits = getPossibleBaits(wksInfo);

    const fishes =
      stats?.duration.buckets
        .filter((x) => baits.findIndex((b) => b === x.bait_id) >= 0)
        .map((x) => x.fish_id) ?? [];

    return [...new Set(fishes)];
  }

  let buckets: DurationBucket[] = $derived(stats?.duration?.buckets ?? []);
  let rates = $derived(stats?.probability.rates ?? []);
  let lure_tugs = $derived(stats?.lure_tug ?? []);
  let all: FishDurationDistribution[] = $derived.by(() => {
    const d = new Array(...(stats?.duration?.distributions ?? []));
    d.sort((a, b) => b.fish_id - a.fish_id);
    return d;
  });

  let baitID = $state(0);
  let fishID = $state(0);
  let wksID = $state("");
  let info = $derived(wksInfos?.find((x) => x.id === parseInt(wksID)));
</script>

<Tabs
  tabStyle="pill"
  classes={{
    content: "p-0",
  }}
  ulClass="flex flex-wrap"
  bind:selected={wksID}
>
  {#each wksInfos as info}
    <TabItem key={info.id.toString()}>
      {#snippet titleSlot()}
        <div class="xiv-font">
          {info.name}
        </div>
      {/snippet}
    </TabItem>
  {/each}
</Tabs>

{#if info}
  <Hr />
  <SpotInfoByBait
    {tracker}
    baits={getPossibleBaits(info)}
    durations={all}
    {buckets}
    {rates}
    {lure_tugs}
    bind:baitID
    spotID={spot?.id ?? 0}
  />
  <Hr />
  <SpotInfoByFish
    {tracker}
    fishes={getPossibleFishes(info)}
    spotID={0}
    durations={all}
    {buckets}
    samples={stats?.samples ?? []}
    conditions={stats?.conditions ?? []}
    lureTriggers={stats?.lure_trigger ?? []}
    bind:fishID
  />
{/if}
