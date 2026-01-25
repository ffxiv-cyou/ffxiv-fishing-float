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
    downplay,
    zone,
    bait,
    chum,
    tug,
    result,
    historyStats,
    onclick,
    lureRest,
  }: {
    db: GameDatabase;
    config: Config;
    zone: number;
    bait: number;
    chum: boolean;
    now?: number;
    total: number;
    tug: TugType | null;
    result: FishingResult | null;
    highlight?: number[]; // highlighted fish IDs
    downplay?: number[]; // downplayed fish IDs
    historyStats: HistoryStatsItem[];
    onclick?: () => void;
    lureRest?: number;
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

  let style = $derived.by(() => {
    let str = "";
    str += `--now-time:${now};`;
    str += `--total-time:${total};`;
    str += `--idle-color:${config.IdleColor}80;`;
    str += `--tug-light-color:${config.TugLightColor}80;`;
    str += `--tug-medium-color:${config.TugMediumColor}80;`;
    str += `--tug-heavy-color:${config.TugHeavyColor}80;`;
    str += `--history-light-color:${config.HistoryLightColor};`;
    str += `--history-medium-color:${config.HistoryMediumColor};`;
    str += `--history-heavy-color:${config.HistoryHeavyColor};`;
    return str;
  });
</script>

<div class="timer" {style} data-lure-window={config.lureEmptyWindowHandling}>
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
      <span class="bait" data-show={config.ShowBait}>{baitName}{#if chum}*{/if}</span>
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
    <HistoryStats
      {db}
      stats={historyStats}
      {highlight}
      {downplay}
      {total}
      lureTime={lureRest}
      tweakByLure={config.LureEmptyWindowHandling === "tweak"}
    />
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
    background: var(--idle-color);
    border-radius: 8px;
    margin: 3px 10px;
    width: calc((100% - 20px) * var(--now-time) / var(--total-time));

    &[data-tug="0"] {
      background: var(--tug-light-color);
    }
    &[data-tug="1"] {
      background: var(--tug-medium-color);
    }
    &[data-tug="2"] {
      background: var(--tug-heavy-color);
    }

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
