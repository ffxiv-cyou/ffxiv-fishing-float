<script lang="ts">
  import TugSound from "../components/Sound.svelte";
  import Timer from "../components/Timer.svelte";
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

  let sound: TugSound;
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
    onTug(evt.detail);
  });

  function onTug(type: TugType) {
    sound?.play(type);
    if (tracker.CurrentSession) {
      console.log("tug", tracker.CurrentSession);
    }
    updateSession();
  }

  interface State {
    zoneName: string;
    baitName: string;
    duration: number;
    tugType: TugType | null;
    result: FishingResult | null;
    resultName?: string;
  }

  let session: State | null = $state(null);
  let showStats: boolean = $state(false);

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
    }

    updateHighlight();
  }

  //#region History Stats
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

  /**
   * 合并撒饵/非撒饵的记录
   * @param stats
   * @param chum
   */
  function mergeStats(stats: HistoryStatsItem[], chum: boolean) {
    let merged = [];
    for (let stat of stats) {
      let minBiteTime = stat.minBiteTime;
      let maxBiteTime = stat.maxBiteTime;

      if (chum !== stat.chum) {
        if (stat.chum) {
          // was chum, now not chum
          minBiteTime = (minBiteTime - 1) * 2;
          maxBiteTime = (maxBiteTime - 1) * 2;
        } else {
          // was not chum, now chum
          minBiteTime = minBiteTime / 2 + 1;
          maxBiteTime = maxBiteTime / 2 + 1;
        }
      }

      let existing = merged.find(
        (s) =>
          s.fish === stat.fish &&
          s.bait === stat.bait &&
          s.tugType === stat.tugType,
      );
      if (existing) {
        existing.count += stat.count;
        existing.minBiteTime = Math.min(existing.minBiteTime, minBiteTime);
        existing.maxBiteTime = Math.max(existing.maxBiteTime, maxBiteTime);
      } else {
        merged.push({ ...stat });
      }
    }
    return merged;
  }

  let historyStats: HistoryStatsItem[] = $state([]);
  $effect(() => {
    const zone = tracker.CurrentZone;
    const chum = tracker.chum;
    let bait = tracker.currentBait;
    if (tracker.CurrentSession) {
      bait = tracker.CurrentSession.baitId;
    }

    let cancelled = false;
    tracker.history
      .getHistory(zone, bait, tracker.config.MergeChumTime ? undefined : chum)
      .then((stats) => {
        if (cancelled) {
          return;
        }

        historyStats = mergeStats(stats, chum);
        updateHighlight();
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load fishing history stats:", err);
          historyStats = [];
          updateHighlight();
        }
      });

    return () => {
      cancelled = true;
    };
  });
  //#endregion
</script>

{#if showStats}
  <Timer
    db={tracker.db}
    config={tracker.config}
    {onclick}
    zone={tracker.CurrentZone}
    bait={tracker.currentBait}
    tug={session?.tugType ?? null}
    result={session?.result ?? null}
    {now}
    {total}
    {highlight}
    {historyStats}
  ></Timer>
{/if}
<TugSound bind:this={sound} sound={tracker.config.Sound} />
