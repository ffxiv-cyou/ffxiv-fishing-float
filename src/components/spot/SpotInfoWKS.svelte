<script lang="ts">
  import {
    Heading,
    P,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Tabs,
    TabItem,
    Hr,
  } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishDurationDistribution,
    SpotStatsResponse,
  } from "@/model/API";
  import type { PlaceTree, WKSInfo } from "@/model/GameDB";
  import Gauge from "./Gauge.svelte";
  import CheckDouble from "../icon/CheckCircle.svelte";
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

    const fishes = stats?.duration.buckets
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

</script>

<Tabs
  tabStyle="pill"
  classes={{
    content: "p-0",
  }}
  ulClass="flex flex-wrap"
>
  {#each wksInfos as info}
    <TabItem key={info.id.toString()}>
      {#snippet titleSlot()}
        <div class="xiv-font">
          {info.name}
        </div>
      {/snippet}
      <Hr />
      <SpotInfoByBait
        {tracker}
        baits={getPossibleBaits(info)}
        durations={all}
        {buckets}
        {rates}
        {lure_tugs}
        bind:baitID
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
    </TabItem>
  {/each}
</Tabs>
