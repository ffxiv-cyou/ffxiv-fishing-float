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
  import CheckDouble from "../icon/CheckCircle.svelte";

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

  function isFishingLogged(fishID: number): boolean {
    return tracker.history.storage.isFishingLogged(fishID, false);
  }

  let all: FishDurationDistribution[] = $derived.by(() => {
    const d = new Array(...(stats?.duration?.distributions ?? []));
    d.sort((a, b) => b.fish_id - a.fish_id);
    return d;
  });

  let baits: number[] = $derived.by(() =>
    Array.from(new Set(all.map((d) => d.bait_id))).sort((a, b) => b - a),
  );

  function getRate(bait: number, fish: number) {
    const rate = stats?.probability.rates.find(
      (x) => x.bait === bait && x.id === fish,
    );
    if (rate === undefined) return undefined;

    return { count: rate.count, rate: rate.rate, tug: rate.tug };
  }
</script>

<Heading tag="h2" class="relative text-2xl leading-tight">竿时</Heading>
<SpotFishView {durations} db={tracker.db} title="fish" />

{#if spot?.fish?.length ?? 0 > 0}
  <Heading tag="h2" class="relative text-2xl leading-tight">鱼饵表</Heading>
  <Table class="w-auto">
    <TableHead>
      <TableHeadCell></TableHeadCell>
      {#each spot?.fish as fishID}
        <TableHeadCell class="text-center">
          <span>{tracker.db.getItemName(fishID)}</span>
        </TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each baits as bait}
        <TableBodyRow>
          <TableBodyCell>
            <span>{tracker.db.getItemName(bait)}</span>
          </TableBodyCell>
          {#each spot?.fish as fishID}
            {@const rate = getRate(bait, fishID)}
            <TableBodyCell>
              {#if rate}
                <Gauge
                  percent={rate.rate}
                  value={rate.count}
                  colorFront={`var(--color-${tugColor(rate.tug)}-500)`}
                  colorBack={`var(--color-${tugColor(rate.tug)}-200)`}
                  class="w-16 h-16 small"
                />
              {/if}
            </TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
{/if}

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
            <TableBodyCell>
              {tracker.db.getItemName(fishID)}
              {#if isFishingLogged(fishID)}
                <CheckDouble class="w-4 h-4 inline-block ml-1 text-green-900"
                ></CheckDouble>
              {/if}
            </TableBodyCell>
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
