<script lang="ts">
  import TugSound from "../components/Sound.svelte";
  import Timer from "../components/Timer.svelte";
  import type { FishingTracker } from "../model/FishingTracker";
  import type { HistoryStatsItem } from "../model/HistoryStorage";
  import { LureType, TugType } from "../model/InnerEnums";

  let {
    tracker,
    onclick,
  }: {
    tracker: FishingTracker;
    onclick?: () => void;
  } = $props();

  let sound: TugSound;
  let intervalId: number;
  let showStats: boolean = $state(false);
  tracker.addEventListener("start", () => {
    showStats = true;
  });
  tracker.addEventListener("stop", () => {
    showStats = false;
  });
  tracker.addEventListener("begin", () => {
    intervalId = setInterval(updateSession, 25);
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

  let current = $derived(tracker.CurrentSession);
  let completeCurrent = $derived(current?.Complete ? current : undefined); // 过滤掉手动中断的记录
  let result = $derived(current?.FishResult);
  let bait = $derived(completeCurrent?.baitId ?? tracker.CurrentBait);
  let chum = $derived(completeCurrent?.chum ?? tracker.chum);
  let zone = $derived(current?.Zone ?? tracker.CurrentZone);

  let now: number | undefined = $state(undefined); // in seconds
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
    if (current) {
      now = current.ElapsedTimeMs / 1000;
    } else {
      now = undefined;
    }
  }

  //#region History Stats
  let lureEmptyWindow = $derived(
    current ? current.LureRestMs / 1000 : undefined,
  ); // in seconds
  let highlight: number[] = $derived.by(() => {
    if (result) {
      return [result.itemId];
    }

    if (current?.TugType !== undefined) {
      let result = [];
      for (let stat of historyStats) {
        if (stat.tugType !== current.TugType) {
          continue;
        }
        if (current.ElapsedTimeMs / 1000 < stat.minBiteTime) {
          continue;
        }
        if (current.ElapsedTimeMs / 1000 > stat.maxBiteTime) {
          continue;
        }
        result.push(stat.fish);
      }
      return result;
    }
    return [];
  });

  let downplay: number[] = $derived.by(() => {
    let result = [];
    if (current?.SlapFish) result.push(current.SlapFish);

    if (current?.LureTarget) {
      let flag = current.LureType === LureType.Modest;
      for (let stat of historyStats) {
        if ((stat.tugType === TugType.Light) === flag) continue;
        result.push(stat.fish);
      }
    }
    return result;
  });

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
        merged.push({ ...stat, minBiteTime, maxBiteTime });
      }
    }
    return merged;
  }

  let historyStats: HistoryStatsItem[] = $state([]);
  $effect(() => {
    let cancelled = false;
    const chumState = chum;
    tracker.history
      .getHistory(zone, bait, tracker.config.MergeChumTime ? undefined : chumState)
      .then((stats) => {
        if (cancelled) {
          return;
        }
        historyStats = mergeStats(stats, chumState);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load fishing history stats:", err);
          historyStats = [];
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
    {zone}
    {bait}
    {chum}
    tug={current?.TugType ?? null}
    result={result ?? null}
    lureRest={lureEmptyWindow}
    {downplay}
    {now}
    {total}
    {highlight}
    {historyStats}
  ></Timer>
{/if}
<TugSound bind:this={sound} sound={tracker.config.Sound} />
