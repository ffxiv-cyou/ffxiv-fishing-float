<script lang="ts">
  import type { GameDatabase } from "../model/GameDB";
  import type { HistoryStatsItem } from "../model/History";
  import { TugType } from "../model/InnerEnums";

  let {
    db,
    stats,
    highlight,
    now,
    total,
  }: {
    db: GameDatabase;
    stats: HistoryStatsItem[];
    highlight?: number[];
    now?: number;
    total: number;
  } = $props();

  let nowTime = $derived(now ?? 0); // in seconds
  let totalTime = $derived(total); // in seconds

  let rulerSteps = $derived.by(() => {
    let step = Math.ceil(totalTime / 10);
    let steps = [];
    for (let i = 0; i <= totalTime; i += step) {
      steps.push(i);
    }
    return steps;
  });

  function getItemStyle(item: HistoryStatsItem): string {
    return `--min-time:${item.minBiteTime}; --max-time:${item.maxBiteTime};`;
  }

  function getItemClass(item: HistoryStatsItem): string[] {
    let classes = [];
    switch (item.tugType) {
      case TugType.Light:
        classes.push("tug-light");
        break;
      case TugType.Medium:
        classes.push("tug-medium");
        break;
      case TugType.Heavy:
        classes.push("tug-heavy");
        break;
    }

    if (highlight && highlight.includes(item.fish)) {
      classes.push("active");
    }
    return classes;
  }
</script>

<div class="history-stats">
  {#if stats.length > 0}
    <div class="ruler">
      {#each rulerSteps as i}
        <span class="ruler-step" style={`--pos: ${i};`}>{i}</span>
      {/each}
    </div>
  {/if}
  {#each stats as stat}
    <div
      style={getItemStyle(stat)}
      class={["stats-item", ...getItemClass(stat)]}
      data-min-time={stat.minBiteTime.toFixed(1)}
      data-max-time={stat.maxBiteTime.toFixed(1)}
    >
      <span class="fish-name">
        {db.getItemName(stat.fish)}
      </span>
    </div>
  {/each}
  <div class="stats-cursor"></div>
</div>

<style>
  .history-stats {
    width: calc(100% - 20px);
    display: block;

    font-size: 0.85em;
    color: white;
    position: relative;
    margin: 0 10px;

    user-select: none;
  }

  .ruler {
    position: relative;
    height: 20px;
  }

  .ruler-step {
    position: absolute;
    left: calc(var(--pos) / var(--total-time) * 100%);
    transform: translateX(-50%);
    font-size: 12px;
    color: #ffffffaa;
    text-shadow:
      #000000cc 1px 1px 0px,
      #000000cc -1px -1px 0px,
      #000000cc -1px 1px 0px,
      #000000cc 1px -1px 0px;
  }

  .stats-item {
    margin-bottom: 4px;
    margin-left: calc(var(--min-time) / var(--total-time) * 100%);
    margin-right: calc(100% - (var(--max-time) / var(--total-time) * 100%));
    position: relative;

    --height: 20px;
    height: var(--height);
    line-height: var(--height);

    box-sizing: border-box;
    background-color: var(--color);

    &.active {
      box-shadow: 0 0 10px var(--color);
    }
  }

  .tug-light {
    --color: #4caf50;
  }
  .tug-medium {
    --color: #f44336;
  }
  .tug-heavy {
    --color: #ccaf0a;
  }

  .stats-item::before,
  .stats-item::after {
    position: absolute;
    color: #ffffffaa;
    text-shadow:
      #000000cc 1px 1px 2px,
      #000000cc -1px -1px 2px,
      #000000cc -1px 1px 2px,
      #000000cc 1px -1px 2px;
    font-size: 12px;
    width: 30px;
    top: 0;
    z-index: -1;
  }

  .stats-item::before {
    content: attr(data-min-time);
    left: -34px;
    text-align: right;
  }
  .stats-item::after {
    content: attr(data-max-time);
    right: -32px;
  }

  .fish-name {
    text-shadow:
      var(--color) 1px 1px 2px,
      var(--color) -1px -1px 2px,
      var(--color) -1px 1px 2px,
      var(--color) 1px -1px 2px;
    white-space: nowrap;
    color: #ffffff;
  }

  .stats-cursor {
    position: absolute;
    left: calc(var(--now-time) / var(--total-time) * 100%);
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: #ffffff66;
    box-shadow: #000000cc 0 0 1px;
  }
</style>
