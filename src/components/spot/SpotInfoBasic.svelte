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
  } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type {
    FishDurationDistribution,
    SpotStatsResponse,
  } from "@/model/API";
  import type { PlaceTree } from "@/model/GameDB";
  import Gauge from "./Gauge.svelte";

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

  let hookoffs = $derived.by(() => stats?.hookoff_rates ?? []);
  let tugs = $derived.by(() => stats?.tugs ?? []);

  function getHookoffData(fishID: number) {
    const hookoff = hookoffs.find((h) => h.id === fishID);
    if (!hookoff) return { caught: 0, hookoff: 0, rate: 0, confidence: 0 };

    const total = hookoff.count;
    const hookoffCount = total - hookoff.caught;
    return {
      caught: hookoff.caught,
      hookoff: hookoffCount,
      rate: hookoff.hookoff_rate,
      confidence: hookoff.confidence,
    };
  }

  function tugColor(type: number) {
    return ["gray", "teal", "rose", "amber"][Number(type)] ?? "gray";
  }

  function classByConfidence(confidence: number) {
    if (confidence <= 0.5) return "text-gray-400";
    if (confidence <= 0.7) return "text-gray-600";
    return "text-black";
  }
</script>

<Heading tag="h2" class="relative text-2xl leading-tight">杆时</Heading>
<SpotFishView {durations} db={tracker.db} title="fish" />
{#if spot?.fish?.length ?? 0 > 0}
  <Heading tag="h2" class="relative text-2xl leading-tight mb-4"
    >鱼类列表</Heading
  >
  <P>
    <Table>
      <TableHead>
        <TableHeadCell>鱼</TableHeadCell>
        <TableHeadCell>上钩数</TableHeadCell>
        <TableHeadCell>脱钩率</TableHeadCell>
        <TableHeadCell>置信度</TableHeadCell>
      </TableHead>
      <TableBody class="divide-y">
        {#each spot?.fish as fishID}
          {@const data = getHookoffData(fishID)}
          <TableBodyRow>
            <TableBodyCell>{tracker.db.getItemName(fishID)}</TableBodyCell>
            <TableBodyCell>{data.caught}</TableBodyCell>
            <TableBodyCell class={classByConfidence(data.confidence)}>
              {(data.rate * 100).toFixed(1)}%
            </TableBodyCell>
            <TableBodyCell class={classByConfidence(data.confidence)}>
              {data.confidence.toFixed(2)}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </P>
{/if}

<Heading tag="h2" class="relative text-2xl leading-tight my-4">脱钩统计</Heading
>
{#each tugs as tug}
  <Gauge
    value={tug.hookoff}
    max={tug.total}
    colorFront={`var(--color-${tugColor(tug.tug_type)}-500)`}
    colorBack={`var(--color-${tugColor(tug.tug_type)}-200)`}
    class="m-2 w-28 h-28"
  />
{/each}
