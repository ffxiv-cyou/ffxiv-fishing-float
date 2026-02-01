import { openDB, type IDBPDatabase, type DBSchema, type IDBPObjectStore, type IDBPTransaction } from 'idb';
import type { HistoryItem, HistoryStatsItem, HistoryStorageBackend } from './HistoryStorage';
import { TugType } from './InnerEnums';

interface DbStatsItem extends HistoryStatsItem {
  chumNum: number;
}

interface HistoryDBSchema extends DBSchema {
  history: {
    key: [number, number, number, number]; // zone, bait, fish, chumNum
    value: DbStatsItem;
    indexes: {
      byZoneBait: [number, number];
      byZoneBaitChum: [number, number, number];
    };
  };
  historyV2: {
    key: [number, number, number, number]; // zone, bait, fish, chumNum
    value: DbStatsItem;
    indexes: {
      byZone: [number];
      byZoneBait: [number, number];
      byZoneBaitChum: [number, number, number];
    };
  };
  historyLog: {
    key: [number]; // fishing timestamp
    value: HistoryLogItem;
    indexes: {
      byZone: [number];
      byZoneBait: [number, number];
      byZoneBaitChum: [number, number, number];
    };
  }
}

type HistoryLogItem = HistoryItem & {
  chumNum: number;
}

/**
 * 基于 IndexedDB 的钓鱼记录存储
 */
export class HistoryIndexedDBBackend implements HistoryStorageBackend {
  db: IDBPDatabase<HistoryDBSchema> | null = null;

  constructor() {
    if (!('indexedDB' in window)) {
      throw new Error("IndexedDB is not supported in this environment.");
    }
  }

  async init(): Promise<void> {
    if (this.db)
      return Promise.resolve();

    this.db = await openDB<HistoryDBSchema>('FishingFloatDB', 2, {
      upgrade: this.handleUpgrade.bind(this),
    });
  }

  initDBVersion1(db: IDBPDatabase<HistoryDBSchema>) {
    const store = db.createObjectStore('history', { keyPath: ['zone', 'bait', 'fish', 'chumNum'] });
    store.createIndex('byZoneBait', ['zone', 'bait']);
    store.createIndex('byZoneBaitChum', ['zone', 'bait', 'chumNum']);
    return store;
  }

  initDBVersion2(db: IDBPDatabase<HistoryDBSchema>) {
    const log = db.createObjectStore('historyLog', { keyPath: ['date'] });
    log.createIndex('byZone', ['zone']);
    log.createIndex('byZoneBait', ['zone', 'bait']);
    log.createIndex('byZoneBaitChum', ['zone', 'bait', 'chumNum']);

    const historyStore = db.createObjectStore('historyV2', { keyPath: ['zone', 'bait', 'fish', 'chumNum'] });
    historyStore.createIndex('byZone', ['zone']);
    historyStore.createIndex('byZoneBait', ['zone', 'bait']);
    historyStore.createIndex('byZoneBaitChum', ['zone', 'bait', 'chumNum']);

    return [historyStore, log];
  }

  handleUpgrade(db: IDBPDatabase<HistoryDBSchema>, oldVersion: number, newVersion: number | null, tx: IDBPTransaction<HistoryDBSchema, ("history" | "historyV2" | "historyLog")[], "versionchange">): void {
    if (oldVersion === 0) {
      this.initDBVersion2(db);
    }

    if (oldVersion === 1 && newVersion === 2) {
      this.initDBVersion2(db);

      // Migrate existing data from version 1 to version 2
      const oldStore = tx.objectStore('history');
      const newStore = tx.objectStore('historyV2');

      oldStore.getAll().then((allRecords) => {
        allRecords.forEach((record) => {
          record.chumNum = record.chum ? 1 : 0; // 修正 Index 错误
          console.log("Migrated record to historyV2:", record);
          newStore.add(record);
        });
      });

      // db.deleteObjectStore('history');
    }
  }

  /**
   * Convert boolean to number for IndexedDB key
   * @param value 
   * @returns 
   */
  static boolToNum(value: boolean): number {
    return value ? 1 : 0;
  }

  /**
   * Convert number to boolean for IndexedDB key
   * @param value 
   * @returns 
   */
  static numToBool(value: number): boolean {
    return value !== 0;
  }

  async addRaw(item: HistoryItem): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }

    const logTx = this.db.transaction("historyLog", "readwrite");
    const logStore = logTx.objectStore("historyLog");
    const logItem = {
      ...item,
      chumNum: HistoryIndexedDBBackend.boolToNum(item.chum)
    };
    await logStore.add(logItem);
    await logTx.done;
  }

  async deleteRaw(date: number): Promise<HistoryItem | undefined> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return undefined;
    }
    const logTx = this.db.transaction("historyLog", "readwrite");
    const logStore = logTx.objectStore("historyLog");
    const deletedItem = await logStore.get([date]);
    await logStore.delete([date]);
    await logTx.done;
    return deletedItem;
  }

  async add(session: HistoryItem): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }

    const tx = this.db.transaction("historyV2", "readwrite");
    const store = tx.objectStore("historyV2");
    const old = await store.get([session.zone, session.bait, session.fish, HistoryIndexedDBBackend.boolToNum(session.chum)]);
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
        chumNum: HistoryIndexedDBBackend.boolToNum(session.chum),
        tugType: session.tugType || TugType.Light,
        minBiteTime: session.biteTime,
        maxBiteTime: session.biteTime,
        count: 1,
      };
      await store.add(item);
    }
    await tx.done;
  }

  /**
   * 从日志中重新加载统计数据
   * @param zone 
   * @param bait 
   * @param chum 
   * @returns 
   */
  async updateFromRaw(zone: number, bait: number, chum?: boolean): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }
    if (!this.db.objectStoreNames.contains("historyLog")) {
      console.error("historyLog store does not exist");
      return;
    }
    const logTx = this.db.transaction("historyLog", "readonly");
    const logStore = logTx.objectStore("historyLog");
    const index = chum === undefined ? logStore.index("byZoneBait") : logStore.index("byZoneBaitChum");
    const key = chum === undefined ? [zone, bait] : [zone, bait, HistoryIndexedDBBackend.boolToNum(chum)];
    const logs = await index.getAll(IDBKeyRange.only(key));
    await logTx.done;

    const sessions: DbStatsItem[] = [];
    for (const log of logs) {
      let existing = sessions.find(s => s.zone === log.zone && s.bait === log.bait && s.fish === log.fish && s.chum === log.chum);
      if (existing) {
        if (log.biteTime < existing.minBiteTime) {
          existing.minBiteTime = log.biteTime;
        }
        if (log.biteTime > existing.maxBiteTime) {
          existing.maxBiteTime = log.biteTime;
        }
        existing.count += 1;
      } else {
        sessions.push({
          zone: log.zone,
          bait: log.bait,
          fish: log.fish,
          chum: log.chum,
          chumNum: HistoryIndexedDBBackend.boolToNum(log.chum),
          tugType: log.tugType,
          minBiteTime: log.biteTime,
          maxBiteTime: log.biteTime,
          count: 1,
        });
      }
    }

    const tx = this.db.transaction("historyV2", "readwrite");
    const store = tx.objectStore("historyV2");
    for (const session of sessions) {
      store.put(session);
    }
  }

  /**
   * 批量添加统计数据
   * @param sessions 
   * @returns 
   */
  async bulkAdd(sessions: HistoryStatsItem[]): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }
    const tx = this.db.transaction("historyV2", "readwrite");
    const store = tx.objectStore("historyV2");
    for (const session of sessions) {
      const old = await store.get([session.zone, session.bait, session.fish, HistoryIndexedDBBackend.boolToNum(session.chum)]);
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
          chumNum: HistoryIndexedDBBackend.boolToNum(session.chum)
        });
      }
    }
    await tx.done;
  }

  public async getBait(zone: number): Promise<number[]> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return [];
    }
    if (!this.db.objectStoreNames.contains("historyV2")) {
      return [];
    }
    const tx = this.db.transaction("historyV2", "readonly");
    const store = tx.objectStore("historyV2");
    const index = store.index("byZone");
    const range = IDBKeyRange.only([zone]);
    const result = await index.getAllKeys(range);
    const baitSet = new Set<number>();
    for (const key of result) {
      baitSet.add(key[1]);
    }
    return Array.from(baitSet);
  }

  public async getHistory(zone: number, bait?: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return [];
    }
    if (!this.db.objectStoreNames.contains("historyV2")) {
      return [];
    }

    const tx = this.db.transaction("historyV2", "readonly");
    const store = tx.objectStore("historyV2");
    const useIndex = chum === undefined ? (bait === undefined ? store.index("byZone") : store.index("byZoneBait")) : store.index("byZoneBaitChum");
    const key = chum === undefined ? (bait === undefined ? [zone] : [zone, bait]) : [zone, bait, HistoryIndexedDBBackend.boolToNum(chum)];
    const result = await useIndex.getAll(IDBKeyRange.only(key));
    for (const item of result) {
      item.chum = HistoryIndexedDBBackend.numToBool(item.chumNum);
    }
    return result;
  }

  public async listHistory(zone: number, bait?: number, chum?: boolean, limit?: number, offset?: number): Promise<HistoryItem[]> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return [];
    }
    if (!this.db.objectStoreNames.contains("historyLog")) {
      return [];
    }
    const tx = this.db.transaction("historyLog", "readonly");
    const store = tx.objectStore("historyLog");
    const useIndex = chum === undefined ? (bait === undefined ? store.index("byZone") : store.index("byZoneBait")) : store.index("byZoneBaitChum");
    const key = chum === undefined ? (bait === undefined ? [zone] : [zone, bait]) : [zone, bait, HistoryIndexedDBBackend.boolToNum(chum)];
    const cursor = await useIndex.openCursor(IDBKeyRange.only(key), 'prev');
    if (offset) {
      cursor?.advance(offset);
    }
    console.log("Listing history with cursor:", cursor);
    const results: HistoryItem[] = [];
    let count = 0;
    while (cursor && (!limit || count < limit)) {
      if (!cursor.value) {
        break;
      }
      results.push({
        ...cursor.value,
        chum: HistoryIndexedDBBackend.numToBool(cursor.value.chumNum),
      });
      count++;
      await cursor.continue();
    }

    return results;
  }

  public async clear(): Promise<void> {
    if (!this.db) {
      console.error("IndexedDB is not initialized");
      return;
    }
    const tx = this.db.transaction("historyV2", "readwrite");
    const store = tx.objectStore("historyV2");
    await store.clear();
    await tx.done;
  }
}
