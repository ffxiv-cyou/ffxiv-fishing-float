import schedule from "./schedule.json" with { type: "json" };

/** 1=白天 2=黄昏 3=夜晚；0=未知（对不上停靠点，调用方应中性通过）。 */
export const OceanPhase = {
  Unknown: 0,
  Day: 1,
  Sunset: 2,
  Night: 3,
} as const;
export type OceanPhase = (typeof OceanPhase)[keyof typeof OceanPhase];

interface RouteClock {
  epoch: number;
  skip_mod: number;
  skip_at: number;
}

interface Family {
  stops: number[][];
  epoch?: number;
  skip_mod?: number;
  skip_at?: number;
}

interface Schedule {
  voyage: RouteClock;
  families: Family[];
}

const sched = schedule as Schedule;

const VOYAGE_INTERVAL_MS = 2 * 60 * 60 * 1000;

const PHASE_CYCLE: OceanPhase[] = [OceanPhase.Day, OceanPhase.Sunset, OceanPhase.Night];

/** 尾站时相表：12 组合 = 4 目的地 × 3 尾站时相，组合序号 i → 时相 i/4。 */
const VOYAGE_PHASES: OceanPhase[] = [
  OceanPhase.Day,
  OceanPhase.Day,
  OceanPhase.Day,
  OceanPhase.Day,
  OceanPhase.Sunset,
  OceanPhase.Sunset,
  OceanPhase.Sunset,
  OceanPhase.Sunset,
  OceanPhase.Night,
  OceanPhase.Night,
  OceanPhase.Night,
  OceanPhase.Night,
];

export function voyageNumber(unixMillis: number): number {
  return Math.floor(unixMillis / VOYAGE_INTERVAL_MS);
}

/** 航班号 vn 之前经历的跳过次数。 */
function skipCount(vn: number, mod: number, at: number): number {
  if (mod <= 0 || vn <= at) return 0;
  return Math.floor((vn - 1 - at) / mod) + 1;
}

function clockIndex(clock: RouteClock, vn: number): number {
  return clock.epoch + vn + skipCount(vn, clock.skip_mod, clock.skip_at);
}

function routeIndex(clock: RouteClock, vn: number, nStops: number): number {
  return clockIndex(clock, vn) % nStops;
}

function rotatePhases(finalPhase: OceanPhase): OceanPhase[] {
  let idx = PHASE_CYCLE.indexOf(finalPhase);
  if (idx < 0) idx = 0;
  return [PHASE_CYCLE[(idx + 1) % 3], PHASE_CYCLE[(idx + 2) % 3], PHASE_CYCLE[idx]];
}

export interface VoyageStop {
  place: number;
  phase: OceanPhase;
}

/** 返回指定航班、指定航线族（0=近海 Indigo，1=远洋 Ruby）的三站。 */
export function voyageStops(family: number, unixMillis: number): VoyageStop[] {
  const fam = sched.families[family];
  if (!fam || fam.stops.length === 0) return [];

  const vn = voyageNumber(unixMillis);
  const stops = fam.stops[routeIndex(clockOf(fam), vn, fam.stops.length)];
  const phases = rotatePhases(
    VOYAGE_PHASES[clockIndex(sched.voyage, vn) % VOYAGE_PHASES.length],
  );

  return stops.map((place, i) => ({ place, phase: phases[i] }));
}

function clockOf(fam: Family): RouteClock {
  return {
    epoch: fam.epoch ?? 0,
    skip_mod: fam.skip_mod ?? 0,
    skip_at: fam.skip_at ?? 0,
  };
}

/**
 * 返回指定钓场在该时刻的航段时相。
 * 对不上停靠点（普通海钓场、中转垂钓、时钟偏差）返回 Unknown。
 */
export function voyagePhase(place: number, unixMillis: number): OceanPhase {
  for (let fi = 0; fi < sched.families.length; fi++) {
    for (const stop of voyageStops(fi, unixMillis)) {
      if (stop.place === place) return stop.phase;
    }
  }
  return OceanPhase.Unknown;
}
