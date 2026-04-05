<script lang="ts">
  import type { WeatherBucket } from "@/model/API";
  import type { GameDatabase } from "@/model/GameDB";
  import ArrowRight from "../icon/ArrowRight.svelte";

  let {
    spotID,
    buckets,
    db,
  }: {
    spotID: number;
    buckets: WeatherBucket[];
    db: GameDatabase;
  } = $props();

  let territory = $derived.by(() => db.getTerritoryByPlaceID(spotID));
  let weathers = $derived(territory?.weathers);
  let weatherIDs = $derived(new Set(weathers?.map((w) => w.id)));

  function getCount(cur: number, prev: number) {
    const bucket = buckets.find(
      (b) => b.cur_weather === cur && b.prev_weather === prev,
    );
    return bucket ? bucket.count : 0;
  }

  function getCellClass(cur: number, prev: number) {
    const count = getCount(cur, prev);
    if (count === 0) return "bg-gray-100";
    return "bg-secondary-100";
  }
</script>

{#if weatherIDs}
  <div class="weather-matrix">
    <div class="flex h-10 items-center">
      <div class="w-14 text-center"><ArrowRight class="w-6 h-6 inline" /></div>
      {#each weatherIDs as row}
        <div class="w-14 text-center">{db.getWeatherName(row)}</div>
      {/each}
    </div>
    {#each weatherIDs as row}
      <div class="flex h-10 leading-10 items-center">
        <div class="w-14 text-center">{db.getWeatherName(row)}</div>
        {#each weatherIDs as col}
          <div class="w-14 text-center block {getCellClass(col, row)}">
            {getCount(col, row)}
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/if}

<style>
  .weather-matrix {
    display: inline-block;
    border: 1px solid var(--color-gray-200);
    overflow: hidden;
    font-size: 0.95rem;
  }
  .weather-matrix > div {
    border-bottom: 1px solid var(--color-gray-200);
  }
  .weather-matrix > div:last-child {
    border-bottom: none;
  }
</style>
