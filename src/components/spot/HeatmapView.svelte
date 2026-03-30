<script lang="ts">
  import type { DurationBucket, FishDurationDistribution } from "@/model/API";
  import type { GameDatabase, PlaceTree } from "@/model/GameDB";
  import UPlot, { type AlignedData, type Options } from "../uPlot.svelte";
  import { TooltipPlugin } from "../uplot/tooltip";
  import { HeatmapPlugin } from "../uplot/heatmap";

  let {
    buckets,
    db,
    title,
  }: {
    buckets: DurationBucket[];
    db: GameDatabase;
    title: "bait" | "fish";
  } = $props();

  let data: AlignedData = $derived.by(() => {
    const x = buckets.map((d, idx) => idx);
    const tugTypes = buckets.map((d) => d.tug_type);
    const startTimes = buckets.map((d) => d.start_ms / 1000);

    const bucket = buckets.map((d) => [...d.buckets]);
    return [x, startTimes, tugTypes, ...bucket];
  });

  let minTime = $derived.by(() => {
    if ((buckets?.length ?? 0) === 0) return 0;
    return Math.min(...buckets.map((d) => d.start_ms)) / 1000;
  });
  let maxTime = $derived.by(() => {
    if ((buckets?.length ?? 0) === 0) return 60;
    return (
      Math.max(
        ...buckets.map((d) => d.start_ms + d.size_ms * d.buckets.length),
      ) / 1000
    );
  });

  function getColorArray(name: string[], accent: string) {
    const style = getComputedStyle(document.body);
    return name.map((n) =>
      style.getPropertyValue(`--color-${n}-${accent}`).trim(),
    );
  }

  let colors = getColorArray(
    ["gray", "teal", "rose", "amber"],
    "300",
  );

  let tooltip = $derived.by(() => new TooltipPlugin({ buckets: buckets, db }));
  let heatmap = new HeatmapPlugin(0.5, {
    colors,
    gap: 2,
    bodyWidthFactor: 0.9
  });

  function getTitle(index: number) {
    const d = buckets[index];
    if (!d) return "";
    switch (title) {
      case "fish":
        return db.getItemName(d.fish_id);
      case "bait":
        return db.getItemName(d.bait_id) + (d.is_chum ? "*" : "");
    }
  }

  let options: Options = $derived({
    width: 800,
    height: (buckets?.length ?? 0) * 30 + 65,
    cursor: {
      drag: {
        x: false,
        y: false,
        setScale: false,
      },
    },
    legend: {
      show: false,
    },
    scales: {
      x: {
        min: 0,
        max: buckets?.length ?? 1,
        auto: false,
        ori: 1,
        range: (self, dataMin, dataMax) => {
          return [-0.5, buckets?.length - 0.5];
        },
      },
      y: {
        auto: false,
        min: Math.max(0, Math.floor(minTime - 0.5)),
        max: Math.ceil(maxTime + 0.5),
        ori: 0,
      },
    },
    axes: [
      {
        side: 3,
        grid: {
          show: false,
        },
        ticks: {
          show: false,
        },
        values: (u, vals) => {
          return vals.map((v) => getTitle(v));
        },
        space: 20,
        size: 100,
        incrs: (self, axisIdx, scaleMin, scaleMax, fullDim, minSpace) => {
          return Array(fullDim).fill(1);
        },
      },
      {
        side: 2,
      },
    ],
    plugins: [heatmap, tooltip],
    series: [
      {
        label: title === "fish" ? "鱼" : "鱼饵",
        value: (u, v) => {
          if (v === null || v === undefined) {
            return "";
          }
          return getTitle(v);
        },
      },
    ],
  });
</script>

{#if buckets.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1">暂无数据</div>
  </div>
{:else}
  <UPlot {options} {data}></UPlot>
{/if}
