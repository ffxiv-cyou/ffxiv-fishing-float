<script lang="ts">
  import type { FishDurationDistribution } from "@/model/API";
  import type { GameDatabase } from "@/model/GameDB";
  import type uPlot from "uplot";

  let {
    data,
    db,
  }: {
    data: FishDurationDistribution[];
    db: GameDatabase;
  } = $props();

  let index = $state(-1);
  let value = $state(0);

  export function updateIdx(u: uPlot, idx: number) {
    index = idx;
  }
  export function updateVal(u: uPlot, val: number) {
    value = val;
  }
  function getTugTypeName(tugType: number) {
    switch (tugType) {
      case 1:
        return "轻杆";
      case 2:
        return "中杆";
      case 3:
        return "重杆";
      default:
        return "未知";
    }
  }

  let single = $derived.by(() => {
    if (index < 0 || index >= data.length) {
      return null;
    }
    return data[index];
  });
</script>

{#if single}
  <div class="p-2 bg-white rounded shadow">
    <div>
      <span class="font-semibold">{db.getItemName(single.fish_id)}</span>
      <span class="text-sm text-gray-500">{getTugTypeName(single.tug_type)}</span>
      <span class="text-sm text-gray-500">{value.toFixed(1)}s</span>
      {#if single.bait_id === 0}
        <span class="text-sm text-gray-500">合并</span>
      {/if}
    </div>
    {#if single.bait_id !== 0}
      <div>
        <span class="font-semibold">鱼饵:</span>
        <span>{db.getItemName(single.bait_id)}</span>
        {#if single.is_chum}
          <span class="text-sm text-blue-500">撒饵</span>
        {/if}
      </div>
    {/if}
    <div>
      <span class="font-semibold">中位时间:</span>
      {(single.percentiles.p50 / 1000).toFixed(1)}s
    </div>
    <div>
      <span class="font-semibold">有效区间:</span>
      {(single.range.effective_min / 1000).toFixed(1)}s - {(
        single.range.effective_max / 1000
      ).toFixed(1)}s
    </div>
    {#if single.range.effective_min !== single.range.min || single.range.effective_max !== single.range.max}
      <div>
        <span class="font-semibold">全部区间:</span>
        {(single.range.min / 1000).toFixed(1)}s - {(
          single.range.max / 1000
        ).toFixed(1)}s
      </div>
    {/if}
    <div>
      <span class="font-semibold">样本数:</span>
      {single.count}
    </div>
  </div>
{/if}
