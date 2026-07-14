import { createSubscriber } from "svelte/reactivity";
import { type TugType, type HookType, FailReason, LureType } from "./InnerEnums";
import type { FisherStats } from "./FishingTracker";

export class FishingSession {
    startTime: number = 0;
    endTime: number = 0;
    startLocalTime: number;
    endLocalTime: number | null = null;

    baitId: number;
    private zone: number = 0; // PlaceName actually

    chum: boolean = false; // 撒饵
    fishEyes: boolean = false; // 鱼眼
    fishersIntuition: boolean = false; // 捕鱼人之识
    collections: boolean = false; // 收藏品
    bigGameFishing: boolean = false; // 大鱼猎手
    prizeCatch: boolean = false; // 大鱼知识
    patients: number = 0; // 耐心层数

    private lureType: LureType | null = null; // 雄心/谦逊
    private lureTarget: boolean = false; // 是否为目标
    private lureStacks: number = 0; // 层数
    private lureAt: number = 0; // 最后一次的时间
    private lureTimes: number[] = []; // 使用诱饵的时间列表

    private identicalFish: number = 0; // 专一垂钓
    private slapFish: number = 0; // 拍击水面
    private hiddenFish: number = 0; // 隐藏鱼ID
    private hiddenStacks: number = 0; // 鱼词出现时的层数

    private tugType: TugType | null = null;
    private hookType: HookType | null = null;
    private patienceHookResult: PatienceHookResult | null = null;

    private result: FishingResult | FishingFail | null = null;
    fisherStats: FisherStats;

    #subscribe;
    update: (() => void) | null = null;

    constructor(epoch: number, baitId: number, stats: FisherStats) {
        this.startTime = 0;
        this.baitId = baitId;
        this.startLocalTime = Date.now();
        this.fisherStats = stats;

        this.#subscribe = createSubscriber((update) => {
            this.update = update;
        });
    }

    public serverCast(epoch: number): void {
        this.startTime = epoch;
        this.startLocalTime = Date.now();
    }

    public clientSetBait(baitId: number): void {
        this.baitId = baitId;
        this.onUpdate();
    }

    public tug(tugType: TugType, epoch: number): void {
        this.endTime = epoch;
        this.tugType = tugType;
        this.endLocalTime = Date.now();

        if (this.startTime === 0) {
            console.warn("Received tug without start time, using local time", tugType, epoch);
        }

        this.onUpdate();
    }

    public hook(hookType: HookType): void {
        this.hookType = hookType;
        this.onUpdate();
    }

    public setResult(itemId: number, quantity: number, size: number, isHQ: boolean, isColl: boolean): void {
        this.result = { itemId, quantity, size, isHQ };
        this.onUpdate();
    }

    public setFail(reason: FailReason): void {
        // 由于提示词有点重复，如果是没有提，那么改为中断
        if (this.hookType === null) {
            reason = FailReason.Interrputed;
        }
        this.result = { reason };
        this.onUpdate();
    }

    /**
     * 手动设置钓鱼结束
     * @param epoch 
     */
    public setFinish(epoch: number): void {
        // 防止调用顺序导致结果被覆盖
        if (this.result === null) {
            this.result = { reason: FailReason.Interrputed };
            if (this.endTime === 0 && this.endLocalTime === null) {
                this.endTime = epoch;
                this.endLocalTime = Date.now();
            }
        }
        this.onUpdate();
    }

    /**
     * 设置精准/强力提钩的结果 
     * @param isPrecision 精准提钩为true，强力提钩为false
     * @param success 正确使用技能
     */
    public setPatienceResult(isPrecision: boolean, success: boolean): void {
        this.patienceHookResult = { isPrecision, success };
        this.onUpdate();
    }

    setHiddenFish(fishID: number, epoch: number) {
        // 防止时序问题把这个数据给刷掉
        if (this.hiddenFish !== 0 && fishID === 0)
            return;

        // 时序，判断下出现鱼词时使用的层数
        const deltaEpoch = epoch - this.lureAt;
        if (Math.abs(deltaEpoch) < 800 || this.lureStacks >= 3) {
            this.hiddenStacks = this.lureStacks;
        } else {
            this.hiddenStacks = this.lureStacks + 1;
        }

        this.hiddenFish = fishID;
        this.onUpdate();
    }

    get HiddenFish(): number {
        return this.hiddenFish;
    }

    public setLure(type: LureType, stacks: number, epoch: number): void {
        this.lureType = type;
        this.lureStacks = stacks;
        this.lureAt = epoch;
        this.lureTimes.push(epoch); // 一定是一层一层的叠上去
        this.onUpdate();
    }

    public setLureTarget(isTarget: boolean): void {
        this.lureTarget = isTarget;
        this.onUpdate();
    }

    private onUpdate() {
        if (this.update) this.update();
    }

    get Zone(): number {
        this.#subscribe();
        return this.zone;
    }

    set Zone(val: number) {
        this.zone = val;
        this.onUpdate();
    }

    get IdenticalFish(): number {
        this.#subscribe();
        return this.identicalFish;
    }

    set IdenticalFish(val: number) {
        this.identicalFish = val;
        this.onUpdate();
    }

    get SlapFish(): number {
        this.#subscribe();
        return this.slapFish;
    }

    set SlapFish(val: number) {
        this.slapFish = val;
        this.onUpdate();
    }

    get elapsedTime(): number {
        this.#subscribe();
        if (this.endTime && this.startTime) {
            return this.endTime - this.startTime;
        }
        let endLocalTime = this.endLocalTime ?? Date.now();
        return endLocalTime - this.startLocalTime;
    }

    // 当前经过的时间
    get ElapsedTimeMs(): number {
        this.#subscribe();

        // 如果没有使用 server cast 来设置开始时间，那么就用本地时间来计算
        if (this.endTime && this.startTime) {
            return this.endTime - this.startTime;
        }

        const now = Date.now();
        return now - this.startLocalTime;
    }

    // 谦逊/雄心的保护时间窗
    get LureRestMs(): number {
        this.#subscribe();

        if (this.lureAt === 0)
            return 0;

        return this.lureAt - this.startTime + 5000;
    }

    get FailReason(): FailReason | null {
        this.#subscribe();

        if (this.result && 'reason' in this.result)
            return this.result.reason;
        return null;
    }

    /**
     * 是否完整钓鱼数据（非中断）
     */
    get Complete(): boolean {
        this.#subscribe();
        return this.FailReason !== FailReason.Interrputed;
    }

    get isIncomplete(): boolean {
        return this.startTime === 0 || this.zone === 0 || this.baitId === 0 || this.elapsedTime === 0;
    }

    get incompleteReason(): string[] {
        const reasons: string[] = [];
        if (this.startTime === 0) reasons.push('missing_start_time');
        if (this.zone === 0) reasons.push('missing_zone');
        if (this.baitId === 0) reasons.push('missing_bait');
        if (this.elapsedTime === 0) reasons.push('missing_elapsed');
        return reasons;
    }

    get diagnosticSnapshot(): Record<string, any> {
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            startLocalTime: this.startLocalTime,
            endLocalTime: this.endLocalTime,
            zone: this.zone,
            baitId: this.baitId,
            elapsedTime: this.elapsedTime,
            tugType: this.tugType,
            hookType: this.hookType,
            hasResult: this.FishResult !== null,
            failReason: this.FailReason,
        };
    }

    get FishResult(): FishingResult | null {
        this.#subscribe();

        if (this.result && 'itemId' in this.result)
            return this.result;
        return null;
    }

    get ResultID(): number | undefined {
        this.#subscribe();

        if (this.FishResult)
            return this.FishResult.itemId;
        return undefined;
    }

    get TugType(): TugType | null {
        this.#subscribe();
        return this.tugType;
    }

    get HookType(): HookType | null {
        this.#subscribe();
        return this.hookType;
    }

    get LureType(): LureType | null {
        this.#subscribe();
        return this.lureType;
    }

    get LureStacks(): number {
        this.#subscribe();
        return this.lureStacks;
    }

    get LureTarget(): boolean {
        this.#subscribe();
        return this.lureTarget;
    }

    get LureAt(): number {
        this.#subscribe();
        return this.lureAt;
    }

    private get flags(): FishingFlags {
        let flags = 0;
        if (this.chum) flags |= FishingFlags.StateChum;
        if (this.fishEyes) flags |= FishingFlags.StateFishEye;
        if (this.fishersIntuition) flags |= FishingFlags.StateFisherIntuition;
        if (this.bigGameFishing) flags |= FishingFlags.StateBigFishing;
        if (this.prizeCatch) flags |= FishingFlags.StatePrizeCatch;
        if (this.patients === 1) flags |= FishingFlags.StatePatience;
        if (this.patients === 2) flags |= FishingFlags.StatePatienceII;
        if (this.identicalFish !== 0) flags |= FishingFlags.StateIdenticalFish;
        if (this.slapFish !== 0) flags |= FishingFlags.StateSurfaceSlap;
        if (this.patienceHookResult !== null) {
            flags |= FishingFlags.StateHasPatienceResult;
            if (this.patienceHookResult.isPrecision) flags |= FishingFlags.StatePatiencePrecision;
            if (this.patienceHookResult.success) flags |= FishingFlags.StatePatienceSuccess;
        }
        if (this.tugType !== null) {
            flags |= ((this.tugType + 1) << 9);
        }
        if (this.hookType !== null) {
            flags |= ((this.hookType + 1) << 11);
        }
        if (this.FailReason === FailReason.GatheringNotEnough) {
            flags |= FishingFlags.StateGatheringNotEnough;
        } else if (this.FishResult) {
            flags |= FishingFlags.StateFishGet;
        }
        if (this.lureType !== null) {
            if (this.lureType === LureType.Ambitious) {
                flags |= ((this.lureStacks & 0x7) << 16);
            } else if (this.lureType === LureType.Modest) {
                flags |= ((8 - (this.lureStacks & 0x7)) << 16);
            }
        }
        if (this.lureTarget) flags |= FishingFlags.StateLureTarget;
        if (this.hiddenFish !== 0) flags |= FishingFlags.StateLureHidden;
        if (this.hiddenStacks !== 0 && this.hiddenStacks <= 3) {
            flags |= this.hiddenStacks << 24;
        }
        return flags;
    }

    serialize(): any {
        let data = [];
        data.push(this.startTime);
        data.push(this.zone);
        data.push(this.baitId);
        data.push(this.elapsedTime);
        data.push(this.flags);

        if (this.FishResult) {
            let result = [];
            result.push(this.FishResult.itemId);
            result.push(this.FishResult.size);
            result.push(this.FishResult.isHQ);
            result.push(this.FishResult.quantity);
            data.push(result);
        } else {
            data.push(null);
        }
        data.push(this.slapFish);
        data.push(this.identicalFish);
        data.push(this.hiddenFish);
        if (this.lureAt) {
            data.push(this.lureAt - this.startTime);
        } else {
            data.push(0);
        }
        if (this.lureTimes) {
            data.push(this.lureTimes.map(t => t - this.startTime));
        } else {
            data.push(null);
        }
        data.push([ this.fisherStats.gathering, this.fisherStats.perception, this.fisherStats.gp ]);
        return data;
    }
}

export interface FishingResult {
    itemId: number;
    quantity: number;
    size: number;
    isHQ: boolean;
}

export interface FishingFail {
    reason: FailReason;
}

export interface PatienceHookResult {
    isPrecision: boolean;
    success: boolean;
}

export enum FishingFlags {
    StateChum = 1 << 0, // 撒饵
    StateFishEye = 1 << 1, // 鱼眼
    StateFisherIntuition = 1 << 2, // 鱼识
    StateBigFishing = 1 << 3, // 大鱼的知识
    StatePrizeCatch = 1 << 4, // 大鱼猎手
    StatePatience = 1 << 5, // 耐心
    StatePatienceII = 1 << 6, // 耐心II
    StateIdenticalFish = 1 << 7, // 专一垂钓
    StateSurfaceSlap = 1 << 8, // 拍击水面

    // bit 9-10
    StateTugLight = 1 << 9, // 咬钩I
    StateTugMedium = 2 << 9, // 咬钩II
    StateTugHeavy = 3 << 9, // 咬钩III
    StateTugMask = 3 << 9, // 咬钩掩码

    // bit 11-13
    StateHook = 1 << 11, // 普通提钩
    StateHookPowerful = 2 << 11, // 强力提钩
    StateHookPrecision = 3 << 11, // 精准提钩
    StateHookDouble = 4 << 11, // 双重提钩
    StateHookTriple = 5 << 11, // 三重提钩
    StateHookStellar = 6 << 11, // 华丽提钩
    StateHookMask = 7 << 11, // 提钩掩码

    // bit 14-15
    StateFishGet = 1 << 14, // 上钩
    StateGatheringNotEnough = 2 << 14, // 获得力不足

    // bit 16-18
    StateAmbitiousLure = 1 << 16, // 雄心I
    StateAmbitiousLureII = 2 << 16, // 雄心II
    StateAmbitiousLureIII = 3 << 16, // 雄心III
    StateModestLure = 7 << 16, // 谦逊I
    StateModestLureII = 6 << 16, // 谦逊II
    StateModestLureIII = 5 << 16, // 谦逊III
    StateLureMask = 7 << 16, // 雄心/谦逊掩码

    StateLureTarget = 1 << 19, // 当前可以钓到特定鱼
    StateLureHidden = 1 << 20, // 当前可以钓到隐藏鱼

    StateHasPatienceResult = 1 << 21, // 包含精准/强力提钩结果
    StatePatiencePrecision = 1 << 22, // 使用了精准提钩
    StatePatienceSuccess = 1 << 23, // 结果为成功

    // bit 24-25
    StateLureHiddenStack1 = 1 << 24, // 鱼词出现在第一次
    StateLureHiddenStack2 = 2 << 24, // 鱼词出现在第二次
    StateLureHiddenStack3 = 3 << 24, // 鱼词出现在第三次
}