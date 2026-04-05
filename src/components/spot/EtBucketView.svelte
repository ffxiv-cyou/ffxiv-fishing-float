<script lang="ts">
  import type { ETBucket } from "@/model/API";
  import type { GameDatabase } from "@/model/GameDB";
  import UPlot, { type AlignedData, type Options } from "../uPlot.svelte";
  import up from "uplot";
  import { getColor } from "./data_helper";

  let {
    buckets,
    bucketMinutes,
    db,
  }: {
    buckets: ETBucket[];
    bucketMinutes: number;
    db: GameDatabase;
  } = $props();

  let data: AlignedData = $derived.by(() => {
    const totalX = (24 * 60) / bucketMinutes;
    const x = Array.from({ length: totalX }, (_, i) => i * bucketMinutes);
    const y = x.map((_, index) => {
      const bucket = buckets.find((b) => b.bucket === index);
      return bucket ? bucket.count : 0;
    });
    return [x, y];
  });

  let color = getColor("secondary", "300");

  function getTimeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  }

  let options: Options = $derived({
    width: 800,
    height: 200,
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
        max: 24 * 60 + bucketMinutes,
        auto: false,
        range: (self, dataMin, dataMax) => {
          return [0, 24 * 60];
        }
      }
    },
    axes: [
      {
        values: (u, vals) => vals.map(getTimeString),
        incrs: () => {
          const result = [];
          const totalMinutes = 24 * 60;
          const bucketCount = totalMinutes / bucketMinutes;
          for (let i = 0; i <= bucketCount; i++) {
            result.push(i * bucketMinutes);
          }
          return result;
        },
      },
      {
      }
    ],
    series: [
      {
        label: "时间",
        value: (u, v) => getTimeString(v),
      },
      {
        label: "数量",
        points: {
          show: false,
        },
        fill: color,
        paths: up.paths.bars!({
          disp: {
            size: {
              unit: 1,
              values: (u, seriesIdx) =>
                new Array(u.data[1].length).fill(bucketMinutes) as number[],
            },
            x0: {
              unit: 1,
              values: (u, seriesIdx) => u.data[0] as number[],
            },
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

{#if buckets.length === 0}
  <div class="h-16 flex flex-row items-center justify-center">
    <div class="flex-1">暂无数据</div>
  </div>
{:else}
  <UPlot {options} {data}></UPlot>
{/if}
