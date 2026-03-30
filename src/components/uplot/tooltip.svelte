<script lang="ts">
  import type {
    DurationBucket,
    FishDurationDistribution,
    FishProbabilityItem,
  } from "@/model/API";
  import type { GameDatabase } from "@/model/GameDB";
  import type uPlot from "uplot";

  let {
    data,
    buckets,
    rates,
    db,
  }: {
    data?: FishDurationDistribution[];
    buckets?: DurationBucket[];
    rates?: FishProbabilityItem[];
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
    if (!data) return null;
    if (index < 0 || index >= data.length) {
      return null;
    }
    return data[index];
  });

  let bucket = $derived.by(() => {
    if (!buckets) return null;
    if (index < 0 || index >= buckets.length) {
      return null;
    }
    return buckets[index];
  });

  let bucketInfo = $derived.by(() => {
    if (!bucket) return null;
    const beginTime = bucket.start_ms / 1000;
    const endTime =
      (bucket.start_ms + bucket.size_ms * bucket.buckets.length) / 1000;
    const blockIdx = Math.floor((value - beginTime) / (bucket.size_ms / 1000));
    const count = bucket.buckets[blockIdx] || 0;
    const blockBegin = beginTime + (blockIdx * bucket.size_ms) / 1000;
    const blockEnd = blockBegin + bucket.size_ms / 1000;

    return { beginTime, endTime, blockIdx, count, blockBegin, blockEnd };
  });

  let rateInfo = $derived.by(() => {
    if (!rates) return null;
    if (index < 0 || index >= rates.length) {
      return null;
    }
    return rates[index];
  });
</script>

{#if single}
  <div class="p-2 bg-white rounded shadow">
    <div>
      <span class="font-semibold">{db.getItemName(single.fish_id)}</span>
      <span class="text-sm text-gray-500"
        >{getTugTypeName(single.tug_type)}</span
      >
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

{#if bucket && bucketInfo}
  <div class="p-2 bg-white rounded shadow">
    <div>
      <span class="font-semibold">{db.getItemName(bucket.fish_id)}</span>
      <span class="text-sm text-gray-500"
        >{getTugTypeName(bucket.tug_type)}</span
      >
      {#if bucket.bait_id === 0}
        <span class="text-sm text-gray-500">合并</span>
      {/if}
    </div>
    {#if bucket.bait_id !== 0}
      <div>
        <span class="font-semibold">鱼饵:</span>
        <span>{db.getItemName(bucket.bait_id)}</span>
        {#if bucket.is_chum}
          <span class="text-sm text-blue-500">撒饵</span>
        {/if}
      </div>
    {/if}
    {#if bucketInfo}
      <div>
        <span class="font-semibold">区间:</span>
        {bucketInfo.blockBegin.toFixed(1)}s - {bucketInfo.blockEnd.toFixed(1)}s
      </div>
      <div>
        <span class="font-semibold">样本数:</span>
        {bucketInfo.count}
      </div>
    {/if}
  </div>
{/if}

{#if rateInfo}
  <div class="p-2 bg-white rounded shadow">
    <div>
      <span class="font-semibold">{db.getItemName(rateInfo.id)}</span>
      <span class="text-sm text-gray-500">{getTugTypeName(rateInfo.tug)}</span>
    </div>
    {#if rateInfo.bait !== 0}
      <div>
        <span class="font-semibold">鱼饵:</span>
        <span>{db.getItemName(rateInfo.bait)}</span>
      </div>
    {/if}
    <div>
      <span class="font-semibold">概率:</span>
      {(rateInfo.rate * 100).toFixed(1)}%
    </div>
    <div>
      <span class="font-semibold">样本数:</span>
      {rateInfo.count}
    </div>
  </div>
{/if}
