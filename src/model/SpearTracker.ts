import { encode } from "cbor2";
import * as Sentry from "@sentry/svelte";
import { SpearDirectorParam, SpearSkill } from "./CommonEnums";
import type { API } from "./API";
import type { Config } from "./Config";
import type { GameDatabase } from "./GameDB";
import type { FFXIVIpcActorControlSelf, FFXIVIpcClientTrigger } from "./Opcode";

const SPEAR_FISH_ID_OFFSET = 19999;

/** 单个槽位的刷影信息 */
interface SpearSpawn {
    time: number;
    slot: number;
    hq: boolean;
    speed: number;
    sizeClass: number;
}

/**
 * 一条叉鱼捕获记录，对应一次使用技能中的一条鱼。
 */
export interface SpearRecord extends SpearSpawn {
    captureTime: number; // 捕获结算的时刻
    spotId: number; // 渔场 PlaceName id
    fishId: number; // 物品 ID
    spearFishId: number; // 原始 SpearFishID
    size: number;
    captureFlags: number;
}

/**
 * 刺鱼采集跟踪
 */
export class SpearTracker {
    private api: API;
    private config: Config;
    private db: GameDatabase;

    /** 当前叉鱼会话的 eventId（来自 SystemLogMessage 3571/3579）；0 表示不在叉鱼中。 */
    eventId: number = 0;
    /** 当前渔场 PlaceName id；0 表示未知。 */
    spotId: number = 0;

    private spawns = new Map<number, SpearSpawn>();
    private lockedSlots: number[] = [];
    /** 本轮锁定时各被锁槽位的刷影快照 */
    private roundSpawns = new Map<number, SpearSpawn>();
    /** 本轮已配对的 p2=3 数量，即下一条到达的 p2=3 的配对序号。 */
    private roundCatchIndex = 0;
    private lockTime: number = 0;
    private skillTime: number = 0;

    /** 顺序配对断言计数：锁数与鱼数不一致的丢弃次数（遥测/排障用）。 */
    orderViolations = 0;
    /** 无归属可配对而丢弃的捕获次数（空锁、槽位无推送等）。 */
    unattributedDrops = 0;
    private lastAnomalyReportAt = 0;
    private static readonly ANOMALY_REPORT_COOLDOWN_MS = 5 * 60 * 1000;

    pending: SpearRecord[] = [];
    private nextUpload: ReturnType<typeof setTimeout> | null = null;
    private retryCount = 0;
    private uploading = false;

    constructor(api: API, config: Config, db: GameDatabase) {
        this.api = api;
        this.config = config;
        this.db = db;
    }

    public setSpot(eventId: number, spotId: number): void {
        // 不在笔记中的钓场
        if (this.eventId === eventId && this.spotId === 0) {
            this.spotId = spotId;
            return;
        }

        // 换渔场或换节点：旧的刷影状态与本轮配对状态一起作废
        if (this.eventId !== eventId || this.spotId !== spotId) {
            this.spawns.clear();
            this.lockedSlots = [];
            this.roundSpawns.clear();
            this.roundCatchIndex = 0;
            this.lockTime = 0;
            this.skillTime = 0;
        }

        this.eventId = eventId;
        this.spotId = spotId;
    }

    /** 
     * 生成一条鱼
     */
    public onSpawn(param: FFXIVIpcActorControlSelf, epoch: number): void {
        const slot = param.param3 % 10000;
        const hq = param.param3 >= 10000;
        const speed = param.param4;
        const sizeClass = param.param5;
        this.spawns.set(slot, { time: epoch, slot, hq, speed, sizeClass });
    }

    /**
     * 新一轮从 717 开始：快照被锁槽位的刷影（713→p2=3 之间可能有新的 p2=1
     * 把槽位覆盖掉），重置本轮捕获计数。p2=3 到达顺序 == lockedSlots 升序。
     */
    public onLock(param: FFXIVIpcClientTrigger, epoch: number): void {
        this.lockedSlots = [];
        [param.param2, param.param3, param.param4].forEach((value, slot) => {
            if (value === 0) {
                this.lockedSlots.push(slot);
            }
        });
        this.roundSpawns.clear();
        for (const slot of this.lockedSlots) {
            const spawn = this.spawns.get(slot);
            if (spawn) {
                this.roundSpawns.set(slot, { ...spawn });
            }
        }
        this.roundCatchIndex = 0;
        this.lockTime = epoch;
    }

    public onUseSkill(param: FFXIVIpcClientTrigger, epoch: number): void {
        const skillId = param.param2;
        if (skillId !== SpearSkill.Gig) {
            return;
        }
        this.skillTime = epoch;
    }

    public onCatch(param: FFXIVIpcActorControlSelf, epoch: number): void {
        const spearFishId = param.param3;
        const size = param.param4;
        const captureFlag = param.param5;

        if (this.spotId === 0) {
            console.warn("Spear catch without a known spot, dropped:", spearFishId);
            return;
        }

        let fishId = this.resolveItemId(spearFishId);
        if (fishId === 0) {
            console.warn("Failed to resolve spear fish item id:", spearFishId);
        }

        // 按到达顺序配对到升序锁定位：本轮第 k 个到达的 p2=3 属于 lockedSlots[k]。
        // 配不上（空锁/锁鱼数不一致/槽位推送丢失）一律丢弃，不污染后端牌表。
        const slot = this.lockedSlots[this.roundCatchIndex];
        const spawn = slot !== undefined ? this.roundSpawns.get(slot) : undefined;
        if (spawn === undefined) {
            this.unattributedDrops++;
            if (this.lockedSlots.length === 0) {
                console.warn("Spear catch without a preceding lock, dropped:", spearFishId);
            } else {
                this.orderViolations++;
                console.error("Spear catch/lock count mismatch, dropped:", {
                    spearFishId,
                    locks: this.lockedSlots.length,
                    index: this.roundCatchIndex,
                });
            }
            this.reportAnomaly("catch-dropped", { spearFishId });
            return;
        }
        this.roundCatchIndex++;

        this.pending.push({
            ...spawn,
            time: this.skillTime || this.lockTime || epoch,
            spotId: this.spotId,
            fishId,
            spearFishId,
            size,
            captureFlags: captureFlag,
            captureTime: epoch,
        });
        this.triggerUpload();
    }

    public handleDirectorUpdate(data: FFXIVIpcActorControlSelf, epoch: number): boolean {
        if (this.eventId === 0 || this.eventId !== data.param1)
            return false;

        switch (data.param2) {
            case SpearDirectorParam.Spawn:
                this.onSpawn(data, epoch);
                break;
            case SpearDirectorParam.Catch:
                this.onCatch(data, epoch);
                break;
        }
        return true;
    }

    /** EventFinish：结束当前叉鱼会话并立即上报。 */
    public finish(eventId: number): void {
        if (this.eventId === 0 || eventId !== this.eventId) {
            return;
        }
        this.eventId = 0;
        this.spotId = 0;
        this.spawns.clear();
        this.lockedSlots = [];
        this.roundSpawns.clear();
        this.roundCatchIndex = 0;
        this.lockTime = 0;
        this.skillTime = 0;
        if (this.config.UploadHistory)
            this.uploadPending();
    }

    private reportAnomaly(kind: string, extra: Record<string, unknown>): void {
        const now = Date.now();
        if (now - this.lastAnomalyReportAt < SpearTracker.ANOMALY_REPORT_COOLDOWN_MS)
            return;
        this.lastAnomalyReportAt = now;
        Sentry.captureMessage(`spearfishing ${kind}`, {
            level: "warning",
            fingerprint: ["spearfishing-anomaly", kind],
            extra: {
                eventId: this.eventId,
                spotId: this.spotId,
                orderViolations: this.orderViolations,
                unattributedDrops: this.unattributedDrops,
                ...extra,
            },
        });
    }

    private resolveItemId(spearFishId: number): number {
        const note = this.db.getFishingNoteInfo();
        if (!note) {
            return 0;
        }
        return note.spear_fishes[spearFishId - SPEAR_FISH_ID_OFFSET] ?? 0;
    }

    private serialize(record: SpearRecord): unknown[] {
        let flags = record.captureFlags & 0x7;
        flags |= ((record.hq ? 1 : 0) << 3);
        flags |= ((record.sizeClass & 0x3) << 4);
        flags |= ((record.slot & 0x3) << 6);

        return [record.time, record.spotId, record.fishId || record.spearFishId, record.size, record.speed, flags];
    }

    private triggerUpload(): void {
        if (!this.config.UploadHistory || this.pending.length === 0 || this.nextUpload !== null) {
            return;
        }
        this.nextUpload = setTimeout(() => this.uploadPending(), 60 * 1000);
    }

    public uploadPending(): void {
        // 防止上一次请求未完成时重复发送同一批记录。
        if (this.uploading) {
            return;
        }
        const records = this.pending.slice();
        if (records.length === 0) {
            return;
        }

        this.uploading = true;
        const body = encode(records.map((r) => this.serialize(r)));
        this.api.uploadSpearData(body).then((resp) => {
            this.uploading = false;
            if (!resp.ok) {
                console.error("Failed to upload spearfishing data, server responded with status", resp.status);
                this.retryCount++;
                this.nextUpload = setTimeout(() => this.uploadPending(), Math.min(10 * 60 * 1000, this.retryCount * 30000));
                return;
            }

            this.pending.splice(0, records.length);
            this.nextUpload = null;
            this.retryCount = 0;
            // 上报期间可能又产生了新记录，继续安排上报。
            if (this.pending.length > 0) {
                this.triggerUpload();
            }
        }).catch((err) => {
            this.uploading = false;
            console.error("Failed to upload spearfishing data:", err);
            this.retryCount++;
            this.nextUpload = setTimeout(() => this.uploadPending(), Math.min(10 * 60 * 1000, this.retryCount * 30000));
        });
    }
}
