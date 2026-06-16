<script lang="ts">
  import {
    Tabs,
    TabItem,
    Toggle,
    Heading,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyRow,
    TableBodyCell,
  } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    DurationBucket,
    FishDurationDistribution,
    FishProbabilityItem,
    LureTugStatItem,
  } from "@/model/API";
  import HeatmapView from "./HeatmapView.svelte";
  import {
    downSampleBuckets,
    mergeChumBuckets,
    createPrecastLookup,
  } from "./data_helper";
  import FishRateView from "./FishRateView.svelte";

  let {
    baits,
    tracker,
    durations,
    buckets,
    rates,
    lure_tugs,
    baitID = $bindable(0),
  }: {
    baits: number[];
    durations: FishDurationDistribution[];
    buckets: DurationBucket[];
    rates: FishProbabilityItem[];
    lure_tugs: LureTugStatItem[];
    tracker: FishingTracker;
    baitID: number;
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
      const fishIdSet = new Set(buckets.map((b) => b.fish_id));
      const precastLookup = createPrecastLookup(fishIdSet);
      filtered = mergeChumBuckets(filtered, precastLookup);
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

  function getBaitLureTugs(baitID: number) {
    return lure_tugs
      .filter((d) => d.bait_id === baitID && d.total > 10)
      .sort((a, b) => a.lure_state - b.lure_state);
  }

  function getLureLabel(type: number) {
    switch (type) {
      case 0:
        return "无";
      case 1:
        return "雄心I";
      case 2:
        return "雄心II";
      case 3:
        return "雄心III";
      case 4:
        return "谦逊I";
      case 5:
        return "谦逊II";
      case 6:
        return "谦逊III";
    }
  }

  function getPercent(num: number, total: number) {
    return ((num / total) * 100).toFixed(1) + "%";
  }

  function getFishRates(baitID: number) {
    return rates.filter((d) => d.bait === baitID).sort((a, b) => b.id - a.id);
  }

  let selectedTab = $state(baitID ? baitID.toString() : "");
  $effect(() => {
    const tabID = parseInt(selectedTab);
    if (baits.includes(tabID)) {
      if (tabID !== baitID) baitID = tabID;
    } else {
      selectedTab = baits[0]?.toString() ?? "";
    }
  });
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
    bind:selected={selectedTab}
  >
    {#each baits as baitID}
      <TabItem key={baitID.toString()}>
        {#snippet titleSlot()}
          <div>
            {tracker.db.getItemName(baitID)}
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

        <Heading tag="h2" class="relative text-2xl leading-tight">概率</Heading>
        <FishRateView
          title="fish"
          rates={getFishRates(baitID)}
          db={tracker.db}
        />

        <Heading tag="h2" class="relative text-2xl leading-tight">杆型</Heading>
        <Table>
          <TableHead>
            <TableHeadCell>状态</TableHeadCell>
            <TableHeadCell>轻杆</TableHeadCell>
            <TableHeadCell>中杆</TableHeadCell>
            <TableHeadCell>重杆</TableHeadCell>
            <TableHeadCell>样本</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each getBaitLureTugs(baitID) as item}
              <TableBodyRow>
                <TableBodyCell>{getLureLabel(item.lure_state)}</TableBodyCell>
                <TableBodyCell
                  >{getPercent(item.tug_light, item.total)}<span
                    class="text-xs text-gray-400">({item.tug_light})</span
                  ></TableBodyCell
                >
                <TableBodyCell
                  >{getPercent(item.tug_medium, item.total)}<span
                    class="text-xs text-gray-400">({item.tug_medium})</span
                  ></TableBodyCell
                >
                <TableBodyCell
                  >{getPercent(item.tug_heavy, item.total)}<span
                    class="text-xs text-gray-400">({item.tug_heavy})</span
                  ></TableBodyCell
                >
                <TableBodyCell>{item.total}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </TabItem>
    {/each}
  </Tabs>
{/if}

<style>
</style>
