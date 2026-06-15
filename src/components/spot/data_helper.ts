import type { DurationBucket } from "@/model/API";
import baitTimeData from "@/data/bait_time.json";

export interface BaitTimeEntry {
  duration: number;
  mooch?: boolean;
  fallback?: boolean;
  baits?: number[];
}

export type PrecastLookup = (baitId: number) => number;

export function createPrecastLookup(fishIdSet: Set<number>): PrecastLookup {
  const explicitMap = new Map<number, number>();
  let fallback = 1500;
  let moochDuration: number | undefined;

  for (const entry of baitTimeData) {
    if (entry.fallback) {
      fallback = entry.duration;
      continue;
    }
    if (entry.mooch) {
      moochDuration = entry.duration;
    }
    if (entry.baits) {
      for (const baitId of entry.baits) {
        explicitMap.set(baitId, entry.duration);
      }
    }
  }

  return (baitId: number) => {
    if (explicitMap.has(baitId)) return explicitMap.get(baitId)!;
    if (moochDuration !== undefined && fishIdSet.has(baitId)) return moochDuration;
    return fallback;
  };
}

export function chumTimeToNormal(time: number, precast: number) {
  return time * 2 - precast;
}

export function mergeChumBuckets(
  buckets: DurationBucket[],
  precastLookup: PrecastLookup,
): DurationBucket[] {
  const mergedMap: Record<number, DurationBucket> = {};
  buckets.forEach((b) => {
    const buk = { ...b, buckets: [...b.buckets] };
    if (b.is_chum) {
      const precast = precastLookup(b.bait_id);
      const beginTime = chumTimeToNormal(b.start_ms, precast);
      const endTime = chumTimeToNormal(b.start_ms + b.size_ms * b.buckets.length, precast);

      buk.start_ms = beginTime;
      buk.buckets = new Array(
        Math.ceil((endTime - beginTime) / b.size_ms),
      ).fill(0);
      buk.is_chum = false;

      // 重新映射撒饵桶到对应的非撒饵桶位置
      for (let i = 0; i < b.buckets.length; i++) {
        const time = b.start_ms + b.size_ms * i;
        const count = b.buckets[i];
        const mappedTime = chumTimeToNormal(time, precast);
        const mappedIndex = Math.floor((mappedTime - beginTime) / b.size_ms);
        if (mappedIndex < 0) continue; // 映射到负数索引的桶，直接丢弃
        buk.buckets[mappedIndex] = count;
      }
    }

    const key = b.bait_id * 1000000 + b.fish_id;
    if (!mergedMap[key]) {
      mergedMap[key] = buk;
    } else {
      const existing = mergedMap[key];
      // 合并两个现有的桶
      const beginTime = Math.min(existing.start_ms, buk.start_ms);
      const endTime = Math.max(
        existing.start_ms + existing.size_ms * existing.buckets.length,
        buk.start_ms + buk.size_ms * buk.buckets.length,
      );
      const totalCount = Math.ceil((endTime - beginTime) / existing.size_ms);
      const prependCount = (existing.start_ms - beginTime) / existing.size_ms;
      const mergeOffset = (buk.start_ms - beginTime) / existing.size_ms;

      const mergedBuckets = new Array(totalCount).fill(0);
      for (let i = 0; i < existing.buckets.length; i++) {
        const idx = i + prependCount;
        if (idx >= 0 && idx < totalCount) {
          mergedBuckets[idx] += existing.buckets[i];
        }
      }
      for (let i = 0; i < buk.buckets.length; i++) {
        const idx = i + mergeOffset;
        if (idx >= 0 && idx < totalCount) {
          mergedBuckets[idx] += buk.buckets[i];
        }
      }
      mergedMap[key] = {
        ...existing,
        buckets: mergedBuckets,
        start_ms: beginTime,
      };
    }
  });

  return Object.values(mergedMap);
}

export function downSampleBuckets(
  buckets: DurationBucket[],
  size_ms: number,
): DurationBucket[] {
  return buckets.map((b) => {
    const beginTime = b.start_ms;
    const endTime = b.start_ms + b.size_ms * b.buckets.length;

    const newBeginTime = Math.floor(beginTime / size_ms) * size_ms;
    const newEndTime = Math.ceil(endTime / size_ms) * size_ms;
    const count = Math.ceil((newEndTime - newBeginTime) / size_ms);

    const newBuckets = new Array(count).fill(0);

    for (let i = 0; i < b.buckets.length; i++) {
      const time = b.start_ms + b.size_ms * i;
      const newIndex = Math.floor((time - newBeginTime) / size_ms);
      if (newIndex >= 0 && newIndex < count) {
        newBuckets[newIndex] += b.buckets[i];
      }
    }

    return {
      ...b,
      buckets: newBuckets,
      size_ms: size_ms,
      start_ms: newBeginTime,
    };
  });
}

export function getColor(name: string, accent: string) {
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(`--color-${name}-${accent}`).trim();
}

export function getColorArray(name: string[], accent: string) {
  const style = getComputedStyle(document.body);
  return name.map((n) =>
    style.getPropertyValue(`--color-${n}-${accent}`).trim(),
  );
}

export function getColorMatrix(name: string[], accent: string[]) {
  const style = getComputedStyle(document.body);
  const result: string[][] = [];
  for (let i = 0; i < accent.length; i++) {
    result.push([]);
  }
  for (let i = 0; i < name.length; i++) {
    for (let j = 0; j < accent.length; j++) {
      result[j][i] = style
        .getPropertyValue(`--color-${name[i]}-${accent[j]}`)
        .trim();
    }
  }
  return result;
}