import { createSubscriber } from "svelte/reactivity";
import type { FishingSession } from "./FishingSession";
import { TugType } from "./InnerEnums";
import { HistoryIndexedDBBackend } from "./HistoryIndexesDB";

// 一次钓鱼记录
export interface HistoryItem {
  zone: number; // 钓场ID
  bait: number; // 鱼饵ID
  fish: number; // 鱼ID
  chum: boolean; // 是否撒饵
  tugType: TugType; // 咬钩类型
  biteTime: number; // 咬钩时间（秒）

  date: number; // 记录时间（时间戳, ms）

  lureType: number | null; // 谦逊/雄心
  lureTarget: boolean; // 是否为目标鱼
  lureStacks: number; // 层数
  lureAt: number; // 最后一次的时间
  lureHidden: number; // 诱饵隐藏鱼

  hookType: number;
}

// 统计记录
export interface HistoryStatsItem {
  zone: number;
  bait: number;
  fish: number;
  chum: boolean;

  tugType: TugType;
  minBiteTime: number;
  maxBiteTime: number;

  count: number;
}

/**
 * 钓鱼本地记录存储和查询
 */
export class FishingStorage {
  histories: HistoryStorageBackend;
  inited: boolean = false;

  #subscribe;
  update: (() => void) | null = null;

  get Inited(): boolean {
    this.#subscribe();
    return this.inited;
  }

  constructor() {
    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    })

    const localBackend = new HistoryLocalStorageBackend();
    this.histories = localBackend;

    try {
      const dbBackend = new HistoryIndexedDBBackend();
      dbBackend.init().then(() => {
        this.histories = dbBackend;
        this.inited = true;

        // Migrate old data from localStorage to IndexedDB
        const oldData = localBackend.getAll();
        if (oldData.length > 0) {
          dbBackend.bulkAdd(oldData).then(() => {
            console.log("Migrated fishing history to IndexedDB.");
            localBackend.clear();
          }).catch((err) => {
            console.error("Failed to migrate fishing history to IndexedDB:", err);
          });
        }

        this.update?.();
      });
    } catch (e) {
      console.warn("IndexedDB is not available, using localStorage for fishing history.");
    }
  }

  public async updateHistory(session: FishingSession): Promise<void> {
    // 没上钩，不记录
    if (session.ResultID === undefined) {
      return;
    }

    const biteTime = session.ElapsedTimeMs / 1000;
    const item = {
      zone: session.Zone,
      bait: session.baitId,
      fish: session.ResultID,
      chum: session.chum,
      tugType: session.TugType || TugType.Light,
      biteTime: biteTime,
      date: session.startTime,
      lureType: session.LureType,
      lureTarget: session.LureTarget,
      lureStacks: session.LureStacks,
      lureAt: session.LureAt,
      lureHidden: session.HiddenFish,
      hookType: session.HookType!,
    };

    await this.histories.addRaw(item);

    // 空窗期刚结束的时候的时间是不准确的，忽略掉
    if (session.ElapsedTimeMs < session.LureRestMs + 300) {
      return;
    }
    await this.histories.add(item);

    console.log("Updated history:", item);
    this.update?.();
  }

  public async deleteHistory(date: number): Promise<void> {
    const deleted = await this.histories.deleteRaw(date);
    if (deleted !== undefined) {
      await this.histories.updateFromRaw(deleted.zone, deleted.bait, deleted.chum);
    }
    this.update?.();
  }

  public async getHistory(zone: number, bait?: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    this.#subscribe();
    return this.histories.getHistory(zone, bait, chum);
  }

  public async getBait(zone: number): Promise<number[]> {
    this.#subscribe();
    return this.histories.getBait(zone);
  }

  public async listHistory(zone: number, bait?: number, chum?: boolean, limit?: number, offset?: number): Promise<HistoryItem[]> {
    this.#subscribe();
    return this.histories.listHistory(zone, bait, chum, limit, offset);
  }

  public async countHistory(zone: number, bait?: number, chum?: boolean): Promise<number> {
    this.#subscribe();
    return this.histories.countHistory(zone, bait, chum);
  }

  public clear(): void {
    this.histories.clear();
    this.update?.();
  }
}

/**
 * 钓鱼记录存储后端接口
 */
export interface HistoryStorageBackend {
  /**
   * 添加一条记录
   * @param item 
   */
  add(item: HistoryItem): Promise<void>;
  addRaw(item: HistoryItem): Promise<void>;

  deleteRaw(date: number): Promise<HistoryItem | undefined>;
  updateFromRaw(zone: number, bait: number, chum?: boolean): Promise<void>;

  /**
   * 查找记录
   * @param zone 
   * @param bait 
   * @param chum 
   */
  getHistory(zone: number, bait?: number, chum?: boolean): Promise<HistoryStatsItem[]>;

  listHistory(zone: number, bait?: number, chum?: boolean, limit?: number, offset?: number): Promise<HistoryItem[]>;
  countHistory(zone: number, bait?: number, chum?: boolean): Promise<number>;

  /**
   * 获取所有鱼饵ID
   */
  getBait(zone: number): Promise<number[]>;

  clear(): void;
}

/**
 * 基于 localStorage 的钓鱼记录存储
 */
class HistoryLocalStorageBackend implements HistoryStorageBackend {
  histories: HistoryStatsItem[] = [];

  constructor() {
    var text = localStorage.getItem("fishingHistory");
    if (text) {
      try {
        this.histories = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse fishing history from localStorage:", e);
      }
    }
  }

  clear(): void {
    this.histories = [];
    localStorage.removeItem("fishingHistory");
  }

  add(session: HistoryItem): Promise<void> {
    var item = this.histories.find((h) => h.zone === session.zone && h.bait === session.bait && h.fish === session.fish && h.chum === session.chum);
    if (item === undefined) {
      item = {
        zone: session.zone,
        bait: session.bait,
        fish: session.fish,
        chum: session.chum,

        tugType: session.tugType || TugType.Light,
        minBiteTime: session.biteTime,
        maxBiteTime: session.biteTime,
        count: 1,
      };
      this.histories.push(item);
    } else {
      if (session.biteTime < item.minBiteTime) {
        item.minBiteTime = session.biteTime;
      }
      if (session.biteTime > item.maxBiteTime) {
        item.maxBiteTime = session.biteTime;
      }
      item.count += 1;
    }
    localStorage.setItem("fishingHistory", JSON.stringify(this.histories));
    return Promise.resolve();
  }

  addRaw(session: HistoryItem): Promise<void> {
    return Promise.resolve();
  }

  async deleteRaw(date: number): Promise<HistoryItem | undefined> {
    return undefined;
  }

  updateFromRaw(zone: number, bait: number, chum?: boolean): Promise<void> {
    return Promise.resolve();
  }

  getAll(): HistoryStatsItem[] {
    return this.histories;
  }

  listHistory(zone: number, bait: number, chum?: boolean, limit?: number, offset?: number): Promise<HistoryItem[]> {
    // Not supported in localStorage backend
    return Promise.resolve([]);
  }

  countHistory(zone: number, bait?: number, chum?: boolean): Promise<number> {
    // Not supported in localStorage backend
    return Promise.resolve(0);
  }

  async getBait(zone: number): Promise<number[]> {
    const baitSet = new Set<number>();
    for (const h of this.histories) {
      if (h.zone === zone) {
        baitSet.add(h.bait);
      }
    }
    return Array.from(baitSet);
  }

  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    return this.histories.filter((h) => h.zone === zone && h.bait === bait && (chum === undefined || h.chum === chum));
  }
}

