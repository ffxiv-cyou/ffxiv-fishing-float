// 按勾选的条件种类判定「当前钓不到」；任何一项无法判定都中性通过。
// 时间相关条件统一用抛竿时间（使用了雄心/谦逊时用其使用时间）评估。
import type { FishRequirement } from "./API";
import { OceanPhase, voyagePhase } from "./ocean/schedule";
import {
  eorzeaMinutes,
  prevWeatherAt,
  weatherAt,
  type WeatherRateItem,
} from "../lib/eorzea";

export type ConditionKind = "phase" | "et" | "weather" | "intuition" | "lure";
export const CONDITION_KINDS: ConditionKind[] = [
  "phase",
  "et",
  "weather",
  "intuition",
  "lure",
];

export const CONDITION_KIND_NAMES: Record<ConditionKind, string> = {
  phase: "海钓",
  et: "时间",
  weather: "天气",
  intuition: "鱼识",
  lure: "鱼词",
};

export interface ConditionContext {
  /** 判定时间（服务器 epoch 毫秒）；<=0 表示未知 */
  cast: number;
  place: number;
  weathers?: readonly WeatherRateItem[];
  hasIntuition: boolean;
  /** 该钓场需要鱼识才能钓到的鱼（物品 ID） */
  intuitionRequired: number[];
  /** 当前鱼词指向的鱼（图鉴序号，0 = 无鱼词） */
  hiddenFish: number;
  /** 鱼词鱼的 物品 ID → 图鉴序号；不是鱼词鱼或取不到返回 0 */
  lureFishIndex: (fishId: number) => number;
}

/** ET 区间判定；Start >= End 表示跨午夜。 */
function inETInterval(minutes: number, start: number, end: number): boolean {
  if (start >= end) return minutes >= start || minutes < end;
  return minutes >= start && minutes < end;
}

/** 判断单条鱼在当前条件下是否「钓不到」；无法判定时返回 false。 */
export function isFishBlocked(
  fishID: number,
  condition: FishRequirement | undefined,
  kinds: readonly ConditionKind[],
  ctx: ConditionContext,
): boolean {
  const enabled = (kind: ConditionKind) => kinds.includes(kind);

  if (enabled("intuition")) {
    if (ctx.intuitionRequired.includes(fishID) && !ctx.hasIntuition) return true;
  }

  if (!condition) return false;

  // 鱼词是 per-cast 状态，重新抛竿即清空；序号取不到时不判定。
  if (enabled("lure") && condition.is_lure_hidden) {
    const noteIndex = ctx.lureFishIndex(fishID);
    if (noteIndex > 0 && ctx.hiddenFish !== noteIndex) return true;
  }

  const castKnown = ctx.cast > 0;

  if (enabled("phase") && condition.phases && condition.phases.length > 0) {
    if (castKnown) {
      const phase = voyagePhase(ctx.place, ctx.cast);
      if (phase !== OceanPhase.Unknown && !condition.phases.includes(phase)) {
        return true;
      }
    }
  }

  if (
    enabled("et") &&
    castKnown &&
    condition.time_start !== undefined &&
    condition.time_end !== undefined
  ) {
    if (
      !inETInterval(eorzeaMinutes(ctx.cast), condition.time_start, condition.time_end)
    ) {
      return true;
    }
  }

  // 当前天气与上一个周期天气都要命中。
  if (enabled("weather") && castKnown) {
    const rates = ctx.weathers;
    if (rates && rates.length > 0) {
      const seconds = Math.trunc(ctx.cast / 1000);
      const cur = condition.cur_weather;
      if (cur && cur.length > 0) {
        const weather = weatherAt(rates, seconds);
        if (weather !== null && !cur.includes(weather)) return true;
      }
      const prev = condition.prev_weather;
      if (prev && prev.length > 0) {
        const weather = prevWeatherAt(rates, seconds);
        if (weather !== null && !prev.includes(weather)) return true;
      }
    }
  }

  return false;
}

/** 计算被判定为「钓不到」的鱼集合；kinds 为空表示关闭过滤。 */
export function blockedFishes(
  conditions: readonly FishRequirement[] | undefined,
  kinds: readonly ConditionKind[],
  ctx: ConditionContext,
): Set<number> {
  const blocked = new Set<number>();
  if (kinds.length === 0) return blocked;

  const byFish = new Map<number, FishRequirement>();
  for (const condition of conditions ?? []) byFish.set(condition.id, condition);

  const candidates = new Set<number>(byFish.keys());
  if (kinds.includes("intuition")) {
    for (const fish of ctx.intuitionRequired) candidates.add(fish);
  }

  for (const fish of candidates) {
    if (isFishBlocked(fish, byFish.get(fish), kinds, ctx)) blocked.add(fish);
  }
  return blocked;
}
