<script lang="ts">
  import type { Config } from "../model/Config";
  import type { FishingResult } from "../model/FishingSession";
  import type { GameDatabase } from "../model/GameDB";
  import type { HistoryStatsItem } from "../model/History";
  import type { TugType } from "../model/InnerEnums";
  import HistoryStats from "./HistoryStats.svelte";

  let {
    db,
    config,
    now,
    total,
    highlight,
    zone,
    bait,
    tug,
    result,
    historyStats,
    onclick,
  }: {
    db: GameDatabase;
    config: Config;
    zone: number;
    bait: number;
    now?: number;
    total: number;
    tug: TugType | null;
    result: FishingResult | null;
    highlight?: number[]; // highlighted fish IDs
    historyStats: HistoryStatsItem[];
    onclick?: () => void;
  } = $props();

  let zoneName = $derived(db.getZoneName(zone));
  let baitName = $derived(db.getItemName(bait));
  let resultName = $derived(result ? db.getItemName(result.itemId) : "");

  function divClickHandler(ev: MouseEvent) {
    onclick?.();
  }

  function tugType(type: TugType | null): string {
    const types = ["轻杆", "中杆", "重杆"];
    return type !== null ? types[type] : "";
  }

  function tugColor(type: TugType | null): string {
    const colors = ["green", "red", "brown"];
    return type !== null ? colors[type] : "blue";
  }
</script>

<div class="timer" style={`--now-time:${now};--total-time:${total};`}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="info"
    data-style={config.Theme}
    data-tug={tug}
    ondblclick={divClickHandler}
  >
    <div class="left xiv-text blue">
      <span class="zone" data-show={config.ShowZone}>{zoneName}</span>
      <span class="bait" data-show={config.ShowBait}>{baitName}</span>
    </div>
    <div class="middle xiv-text green" data-show={config.ShowCatch}>
      {#if result}
        <span class="result-name">{resultName}</span>
        <span class="result-count">{result.quantity}</span>
      {/if}
    </div>
    <div class={["right", "xiv-text", tugColor(tug)]}>
      {#if tug !== undefined}
        <span class="tug">{tugType(tug)}</span>
      {/if}
      <span class="time">{(now ?? 0).toFixed(1)}s</span>
    </div>
  </div>
  {#if config.ShowHistory}
    <HistoryStats {db} stats={historyStats} {now} {highlight} {total} />
  {/if}
</div>

<style>
  .timer {
    width: 100%;
    position: relative;
    user-select: none;
  }

  .timer [data-show="false"] {
    display: none;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
  }
  .zone,
  .bait,
  .result-name,
  .result-count {
    font-size: 0.8em;
  }
  .tug,
  .time {
    font-size: 0.9em;
    font-weight: bold;
  }
  .result-count::before {
    content: "x";
  }

  .left {
    text-align: left;
    & span + span {
      margin-left: 5px;
    }
  }

  .middle {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .info[data-style="minimal"] {
    font-size: 12px;
    background: #eeeeee80;
    border-radius: 8px;
    margin: 0 10px;
    width: calc((100% - 20px) * var(--now-time) / var(--total-time));

    &[data-tug="0"] {
      background: #69aff380;
    }
    &[data-tug="1"] {
      background: #cc99ff80;
    }
    &[data-tug="2"] {
      background: #f1c64a80;
    }
    color: #0078d7;

    .left,
    .middle {
      display: none;
    }
    .right {
      text-align: center;
      flex: 1;
    }
  }
</style>
