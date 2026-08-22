<script lang="ts">
  import TugSound from "../components/Sound.svelte";
  import Timer from "../components/Timer.svelte";
  import type { FishingTracker } from "../model/FishingTracker";
  import type { HistoryStatsItem } from "../model/HistoryStorage";
  import { LureType, TugType } from "../model/InnerEnums";
  import { type FishDurationResponse, FishHookType } from "@/model/API";
  import { createPrecastLookup } from "@/components/spot/data_helper";

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
    return Math.max(
      Math.ceil(maxTime / 2) * 2,
      tracker.config.MinDuration,
      (now ?? 0) + 5,
    );
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

  /**
   * 当前不可能钓到的鱼，用于淡化显示
   */
  let downplay: number[] = $derived.by(() => {
    let result = [];
    if (current?.SlapFish) result.push(current.SlapFish);

    if (current?.LureTarget) {
      for (let stat of historyStats) {
        switch (stat.tugType) {
          case TugType.Light:
            if (current.LureType === LureType.Ambitious) result.push(stat.fish);
            break;
          case TugType.Medium:
            if (current.LureType === LureType.Modest) result.push(stat.fish);
            break;
          case TugType.Heavy:
            // 从在线数据中判断鱼王是精准还是强力的
            let d = onlineHistory?.samples?.find((s) => s.id === stat.fish);
            if (d && d.hook_type !== FishHookType.Unknown) {
              if (
                d.hook_type === FishHookType.Powerful &&
                current.LureType === LureType.Modest
              ) {
                result.push(stat.fish);
              }
              if (
                d.hook_type === FishHookType.Precision &&
                current.LureType === LureType.Ambitious
              ) {
                result.push(stat.fish);
              }
            } else {
              // 没有的话就当是强力的
              if (current.LureType === LureType.Modest) {
                result.push(stat.fish);
              }
            }
            break;
        }
      }
    }
    return result;
  });

  /**
   * 合并撒饵/非撒饵的记录
   * @param stats
   * @param chum
   * @param precastLookup
   */
  function mergeStats(
    stats: HistoryStatsItem[],
    chum: boolean,
    precastLookup: (baitId: number) => number,
  ) {
    let merged = [];
    for (let stat of stats) {
      let minBiteTime = stat.minBiteTime;
      let maxBiteTime = stat.maxBiteTime;

      if (chum !== stat.chum) {
        const precastSec = precastLookup(stat.bait) / 1000;
        if (stat.chum) {
          // was chum, now not chum
          minBiteTime = minBiteTime * 2 - precastSec;
          maxBiteTime = maxBiteTime * 2 - precastSec;
        } else {
          // was not chum, now chum
          minBiteTime = (minBiteTime + precastSec) / 2;
          maxBiteTime = (maxBiteTime + precastSec) / 2;
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
        merged.push({ ...stat, minBiteTime, maxBiteTime, chum });
      }
    }
    return merged;
  }

  /**
   * 本地的钓鱼记录
   */
  let localHistory: HistoryStatsItem[] = $state([]);
  $effect(() => {
    let cancelled = false;
    const chumState = chum;
    tracker.history
      .getHistory(
        zone,
        bait,
        tracker.config.MergeChumTime ? undefined : chumState,
      )
      .then((stats) => {
        if (cancelled) {
          return;
        }
        localHistory = mergeStats(
          stats,
          chumState,
          createPrecastLookup(new Set(stats.map((s) => s.fish))),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load fishing history stats:", err);
          localHistory = [];
        }
      });

    return () => {
      cancelled = true;
    };
  });

  /**
   * 在线的钓鱼记录
   */
  let onlineHistory: FishDurationResponse | undefined = $state(undefined);
  $effect(() => {
    let cancelled = false;
    if (!tracker.config.UseOnlineHistory || zone === 0) {
      onlineHistory = undefined;
      return;
    }

    onlineHistory = undefined;
    tracker.api
      .getFishingDuration(zone, {})
      .then((response) => {
        if (!cancelled) {
          onlineHistory = response;

          // 部分情况下一个钓场可能有多个鱼识（宇宙探索），这里重新做一次 filter
          let fishesForBait = response.distributions
            .filter((d) => d.bait_id === bait)
            .map((d) => d.fish_id);
          tracker.updateIntuitionFilter(zone, fishesForBait);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load online fishing history:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  });

  let historyStats: HistoryStatsItem[] = $derived.by(() => {
    if (onlineHistory === undefined || onlineHistory.distributions == null) {
      return localHistory;
    }

    // 转换在线数据
    let filtered = onlineHistory.distributions.filter(
      (d) => d.bait_id === bait,
    );
    if (!tracker.config.MergeChumTime) {
      filtered = filtered.filter((d) => d.is_chum === chum);
    }
    let converted: HistoryStatsItem[] = filtered.map((d) => ({
      zone: zone,
      fish: d.fish_id,
      bait: d.bait_id,
      tugType: d.tug_type - 1, // 在线数据的tug_type是从1开始的，而本地数据是从0开始的
      count: d.count,
      minBiteTime: d.range.effective_min / 1000,
      maxBiteTime: d.range.effective_max / 1000,
      chum: d.is_chum,
    }));
    let remoteHistory = mergeStats(
      converted,
      chum,
      createPrecastLookup(new Set(converted.map((s) => s.fish))),
    );

    // 合并本地和在线数据
    let merged = localHistory.map((item) => ({ ...item }));
    for (let stat of remoteHistory) {
      let existing = merged.find(
        (s) =>
          s.fish === stat.fish && s.bait === stat.bait && s.chum === stat.chum,
      );
      if (existing) {
        existing.count += stat.count;
        existing.minBiteTime = Math.min(existing.minBiteTime, stat.minBiteTime);
        existing.maxBiteTime = Math.max(existing.maxBiteTime, stat.maxBiteTime);
      } else {
        merged.push(stat);
      }
    }
    return merged;
  });

  //#endregion
</script>

{#if showStats}
  <Timer
    db={tracker.db}
    config={tracker.config}
    intuition={tracker.intuition}
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
<TugSound
  bind:this={sound}
  sound={tracker.config.Sound}
  volume={tracker.config.Volume}
/>
