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
    Select,
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
    spotID,
  }: {
    baits: number[];
    durations: FishDurationDistribution[];
    buckets: DurationBucket[];
    rates: FishProbabilityItem[];
    lure_tugs: LureTugStatItem[];
    tracker: FishingTracker;
    baitID: number;
    spotID: number;
  } = $props();

  function tugType(fishID: number) {
    for (let i = 0; i < durations.length; i++) {
      const element = durations[i];
      if (element.fish_id === fishID) return element.tug_type;
    }
    return 0;
  }

  //#region duration filter
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

  //#endregion

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

  function getLureRate(fish: number, level: number) {
    const tug = tugType(fish);
    const rateTable = [1.5, 2.5, 6];
    if (level >= 1 && level <= 3) {
      return tug === 2 || tug === 3 ? rateTable[level - 1] : 1;
    }
    if (level >= 4 && level <= 6) {
      return tug === 1 ? rateTable[level - 4] : 1;
    }

    return 1;
  }

  function getPercent(num: number, total: number) {
    return ((num / total) * 100).toFixed(1) + "%";
  }

  function getFishRates(baitID: number) {
    let basicRates = rates.filter((d) => d.bait === baitID);
    basicRates = JSON.parse(JSON.stringify(basicRates)); // deep copy

    if (conditionEnabled) {
      if (conditionUseRealData) {
        return conditionRates;
      }

      if (conditionSlaps !== "") {
        const slapID = parseInt(conditionSlaps);
        basicRates = basicRates.filter((d) => d.id !== slapID);
      }

      if (!conditionHidden) {
        basicRates = basicRates.filter((d) => !d.is_hidden);
      }

      if (conditionLure !== "") {
        const lureLevel = parseInt(conditionLure);
        basicRates.forEach((v, index, arr) => {
          const rate = getLureRate(v.id, lureLevel);
          v.rate *= rate;
        });
      }

      let sumRate = 0;
      basicRates.forEach((v) => (sumRate += v.rate));
      basicRates.forEach((v) => (v.rate /= sumRate));
    }

    return basicRates.sort((a, b) => b.id - a.id);
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

  //#region condition calculator
  let conditionEnabled = $state(false);
  let conditionUseRealData = $state(false);
  let conditionLure = $state("");
  let conditionSlaps = $state("");
  let conditionHidden = $state(false);
  let conditionRates: FishProbabilityItem[] = $state([]);

  let lureDropdown = $derived.by(() => {
    let arr = [];
    for (let i = 0; i < 7; i++) {
      arr.push({ value: i.toString(), name: getLureLabel(i)! });
    }
    return arr;
  });

  let slaps = $derived.by(() => {
    let arr = [
      { value: "", name: "(所有状态)" },
      { value: "0", name: "(未拍水)" },
    ];

    if (conditionUseRealData) {
      arr = arr.slice(1);
    }

    let fishes: number[] = [];
    durations
      .filter((v) => v.bait_id === baitID)
      .forEach((v) => {
        if (fishes.indexOf(v.fish_id) < 0) fishes.push(v.fish_id);
      });

    fishes.sort().forEach((v) => {
      arr.push({
        value: v.toString(),
        name: tracker.db.getItemName(v),
      });
    });
    return arr;
  });

  async function loadConditionalProbability(
    bait: number,
    lure: number,
    slap?: number,
    hidden?: boolean,
  ) {
    await tracker.api
      .getProbability(spotID, bait, {
        lure,
        slap,
        hidden,
      })
      .then((v) => {
        conditionRates = v.rates.sort((a, b) => b.id - a.id);
      });
  }

  $effect(() => {
    if (!conditionEnabled || !conditionUseRealData) {
      conditionRates = [];
      return;
    }
    loadConditionalProbability(baitID, parseInt(conditionLure), conditionSlaps === "" ? undefined : parseInt(conditionSlaps), conditionHidden);
  });

  //#endregion
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
        <Heading tag="h2" class="relative text-2xl leading-tight">竿时</Heading>

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
        <div class="flex gap-4 mt-2 h-10">
          <Toggle bind:checked={conditionEnabled}>条件概率</Toggle>
          {#if conditionEnabled}
            <Toggle bind:checked={conditionUseRealData}>使用真实样本</Toggle>
            <Select
              items={lureDropdown}
              bind:value={conditionLure}
              name="拟饵"
              placeholder="选择拟饵状态"
              class="w-48"
            />
            <Select
              items={slaps}
              bind:value={conditionSlaps}
              name="拍水"
              placeholder="拍水状态"
              class="w-48"
            />
            <Toggle bind:checked={conditionHidden}>鱼词</Toggle>
          {/if}
        </div>
        <FishRateView
          title="fish"
          rates={getFishRates(baitID)}
          db={tracker.db}
        />

        <Heading tag="h2" class="relative text-2xl leading-tight">竿型</Heading>
        <Table>
          <TableHead>
            <TableHeadCell>状态</TableHeadCell>
            <TableHeadCell>轻竿</TableHeadCell>
            <TableHeadCell>中竿</TableHeadCell>
            <TableHeadCell>重竿</TableHeadCell>
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
