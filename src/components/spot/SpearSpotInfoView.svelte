<script lang="ts">
  import {
    Heading,
    P,
    Select,
    Skeleton,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Toggle,
  } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpearSpotByFish from "./SpearSpotByFish.svelte";
  import SpearSpeedPreview from "./SpearSpeedPreview.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    SpearConditionalSpotFish,
    SpearSpotResponse,
  } from "@/model/API";
  import CheckDouble from "../icon/CheckCircle.svelte";

  let {
    spotID = $bindable(0),
    fishID = $bindable(0),
    tracker,
  }: {
    spotID: number;
    fishID: number;
    tracker: FishingTracker;
  } = $props();

  let spot = $derived(tracker.db.getSpearPlaceTreeByID(spotID));

  $effect(() => {
    loadSpearSpot(spotID);
  });

  let loading = $state(false);
  let stats: SpearSpotResponse | null = $state(null);

  async function loadSpearSpot(spot: number) {
    loading = true;
    try {
      stats = await tracker.api.getSpearSpot(spot);
    } catch (error) {
      console.error("Failed to load spear spot:", error);
    } finally {
      loading = false;
    }
  }

  let fishes = $derived.by(() => {
    const fromCfg = spot?.fish ?? [];
    const fromStats = (stats?.fishes ?? []).map((f) => f.id);
    return Array.from(new Set([...fromCfg, ...fromStats])).sort(
      (a, b) => b - a,
    );
  });

  function getFishStat(fishID: number) {
    return stats?.fishes.find((f) => f.id === fishID);
  }

  //#region condition calculator
  let conditionEnabled = $state(false);
  let conditionUseRealData = $state(false);
  let conditionSlaps = $state("");
  let conditionIntuition = $state(false);
  let conditionRates: SpearConditionalSpotFish[] = $state([]);

  let slaps = $derived.by(() => {
    let arr = [
      { value: "", name: "(所有状态)" },
      { value: "0", name: "(未拍水)" },
    ];
    if (conditionUseRealData) arr = arr.slice(1);
    for (const id of fishes) {
      arr.push({ value: id.toString(), name: tracker.db.getItemName(id) });
    }
    return arr;
  });

  // 使用真实样本时向服务端请求条件下重算的结果，否则在本地做移除与重归一；
  // 切换条件时丢弃过期请求的结果。
  $effect(() => {
    if (!conditionEnabled || !conditionUseRealData) {
      conditionRates = [];
      return;
    }
    const spotId = spotID;
    const slap = conditionSlaps === "" ? undefined : parseInt(conditionSlaps);
    const intuition = conditionIntuition;
    let cancelled = false;
    tracker.api
      .getSpearSpotConditional(spotId, { slap, intuition })
      .then((v) => {
        if (!cancelled) conditionRates = v.fishes;
      })
      .catch((error) => {
        if (cancelled) return;
        conditionRates = [];
        console.error("Failed to load spear conditional probability:", error);
      });
    return () => {
      cancelled = true;
    };
  });

  // 本地条件概率：拍掉的鱼、以及未开启鱼识时的鱼识鱼从池子里移除，其余概率重归一。
  function getFishRates(): SpearConditionalSpotFish[] {
    if (!conditionEnabled) return [];
    if (conditionUseRealData) return conditionRates;
    let rates = (stats?.fishes ?? []).map((d) => ({ ...d }));
    if (conditionSlaps !== "") {
      const slapID = parseInt(conditionSlaps);
      rates = rates.filter((d) => d.id !== slapID);
    }
    if (!conditionIntuition) {
      rates = rates.filter((d) => !d.is_intuition);
    }
    const sumRate = rates.reduce((sum, d) => sum + d.rate, 0);
    if (sumRate > 0) rates.forEach((d) => (d.rate /= sumRate));
    return rates;
  }

  let conditionalByFish = $derived.by(() => {
    const map = new Map<number, SpearConditionalSpotFish>();
    for (const rate of getFishRates()) map.set(rate.id, rate);
    return map;
  });

  // 开启条件概率时概率与数量列换成条件下的结果，被移除的鱼显示「-」。
  function getRateStat(fishID: number) {
    return conditionEnabled
      ? conditionalByFish.get(fishID)
      : getFishStat(fishID);
  }
  //#endregion

  // 按尺寸档分组（小→中→大→未知），同尺寸保持原顺序，方便对比同体型鱼的速度
  let previewFishes = $derived.by(() =>
    fishes
      .map((id) => {
        const stat = getFishStat(id);
        return {
          id,
          speed: stat?.speed ?? 0,
          sizeClass: stat?.size_class ?? 0,
        };
      })
      .sort((a, b) => (a.sizeClass || 99) - (b.sizeClass || 99)),
  );

  function sizeClassName(sizeClass: number): string {
    switch (sizeClass) {
      case 1:
        return "小";
      case 2:
        return "中";
      case 3:
        return "大";
      default:
        return "未知";
    }
  }

  function isSpearLogged(fishID: number): boolean {
    return tracker.history.storage.isFishingLogged(fishID, true);
  }

  let selectedTab = "";
  function getSelectedTab() {
    if (selectedTab) return selectedTab;
    return fishID > 0 ? "by-fish" : "basic";
  }
  function setSelectedTab(tab: string) {
    selectedTab = tab;
  }
</script>

{#if loading}
  <Skeleton />
{:else if fishes.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1 text-center text-gray-500">暂无统计数据</div>
  </div>
{:else}
  <Tabs tabStyle="underline" bind:selected={getSelectedTab, setSelectedTab}>
    <TabItem title="基本信息" key="basic">
      <SpearSpeedPreview
        fishes={previewFishes}
        getName={(id) => tracker.db.getItemName(id)}
      />
      <Heading tag="h2" class="relative text-2xl leading-tight mt-4"
        >鱼类列表</Heading
      >
      <div class="flex gap-4 mt-2 h-10">
        <Toggle bind:checked={conditionEnabled}>条件概率</Toggle>
        {#if conditionEnabled}
          <Toggle bind:checked={conditionUseRealData}>使用真实样本</Toggle>
          <Select
            items={slaps}
            bind:value={conditionSlaps}
            name="拍水"
            placeholder="拍水状态"
            class="w-48"
          />
          <Toggle bind:checked={conditionIntuition}>鱼识</Toggle>
        {/if}
      </div>
      <P>
        <Table>
          <TableHead>
            <TableHeadCell>鱼</TableHeadCell>
            <TableHeadCell>大小</TableHeadCell>
            <TableHeadCell>速度</TableHeadCell>
            <TableHeadCell>概率</TableHeadCell>
            <TableHeadCell>数量</TableHeadCell>
          </TableHead>
          <TableBody class="divide-y">
            {#each fishes as fishID}
              {@const stat = getFishStat(fishID)}
              {@const display = getRateStat(fishID)}
              <TableBodyRow>
                <TableBodyCell>
                  {tracker.db.getItemName(fishID)}
                  {#if isSpearLogged(fishID)}
                    <CheckDouble
                      class="w-4 h-4 inline-block ml-1 text-green-900"
                    ></CheckDouble>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {stat ? sizeClassName(stat.size_class) : "-"}
                </TableBodyCell>
                <TableBodyCell>
                  {stat ? stat.speed : "-"}
                </TableBodyCell>
                <TableBodyCell>
                  {display ? (display.rate * 100).toFixed(1) + "%" : "-"}
                </TableBodyCell>
                <TableBodyCell>
                  {display ? display.spawn_count : "-"}
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </P>
    </TabItem>
    <TabItem title="按渔获" key="by-fish">
      <SpearSpotByFish
        {fishes}
        stats={stats?.fishes ?? []}
        {tracker}
        bind:fishID
      />
    </TabItem>
  </Tabs>
{/if}

<style>
</style>
