<script lang="ts">
  import { Toggle } from "flowbite-svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    FishDurationDistribution,
    FishDurationResponse,
  } from "@/model/API";

  let {
    fishes,
    tracker,
    durations,
  }: {
    fishes: number[];
    durations: FishDurationDistribution[];
    tracker: FishingTracker;
  } = $props();

  let isFiltered = $state(false);
  let isChum = $state(false);

  function filter(d: FishDurationDistribution) {
    if (!isFiltered) return true;
    if (isChum) {
      return d.is_chum;
    } else {
      return !d.is_chum;
    }
  }

  function getFishDistribution(fishID: number) {
    return durations
      .filter((d) => d.fish_id === fishID)
      .filter(filter)
      .sort((a, b) => b.bait_id - a.bait_id);
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

      <div class="flex gap-4">
        <Toggle bind:checked={isFiltered}>过滤</Toggle>
        {#if isFiltered}
          <Toggle bind:checked={isChum}>撒饵</Toggle>
        {/if}
      </div>

      <SpotFishView
        title="bait"
        durations={getFishDistribution(fishID)}
        db={tracker.db}
      />
    </TabItem>
  {/each}
</Tabs>

<style>
</style>
