import { encode } from "cbor2";
import * as Sentry from "@sentry/svelte";
import { SpearDirectorParam, SpearFlags, SpearSkill } from "./CommonEnums";
import type { API } from "./API";
import type { Config } from "./Config";
import type { GameDatabase } from "./GameDB";
import type { FFXIVIpcActorControlSelf, FFXIVIpcClientTrigger } from "./Opcode";

const SPEAR_FISH_ID_OFFSET = 19999;

/**
 * 一条叉鱼记录，对应一次刷影（影）。
 *
 * 影生成时只能拿到槽位/速度/尺寸档/是否发光，鱼种要刺中后才知道，因此先在
 * `onSpawn` 建档，刺中时再由 `onCatch` 回填 `fishId`/`size`/`captureFlags`。
 * 未被刺中的记录保持 `fishId = 0`，以上报「仅生成」的影，用于计算出现概率。
 */
export interface SpearRecord {
    time: number; // 刷影时刻（服务器 epoch，毫秒）
    slot: number; // 槽位 0/1/2
    hq: boolean; // 发光影
    speed: number; // 速度 150~500；未知为 0
    sizeClass: number; // 尺寸档 1/2/3；未知为 0
    intuition: boolean; // 刷影时是否处于刺鱼人的直觉（鱼识）
    spotId: number; // 渔场 PlaceName id
    fishId: number; // 物品 ID；0 表示未捕获
    spearFishId: number; // 原始 SpearFishID；未捕获为 0
    size: number; // 尺寸；未捕获为 0
    captureFlags: number; // 捕获结算 flag；未捕获为 0
    captureTime: number; // 捕获结算的时刻；未捕获为 0
}

/**
 * 刺鱼采集跟踪
 */
export class SpearTracker {
    private api: API;
    private config: Config;
    private db: GameDatabase;
    /** 查询当前是否处于刺鱼人的直觉（鱼识）。 */
    private hasIntuition: () => boolean;

    /** 当前叉鱼会话的 eventId（来自 SystemLogMessage 3571/3579）；0 表示不在叉鱼中。 */
    eventId: number = 0;
    /** 当前渔场 PlaceName id；0 表示未知。 */
    spotId: number = 0;

    /** 各槽位当前存活的影（尚未结算）。 */
    private liveSpawns = new Map<number, SpearRecord>();
    private lockedSlots: number[] = [];
    /** 本轮锁定时各被锁槽位的影引用（刺中后回填）。 */
    private roundSpawns = new Map<number, SpearRecord>();
    /** 所有尚未结算的记录（含已被顶替但等待捕获回填的影）。 */
    private unresolved = new Set<SpearRecord>();
    /** 本轮已配对的 p2=3 数量，即下一条到达的 p2=3 的配对序号。 */
    private roundCatchIndex = 0;
    /** 本轮锁定（717）时刻；保留用于诊断与将来切换记录时间语义。 */
    private lockTime: number = 0;
    /** 最近一次使用刺鱼技能（713, Gig）的时刻；保留用于诊断与将来切换记录时间语义。 */
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

    constructor(api: API, config: Config, db: GameDatabase, hasIntuition: () => boolean = () => false) {
        this.api = api;
        this.config = config;
        this.db = db;
        this.hasIntuition = hasIntuition;
    }

    public setSpot(eventId: number, spotId: number): void {
        // 不在笔记中的钓场
        if (this.eventId === eventId && this.spotId === 0) {
            this.spotId = spotId;
            return;
        }

        // 换渔场或换节点：旧的刷影状态与本轮配对状态一起作废，
        // 尚未结算的影按「未捕获」结算后送上传队列。
        if (this.eventId !== eventId || this.spotId !== spotId) {
            this.finalizeAll();
            this.lockedSlots = [];
            this.roundCatchIndex = 0;
            this.lockTime = 0;
            this.skillTime = 0;
        }

        this.eventId = eventId;
        this.spotId = spotId;
    }

    /** 
     * 生成一条鱼（影）
     */
    public onSpawn(param: FFXIVIpcActorControlSelf, epoch: number): void {
        // 未知渔场不记录：后端要求 spot_id 非 0
        if (this.spotId === 0) {
            return;
        }

        const slot = param.param3 % 10000;
        const hq = param.param3 >= 10000;
        const speed = param.param4;
        const sizeClass = param.param5;

        // 同一槽位出现新影：旧影被顶替。若旧影正等待捕获回填（本轮锁定），
        // 保留它以便换 / 收鱼时回填，否则确定「未捕获」并结算。
        const previous = this.liveSpawns.get(slot);
        if (previous && !this.isPendingCatch(previous)) {
            this.resolve(previous);
        }

        const record: SpearRecord = {
            time: epoch,
            slot,
            hq,
            speed,
            sizeClass,
            intuition: this.hasIntuition(),
            spotId: this.spotId,
            fishId: 0,
            spearFishId: 0,
            size: 0,
            captureFlags: 0,
            captureTime: 0,
        };
        this.unresolved.add(record);
        this.liveSpawns.set(slot, record);
    }

    /**
     * 新一轮从 717 开始：快照被锁槽位的影（713→p2=3 之间可能有新的 p2=1
     * 把槽位覆盖掉），重置本轮捕获计数。p2=3 到达顺序 == lockedSlots 升序。
     */
    public onLock(param: FFXIVIpcClientTrigger, epoch: number): void {
        // 上一轮锁定、本轮未再锁定的影：影已被顶替，确定「未捕获」。
        // （仍在 liveSpawns 里的影会随本轮快照继续等待捕获。）
        for (const [slot, record] of this.roundSpawns) {
            if (this.liveSpawns.get(slot) !== record) {
                this.resolve(record);
            }
        }

        this.lockedSlots = [];
        [param.param2, param.param3, param.param4].forEach((value, slot) => {
            if (value === 0) {
                this.lockedSlots.push(slot);
            }
        });
        this.roundSpawns.clear();
        for (const slot of this.lockedSlots) {
            const record = this.liveSpawns.get(slot);
            if (record) {
                this.roundSpawns.set(slot, record);
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
        const record = slot !== undefined ? this.roundSpawns.get(slot) : undefined;
        if (record === undefined) {
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

        // 回填影的捕获结果：time/slot/速度/尺寸档/鱼识沿用刷影时的快照。
        record.fishId = fishId;
        record.spearFishId = spearFishId;
        record.size = size;
        record.captureFlags = captureFlag;
        record.captureTime = epoch;
        this.roundSpawns.delete(slot);
        if (this.liveSpawns.get(slot) === record) {
            this.liveSpawns.delete(slot);
        }
        this.resolve(record);
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
        this.finalizeAll();
        this.eventId = 0;
        this.spotId = 0;
        this.lockedSlots = [];
        this.roundCatchIndex = 0;
        this.lockTime = 0;
        this.skillTime = 0;
        if (this.config.UploadHistory)
            this.uploadPending();
    }

    /** 把一条影标记为已结算并进入上传队列。重复调用无副作用。 */
    private resolve(record: SpearRecord): void {
        if (!this.unresolved.delete(record)) {
            return;
        }
        this.pending.push(record);
        this.triggerUpload();
    }

    /** 结算所有尚未结算的影（换场/离场时），并把队列送去上传。 */
    private finalizeAll(): void {
        for (const record of this.unresolved) {
            this.pending.push(record);
        }
        this.unresolved.clear();
        this.liveSpawns.clear();
        this.roundSpawns.clear();
        this.triggerUpload();
    }

    private isPendingCatch(record: SpearRecord): boolean {
        for (const pending of this.roundSpawns.values()) {
            if (pending === record) {
                return true;
            }
        }
        return false;
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
        const fishId = record.fishId || record.spearFishId;
        let flags = record.captureFlags & SpearFlags.CaptureMask;
        if (record.hq) flags |= SpearFlags.Glowing;
        flags |= (record.sizeClass & SpearFlags.SizeClassMask) << SpearFlags.SizeClassShift;
        flags |= (record.slot & SpearFlags.SlotMask) << SpearFlags.SlotShift;
        if (record.intuition) flags |= SpearFlags.Intuition;
        if (fishId === 0) flags |= SpearFlags.Uncaught;

        return [record.time, record.spotId, fishId, record.size, record.speed, flags];
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
