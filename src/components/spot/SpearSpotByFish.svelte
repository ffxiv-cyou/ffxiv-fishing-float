<script lang="ts">
  import { Heading, P } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { SpearSpotFish } from "@/model/API";

  let {
    fishes,
    stats,
    tracker,
    fishID = $bindable(0),
  }: {
    fishes: number[];
    stats: Array<SpearSpotFish>;
    tracker: FishingTracker;
    fishID: number;
  } = $props();

  function getFishStat(id: number) {
    return stats.find((f) => f.id === id);
  }

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

  function fishSizeName(size: number) {
    return (size / 10).toString();
  }

  let selectedFishTab = $state(fishID ? fishID.toString() : "");
  $effect(() => {
    const tabID = parseInt(selectedFishTab);
    if (fishes.includes(tabID)) {
      if (tabID !== fishID) fishID = tabID;
    } else {
      selectedFishTab = fishes[0]?.toString() ?? "";
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
  bind:selected={selectedFishTab}
>
  {#each fishes as id}
    {@const stat = getFishStat(id)}
    <TabItem key={id.toString()}>
      {#snippet titleSlot()}
        <div>
          {tracker.db.getItemName(id)}
        </div>
      {/snippet}
      <P>
        大小：{stat ? sizeClassName(stat.size_class) : "-"}
      </P>
      <P>
        速度：{stat ? stat.speed : "-"}
      </P>
      {#if stat}
        <Heading tag="h2" class="relative text-2xl leading-tight my-2"
          >尺寸</Heading
        >
        <p>
          {fishSizeName(stat.size_min)} ~
          {fishSizeName(stat.size_max)} 星寸
          <span class="text-gray-500 text-sm">
            ({stat.count} 条记录)
          </span>
        </p>
      {/if}
    </TabItem>
  {/each}
</Tabs>

<style>
</style>
