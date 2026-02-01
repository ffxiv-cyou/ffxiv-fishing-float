<script lang="ts">
  import {
    FishingStorage,
    type HistoryItem,
    type HistoryStatsItem,
  } from "@/model/HistoryStorage";
  import SpotSelection from "@/components/SpotSelection.svelte";
  import { GameDatabase } from "@/model/GameDB";
  import { LureType, TugType } from "@/model/InnerEnums";

  let {
    spot = $bindable(""),
    bait = $bindable(""),
    navigate,
  }: {
    spot: string;
    bait: string;
    navigate: (params: { spot: string; bait: string }) => void;
  } = $props();

  let spotID = $derived(parseInt(spot) || 0);
  let baitID = $derived(parseInt(bait) || 0);

  let history = new FishingStorage();
  let db = new GameDatabase();
  db.loadLatest().then(() => {
    console.log("GameDB loaded");
  });

  let baitIDs: number[] = $state([]);
  $effect(() => {
    if (!history.Inited) {
      return;
    }
    console.log("Selected spotID:", spotID);
    history.getBait(spotID).then((baits) => {
      baitIDs = baits;
      console.log("Available baits for spot", spotID, ":", baits);
    });
  });

  let historyStats: HistoryStatsItem[] = $state([]);
  let historyList: HistoryItem[] = $state([]);
  $effect(() => {
    if (spotID) {
      history.getHistory(spotID, baitID ? baitID : undefined).then((records) => {
        historyStats = records;
        console.log(
          `History records for spot ${spotID} and bait ${baitID}:`,
          historyStats,
        );
      });
      history.listHistory(spotID, baitID ? baitID : undefined, undefined, 100).then((records) => {
        historyList = records;
      });

      navigate?.({ spot: spotID.toString(), bait: baitID.toString() });
    } else {
      historyStats = [];
    }
  });

  let minTime = $derived.by(() => {
    let min = Infinity;
    for (const record of historyStats) {
      if (record.minBiteTime < min) {
        min = record.minBiteTime;
      }
    }
    return isFinite(min) ? Math.floor(min) - 1 : 0;
  });
  let maxTime = $derived.by(() => {
    let max = 0;
    for (const record of historyStats) {
      if (record.maxBiteTime > max) {
        max = record.maxBiteTime;
      }
    }
    return isFinite(max) ? Math.ceil(max) + 1 : 0;
  });
  let rulerSteps = $derived.by(() => {
    let steps = [];
    for (let i = minTime; i <= maxTime; i += 1) {
      steps.push(i);
    }
    return steps;
  });

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
    return classes;
  }

  function getItemStyle(item: HistoryStatsItem): string {
    return `--min-time:${item.minBiteTime}; --max-time:${item.maxBiteTime};`;
  }

  function getLureType(
    lureType: number | null,
    lureStacks: number,
    lureAt: number,
  ): string {
    if (lureType === null || lureType === undefined) return "-";
    var prefix = "";
    switch (lureType) {
      case LureType.Ambitious:
        prefix = "雄心";
        break;
      case LureType.Modest:
        prefix = "谦逊";
        break;
    }
    return `${prefix} (x${lureStacks} @ ${lureAt.toFixed(1)}s)`;
  }

  function deleteRecord(index: number) {
    if (confirm("确定删除该记录吗？将会重新计算统计数据。")) {
      console.log("Deleting record:", index);
      history.deleteHistory(index);
    }
  }
</script>

<div class="history">
  <h1>历史统计</h1>
  <div>
    <SpotSelection bind:spotID></SpotSelection>
    <select bind:value={baitID}>
      <option value={0}>所有鱼饵</option>
      {#each baitIDs as baitID}
        <option value={baitID}>{db.getItemName(baitID)}</option>
      {/each}
    </select>
  </div>
  {#if historyStats.length > 0}
    <div
      class="history-stats"
      style="--begin-time:{minTime}; --end-time:{maxTime};"
    >
      <div class="ruler">
        {#each rulerSteps as i}
          <span class="ruler-step" style={`--pos: ${i};`}>{i}</span>
        {/each}
      </div>
      {#each historyStats as stat}
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
      <div></div>
    </div>
  {/if}
  {#if historyList.length > 0}
    <h2>详细记录</h2>
    <div class="table">
      <div class="table-header">
        <div class="table-item item-time">时间</div>
        <div class="table-item item-bait">鱼饵</div>
        <div class="table-item item-fish">鱼</div>
        <div class="table-item item-bite-time">杆时</div>
        <div class="table-item item-chum">撒饵</div>
        <div class="table-item item-lure">雄心/谦逊</div>
        <div class="table-item item-action">操作</div>
      </div>
      <div class="table-body">
        {#each historyList as record}
          <div class="table-row">
            <div class="table-item item-time">
              {new Date(record.date).toLocaleString()}
            </div>
            <div class="table-item item-bait">{db.getItemName(record.bait)}</div>
            <div class="table-item item-fish">{db.getItemName(record.fish)}</div>
            <div class="table-item item-bite-time">{record.biteTime.toFixed(1)}s</div>
            <div class="table-item item-chum">{record.chum ? "是" : "否"}</div>
            <div class="table-item item-lure">
              {getLureType(record.lureType, record.lureStacks, record.lureAt)}
            </div>
            <div class="table-item item-action">
              <button onclick={() => deleteRecord(record.date)}>删除</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .history-stats {
    width: calc(100% - 4em);
    display: block;

    font-size: 0.85em;
    position: relative;
    margin: 1em 2em;

    user-select: none;
  }

  .ruler {
    position: relative;
    height: 20px;
  }

  .ruler-step {
    position: absolute;
    left: calc(
      (var(--pos) - var(--begin-time)) / (var(--end-time) - var(--begin-time)) *
        100%
    );
    transform: translateX(-50%);
    font-size: 12px;
  }

  .item-time {
    flex: 150px;
  }
  .item-fish, .item-bait {
    flex: 100px;
  }
  .item-chum {
    flex: 50px;
  }
  .item-bite-time {
    flex: 50px;
  }
  .item-lure {
    flex: 120px;
  }
  .item-action {
    flex: 60px;
  }

  .stats-item {
    margin-bottom: 4px;
    margin-left: calc(
      (var(--min-time) - var(--begin-time)) /
        (var(--end-time) - var(--begin-time)) * 100%
    );
    margin-right: calc(
      100% -
        (
          (var(--max-time) - var(--begin-time)) /
            (var(--end-time) - var(--begin-time)) * 100%
        )
    );
    position: relative;

    --height: 20px;
    height: var(--height);
    line-height: var(--height);

    box-sizing: border-box;
    background-color: var(--color);
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
</style>
