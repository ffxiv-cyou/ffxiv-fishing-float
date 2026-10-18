const STORAGE_KEY = "fishing_float_api_cache";
/** 最多保留的条目数，超出时按写入时间淘汰最旧的 */
const MAX_ENTRIES = 50;

interface CacheEntry {
  /** 写入时间（epoch ms） */
  t: number;
  v: unknown;
}

function load(): Record<string, CacheEntry> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function readApiCache<T>(key: string): T | undefined {
  return load()[key]?.v as T | undefined;
}

export function writeApiCache<T>(key: string, value: T): void {
  const store = load();
  store[key] = { t: Date.now(), v: value };

  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => store[a].t - store[b].t)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => delete store[k]);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage 不可用或配额不足，放弃缓存
  }
}
