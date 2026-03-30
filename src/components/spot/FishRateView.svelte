<script lang="ts">
  import type { FishProbabilityItem } from "@/model/API";
  import type { GameDatabase } from "@/model/GameDB";
  import UPlot, { type AlignedData, type Options } from "../uPlot.svelte";
  import up from "uplot";
  import { TooltipPlugin } from "../uplot/tooltip";

  let {
    rates,
    db,
    title,
  }: {
    rates: FishProbabilityItem[];
    db: GameDatabase;
    title: "bait" | "fish";
  } = $props();

  const transpose = (arr: number[][]) =>
    arr[0].map((_, i) => arr.map((row) => row[i]));

  let data: AlignedData = $derived.by(() => {
    const x = rates.map((d, idx) => idx);
    const y = rates.map((d) => d.rate);
    return [x, y];
  });

  let max = $derived.by(() => {
    if ((rates?.length ?? 0) === 0) return 1;
    return Math.ceil(Math.max(...rates.map((d) => d.rate)) * 10) / 10;
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

  let tooltip = $derived.by(() => new TooltipPlugin({ db, rates }));

  function getTitle(index: number) {
    const d = rates[index];
    if (!d) return "";
    switch (title) {
      case "fish":
        return db.getItemName(d.id);
      case "bait":
        return db.getItemName(d.bait);
    }
  }

  let options: Options = $derived({
    width: 800,
    height: (rates?.length ?? 0) * 30 + 65,
    cursor: {
      drag: {
        x: false,
        y: false,
        setScale: false,
      },
    },
    legend: {
      show: true,
    },
    scales: {
      x: {
        min: 0,
        max: rates?.length ?? 1,
        auto: false,
        ori: 1,
        range: (self, dataMin, dataMax) => {
          return [-0.5, rates?.length - 0.5];
        },
      },
      y: {
        auto: false,
        min: 0,
        max: max,
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
        space: 50,
        values: (u, vals) => vals.map((v) => (v * 100).toFixed(0) + "%"),
      },
    ],
    plugins: [tooltip],
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
      {
        label: "概率",
        value: (u, v) => {
          if (v === null || v === undefined) {
            return "";
          }
          return (v * 100).toFixed(1) + "%";
        },
        points: {
          show: false,
        },
        fill: colors[0],
        paths: up.paths.bars!({
          disp: {
            // bar lows
            y0: {
              unit: 1,
              values: (u, seriesIdx) =>
                Array(u.data[1].length).fill(0) as number[],
            },
            // bar highs
            y1: {
              unit: 1,
              values: (u, seriesIdx) => u.data[1] as number[],
            },
          },
        }),
      },
    ],
  });
</script>

{#if rates.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1">暂无数据</div>
  </div>
{:else}
  <UPlot {options} {data}></UPlot>
{/if}
