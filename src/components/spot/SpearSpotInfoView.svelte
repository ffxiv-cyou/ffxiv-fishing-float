<script lang="ts">
  import {
    Heading,
    P,
    Skeleton,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpearSpotByFish from "./SpearSpotByFish.svelte";
  import SpearSpeedPreview from "./SpearSpeedPreview.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { SpearSpotResponse } from "@/model/API";
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
      <Heading tag="h2" class="relative text-2xl leading-tight mb-4 mt-4"
        >鱼类列表</Heading
      >
      <P>
        <Table>
          <TableHead>
            <TableHeadCell>鱼</TableHeadCell>
            <TableHeadCell>大小</TableHeadCell>
            <TableHeadCell>速度</TableHeadCell>
          </TableHead>
          <TableBody class="divide-y">
            {#each fishes as fishID}
              {@const stat = getFishStat(fishID)}
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
