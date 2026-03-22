<script lang="ts">
  import type { FishDurationDistribution } from "@/model/API";
  import type { GameDatabase, PlaceTree } from "@/model/GameDB";
  import UPlot, { type AlignedData, type Options } from "../uPlot.svelte";
  import { BoxesPlugin } from "../uplot/box";
  import { TooltipPlugin } from "../uplot/tooltip";

  let {
    durations,
    db,
    title,
  }: {
    durations: FishDurationDistribution[];
    db: GameDatabase;
    title: "bait" | "fish";
  } = $props();

  const transpose = (arr: number[][]) =>
    arr[0].map((_, i) => arr.map((row) => row[i]));

  let data: AlignedData = $derived.by(() => {
    const x = durations.map((d, idx) => idx);
    const y = durations.map((d) => [
      d.percentiles.p50 / 1000,
      d.range.effective_min / 1000,
      d.range.effective_max / 1000,
      d.range.min / 1000,
      d.range.max / 1000,
      d.tug_type,
    ]);
    return [x, ...transpose(y)];
  });

  let minTime = $derived.by(() => {
    if ((durations?.length ?? 0) === 0) return 0;
    return Math.min(...durations.map((d) => d.range.min)) / 1000;
  });
  let maxTime = $derived.by(() => {
    if ((durations?.length ?? 0) === 0) return 60;
    return Math.max(...durations.map((d) => d.range.max)) / 1000;
  });

  function getColorMatrix(name: string[], accent: string[], alpha = 0.5) {
    const style = getComputedStyle(document.body);
    const result: string[][] = [];
    for (let i = 0; i < accent.length; i++) {
      result.push([]);
    }
    for (let i = 0; i < name.length; i++) {
      for (let j = 0; j < accent.length; j++) {
        result[j][i] = style
          .getPropertyValue(`--color-${name[i]}-${accent[j]}`)
          .trim();
      }
    }
    return result;
  }

  let colors = getColorMatrix(
    ["gray", "teal", "rose", "amber"],
    ["300", "500", "400"],
  );

  let plugin = new BoxesPlugin({
    gap: 3,
    bodyColors: colors[0],
    medColors: colors[1],
    shadowColors: colors[2],
    bodyWidthFactor: 0.9,
    shadowWidth: 1,
    bodyOutline: 1,
  });
  let tooltip = $derived.by(() => new TooltipPlugin({ data: durations, db }));

  function getTitle(index: number) {
    const d = durations[index];
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
    height: (durations?.length ?? 0) * 30 + 65,
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
        max: durations?.length ?? 1,
        auto: false,
        ori: 1,
        range: (self, dataMin, dataMax) => {
          return [-0.5, durations?.length - 0.5];
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
    plugins: [plugin, tooltip],
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

{#if durations.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1">暂无数据</div>
  </div>
{:else}
  <UPlot {options} {data}></UPlot>
{/if}
