<script lang="ts">
  import HistoryStats from "../components/HistoryStats.svelte";
  import type { FishingResult } from "../model/FishingSession";
  import type { FishingTracker } from "../model/FishingTracker";
  import type { HistoryStatsItem } from "../model/History";
  import { TugType } from "../model/InnerEnums";

  let {
    tracker,
    onclick,
  }: {
    tracker: FishingTracker;
    onclick?: () => void;
  } = $props();

  let intervalId: number;
  tracker.addEventListener("start", () => {
    showStats = true;
  });
  tracker.addEventListener("stop", () => {
    session = null;
    showStats = false;
  });
  tracker.addEventListener("begin", () => {
    intervalId = setInterval(updateSession, 100);
  });
  tracker.addEventListener("end", () => {
    clearInterval(intervalId);
    updateSession();
  });

  tracker.addEventListener("tug", (e) => {
    const evt = e as CustomEvent<TugType>;
    playSound(evt.detail);

    if (tracker.CurrentSession) {
      console.log("tug", tracker.CurrentSession);
    }
    updateSession();
  });

  interface State {
    zoneName: string;
    baitName: string;
    duration: number;
    tugType: TugType | null;
    result: FishingResult | null;
    resultName?: string;
  }

  // let session: State | null = $state({
  //   zoneName: "薰衣草苗圃",
  //   baitName: "万能拟饵",
  //   duration: 12345,
  //   tugType: TugType.Light,
  //   result: {
  //     itemId: 1234,
  //     quantity: 1,
  //     isHQ: false,
  //     size: 234,
  //   },
  //   resultName: "测试渔获",
  // });
  let session: State | null = $state(null);
  let showStats: boolean = $state(true);

  let highlight: number[] = $state([]);
  function updateHighlight() {
    if (session && session.result) {
      highlight = [session.result.itemId];
      return;
    }

    if (session && session.tugType) {
      let result = [];
      for (let stat of historyStats) {
        if (stat.tugType !== session.tugType) {
          continue;
        }
        if (session.duration / 1000 < stat.minBiteTime) {
          continue;
        }
        if (session.duration / 1000 > stat.maxBiteTime) {
          continue;
        }
        result.push(stat.fish);
      }
      highlight = result;
      return;
    }

    highlight = [];
  }

  let now = $derived.by(() => {
    return session ? session.duration / 1000 : undefined;
  });

  let total = $derived.by(() => {
    let maxTime = 0;
    for (let item of historyStats) {
      if (item.maxBiteTime > maxTime) {
        maxTime = item.maxBiteTime;
      }
    }
    return Math.max(Math.ceil(maxTime / 2) * 2, (now ?? 0) + 5);
  }); // in seconds

  function updateSession() {
    const current = tracker.CurrentSession;
    if (current) {
      const result = current.result
        ? "itemId" in current.result
          ? (current.result as FishingResult)
          : null
        : null;

      session = {
        duration: current.elapsedTimeMs,
        zoneName: tracker.db.getZoneName(current.Zone),
        baitName: tracker.db.getItemName(current.baitId),
        tugType: current.tugType,
        result: result,
        resultName: tracker.db.getItemName(current.resultID ?? 0),
      };
    } else {
      session = null;
    }

    updateHighlight();
  }

  function tugType(type: TugType | null): string {
    const types = ["轻杆", "中杆", "重杆"];
    return type !== null ? types[type] : "";
  }

  function tugColor(type: TugType | null): string {
    const colors = ["green", "red", "brown"];
    return type !== null ? colors[type] : "blue";
  }

  let historyStats: HistoryStatsItem[] = $derived.by(() => {
    const zone = tracker.CurrentZone;
    const chum = tracker.chum;
    var bait = tracker.currentBait;
    if (tracker.CurrentSession) {
      bait = tracker.CurrentSession.baitId;
    }
    return tracker.history.getHistory(
      zone,
      bait,
      chum,
    );
  });

  let sounds: HTMLAudioElement[] = [];
  let srcs = $derived.by(() => {
    const soundConfig = tracker.config.Sound;
    let sources: string[] = [];
    if (soundConfig === "intuition") {
      sources = [
        "/assets/light.ogg",
        "/assets/medium.ogg",
        "/assets/heavy.ogg",
      ];
    } else if (soundConfig === "pastry") {
      sources = [
        "/assets/pastry_light.ogg",
        "/assets/pastry_medium.ogg",
        "/assets/pastry_heavy.ogg",
      ];
    }
    return sources;
  });

  function playSound(type: TugType) {
    if (tracker.config.Sound === "") {
      return;
    }
    sounds[type]?.play();
  }

  function divClickHandler(ev: MouseEvent) {
    if (onclick) {
      onclick();
    }
  }
</script>

<div class="timer" style={`--now-time:${now};--total-time:${total};`}>
  <div>
    {#each srcs as src, index}
      <audio {src} bind:this={sounds[index]} preload="auto" hidden></audio>
    {/each}
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="info"
    data-style={tracker.config.Theme}
    data-tug={session?.tugType}
    ondblclick={divClickHandler}
  >
    {#if session}
      <div class="left xiv-text blue">
        <span class="zone" data-show={tracker.config.ShowZone}
          >{session.zoneName}</span
        >
        <span class="bait" data-show={tracker.config.ShowBait}
          >{session.baitName}</span
        >
      </div>
      <div class="middle xiv-text green" data-show={tracker.config.ShowCatch}>
        {#if session.result}
          <span class="result-name">{session.resultName}</span>
          <span class="result-count">{session.result.quantity}</span>
        {/if}
      </div>
      <div class={["right", "xiv-text", tugColor(session.tugType)]}>
        {#if session.tugType !== null}
          <span class="tug">{tugType(session.tugType)}</span>
        {/if}
        <span class="time">{now!.toFixed(1)}s</span>
      </div>
    {/if}
  </div>
  {#if showStats && tracker.config.ShowHistory}
    <HistoryStats
      db={tracker.db}
      stats={historyStats}
      {now}
      {highlight}
      {total}
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
