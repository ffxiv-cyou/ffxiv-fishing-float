<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { SpearSpotFish, SpearSpotResponse } from "@/model/API";
  import { readApiCache, writeApiCache } from "@/lib/apiCache";

  let { tracker }: { tracker: FishingTracker } = $props();

  /** 泳道逻辑全长：影游完一整条所需时间 = TRACK_TIME / 速度（毫秒） */
  const TRACK_TIME = 1000000;
  /** 中心命中窗占泳道宽度的比例 */
  const HIT_WINDOW = 0.08;
  /** 出生/消失点超出泳道边缘的像素，避免鱼凭空出现 */
  const EDGE_PAD = 30;

  const SHADOW_VIEWBOX = "0 0 48 16";
  const SHADOW_BODY =
    '<ellipse cx="28" cy="8" rx="18" ry="6.5" /><polygon points="12,8 1,1 4.5,8 1,15" />';

  /** 渔场鱼表的键：速度 + 尺寸档唯一确定一条鱼。 */
  function fishKey(speed: number, sizeClass: number): string {
    return `${speed}:${sizeClass}`;
  }

  /** 当前渔场的鱼表：(速度, 尺寸档) → 物品 ID，用于识别泳道里的影。 */
  let spotFishes: Map<string, number> = $state(new Map());
  let spotID = $derived(tracker.spear.spotID);

  $effect(() => {
    const spot = spotID;
    spotFishes = new Map();
    if (spot === 0) {
      return;
    }

    let cancelled = false;
    const apply = (fishes: SpearSpotFish[] | undefined) => {
      if (cancelled) return;
      spotFishes = new Map(
        (fishes ?? []).map((f) => [fishKey(f.speed, f.size_class), f.id]),
      );
    };

    // 先用缓存托底，再照常请求刷新
    const cacheKey = `spear-spot:${spot}`;
    const cached = readApiCache<SpearSpotResponse>(cacheKey);
    if (cached) {
      apply(cached.fishes);
    }

    tracker.api
      .getSpearSpot(spot)
      .then((resp) => {
        if (cancelled) return;
        writeApiCache(cacheKey, resp);
        apply(resp.fishes);
      })
      .catch((err) => {
        if (cancelled) return;
        if (cached) {
          console.warn(
            "Failed to refresh spear spot fishes, using cached data:",
            err,
          );
        } else {
          console.error("Failed to load spear spot fishes:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  });

  let now = $state(Date.now());
  $effect(() => {
    let frame = requestAnimationFrame(function tick() {
      now = Date.now();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  });

  /** 泳道从上到下：槽位 2/1/0（与游戏画面上下顺序一致） */
  let lanes = $derived.by(() =>
    [...tracker.spear.lanes].reverse().map((lane) => {
      const crossing = lane.speed > 0 ? TRACK_TIME / lane.speed : 0;
      const elapsed = Math.max(now - lane.spawnTime, 0);
      const alive =
        lane.spawnTime > 0 && (crossing === 0 || elapsed < crossing);
      const progress = alive && crossing > 0 ? elapsed / crossing : 0;
      return {
        ...lane,
        fishId: spotFishes.get(fishKey(lane.speed, lane.sizeClass)) ?? 0,
        alive,
        progress,
      };
    }),
  );

  function iconSize(sizeClass: number): number {
    switch (sizeClass) {
      case 1:
        return 20;
      case 3:
        return 42;
      default:
        return 30;
    }
  }

  function laneName(fishId: number): string {
    if (fishId === 0) {
      return "未知";
    }
    return tracker.db.getItemName(fishId);
  }

  /** 按尺寸档沿用历史统计的颜色（轻/中/重） */
  function sizeClassColor(sizeClass: number): string {
    switch (sizeClass) {
      case 1:
        return "size-light";
      case 2:
        return "size-medium";
      case 3:
        return "size-heavy";
      default:
        return "";
    }
  }

  let colorVars = $derived(
    `--history-light-color:${tracker.config.HistoryLightColor};` +
      `--history-medium-color:${tracker.config.HistoryMediumColor};` +
      `--history-heavy-color:${tracker.config.HistoryHeavyColor};`,
  );
</script>

<div class="lanes" style={colorVars}>
  {#each lanes as lane (lane.slot)}
    <div class={["lane", sizeClassColor(lane.alive ? lane.sizeClass : 0)]}>
      <span class="fish-name" data-unknown={lane.fishId === 0}>
        {lane.alive ? laneName(lane.fishId) : ""}
      </span>
      <span class="hit-window" style={`width: ${HIT_WINDOW * 100}%`}></span>
      {#if lane.alive}
        <svg
          class="shadow"
          data-glow={lane.hq}
          style={`left: calc(${lane.progress * 100}% + ${(lane.progress - 0.5) * 2 * EDGE_PAD}px); width: ${iconSize(lane.sizeClass)}px;`}
          viewBox={SHADOW_VIEWBOX}
          fill="currentColor"
          aria-hidden="true"
        >
          {@html SHADOW_BODY}
        </svg>
      {/if}
    </div>
  {/each}
</div>

<style>
  .lanes {
    width: calc(100% - 20px);
    margin: 0 10px;
    font-size: 0.85em;
    color: white;
    user-select: none;
  }

  .lane {
    position: relative;
    --color: #ffffff40;

    height: 20px;
    line-height: 20px;
    margin-bottom: 4px;
    box-sizing: border-box;
    background-color: #ffffff1a;
  }

  .size-light {
    --color: var(--history-light-color);
  }
  .size-medium {
    --color: var(--history-medium-color);
  }
  .size-heavy {
    --color: var(--history-heavy-color);
  }

  .fish-name {
    /* 命中窗/鱼影都是绝对定位，会盖在行内文字上，这里把名字抬到最上层 */
    position: relative;
    z-index: 1;

    padding-left: 4px;
    white-space: nowrap;
    color: #ffffff;
    text-shadow:
      var(--color) 1px 1px 2px,
      var(--color) -1px -1px 2px,
      var(--color) -1px 1px 2px,
      var(--color) 1px -1px 2px;
  }

  .fish-name[data-unknown="true"] {
    opacity: 0.8;
  }

  .hit-window {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color);
  }

  .shadow {
    position: absolute;
    z-index: 2;
    top: 50%;
    height: auto;
    transform: translate(-50%, -50%);
    color: #ffffff;
    filter: drop-shadow(0 0 2px #000000cc);
  }

  .shadow[data-glow="true"] {
    filter:
      drop-shadow(0 0 2px #000000cc) drop-shadow(0 0 3px #ffd85a);
  }
</style>
