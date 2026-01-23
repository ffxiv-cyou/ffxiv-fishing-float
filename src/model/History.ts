import { encode } from "cbor2";
import type { API } from "./API";
import type { FishingSession } from "./FishingSession";
import { TugType } from "./InnerEnums";
import { createSubscriber } from "svelte/reactivity";
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Config } from "./Config";

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

export class FishingHistory {
  api: API;
  pendingSessions: FishingSession[] = [];
  histories: HistoryStorageBackend;
  cfg: Config;

  #subscribe;
  update: (() => void) | null = null;

  constructor(api: API, config: Config) {
    this.api = api;
    this.cfg = config;

    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    })

    const localBackend = new HistoryLocalStorageBackend();
    this.histories = localBackend;

    try {
      const dbBackend = new HistoryIndexedDBBackend();
      dbBackend.init().then(() => {
        this.histories = dbBackend;
        
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
      });
    } catch (e) {
      console.warn("IndexedDB is not available, using localStorage for fishing history.");
    }
  }

  public addSession(session: FishingSession): void {
    if (!session)
      return;

    this.pendingSessions.push(session);
    this.triggerUpload();

    this.updateHistory(session);
  }

  //#region Local History Management
  private updateHistory(session: FishingSession): void {
    if (session.resultID === undefined) {
      return;
    }

    if (session.elapsedTimeMs < session.lureRestMs) {
      return;
    }

    const biteTime = session.elapsedTimeMs / 1000;
    const item = {
      zone: session.Zone,
      bait: session.baitId,
      fish: session.resultID,
      chum: session.chum,
      tugType: session.tugType || TugType.Light,
      biteTime: biteTime,
    }
    this.histories.add(item);
    console.log("Updated history:", item);
    this.update?.();
  }

  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    this.#subscribe();
    return this.histories.getHistory(zone, bait, chum);
  }
  //#endregion

  //#region Data Upload
  nextUpload: number | null = null;
  private triggerUpload(): void {
    if (!this.cfg.UploadHistory || this.pendingSessions.length === 0 || this.nextUpload !== null) {
      return;
    }

    // 一分钟上报一次，避免频繁请求
    this.nextUpload = setTimeout(() => this.uploadPendingSessions(), 60 * 1000);
  }

  private uploadPendingSessions(): void {
    const sessionsToUpload = this.pendingSessions;

    const data = sessionsToUpload.map((s) => s.serialize());
    const body = encode(data);

    this.api.uploadFishingData(body).then(() => {
      this.pendingSessions.splice(0, sessionsToUpload.length);
      this.nextUpload = null;
    }).catch((err) => {
      console.error("Failed to upload fishing data:", err);
      this.nextUpload = null;
    });
  }
  //#endregion
}

// 一次钓鱼记录
interface HistoryItem {
  zone: number; // 钓场ID
  bait: number; // 鱼饵ID
  fish: number; // 鱼ID
  chum: boolean; // 是否撒饵
  tugType: TugType; // 咬钩类型
  biteTime: number; // 咬钩时间（秒）
}

/**
 * 钓鱼记录存储后端接口
 */
interface HistoryStorageBackend {
  /**
   * 添加一条记录
   * @param item 
   */
  add(item: HistoryItem): void;

  /**
   * 查找记录
   * @param zone 
   * @param bait 
   * @param chum 
   */
  getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]>;
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

  add(session: HistoryItem): void {
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
  }

  getAll(): HistoryStatsItem[] {
    return this.histories;
  }

  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    return this.histories.filter((h) => h.zone === zone && h.bait === bait && (chum === undefined || h.chum === chum));
  }
}

interface HistoryDBSchema extends DBSchema {
  history: {
    key: [number, number, number, number];
    value: HistoryStatsItem & {
      chumNum: number
    };
    indexes: {
      byZoneBait: [number, number];
      byZoneBaitChum: [number, number, number];
    };
  };
}

/**
 * 基于 IndexedDB 的钓鱼记录存储
 */
class HistoryIndexedDBBackend implements HistoryStorageBackend {
  db: IDBPDatabase<HistoryDBSchema> | null = null;

  constructor() {
    if (!('indexedDB' in window)) {
      throw new Error("IndexedDB is not supported in this environment.");
    }
  }

  async init(): Promise<void> {
    if (this.db)
      return Promise.resolve();

    this.db = await openDB<HistoryDBSchema>('FishingFloatDB', 1, {
      upgrade(db) {
        const store = db.createObjectStore('history', { keyPath: ['zone', 'bait', 'fish', 'chumNum'] });
        store.createIndex('byZoneBait', ['zone', 'bait']);
        store.createIndex('byZoneBaitChum', ['zone', 'bait', 'chumNum']);
      }
    });
  }

  async add(session: HistoryItem): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }

    const tx = this.db.transaction("history", "readwrite");
    const store = tx.objectStore("history");
    const old = await store.get([session.zone, session.bait, session.fish, session.chum ? 0 : 1]);
    if (old) {
      if (session.biteTime < old.minBiteTime) {
        old.minBiteTime = session.biteTime;
      }
      if (session.biteTime > old.maxBiteTime) {
        old.maxBiteTime = session.biteTime;
      }
      old.count += 1;
      await store.put(old);
    } else {
      const item = {
        zone: session.zone,
        bait: session.bait,
        fish: session.fish,
        chum: session.chum,
        chumNum: session.chum ? 0 : 1,
        tugType: session.tugType || TugType.Light,
        minBiteTime: session.biteTime,
        maxBiteTime: session.biteTime,
        count: 1,
      };
      await store.add(item);
    }
    await tx.done;
  }

  async bulkAdd(sessions: HistoryStatsItem[]): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }
    const tx = this.db.transaction("history", "readwrite");
    const store = tx.objectStore("history");
    for (const session of sessions) {
      const old = await store.get([session.zone, session.bait, session.fish, session.chum ? 0 : 1]);
      if (old) {
        if (session.minBiteTime < old.minBiteTime) {
          old.minBiteTime = session.minBiteTime;
        }
        if (session.maxBiteTime > old.maxBiteTime) {
          old.maxBiteTime = session.maxBiteTime;
        }
        old.count += session.count;
        await store.put(old);
      }
      else {
        await store.add({
          ...session,
          chumNum: session.chum ? 0 : 1
        });
      }
    }
    await tx.done;
  }

  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return [];
    }
    if (!this.db.objectStoreNames.contains("history")) {
      return [];
    }

    const tx = this.db.transaction("history", "readonly");
    const store = tx.objectStore("history");
    const useIndex = chum === undefined ? store.index("byZoneBait") : store.index("byZoneBaitChum");
    const key = chum === undefined ? [zone, bait] : [zone, bait, chum ? 0 : 1];
    return await useIndex.getAll(IDBKeyRange.only(key));
  }
}
