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

    private identicalFish: number = 0; // 专一垂钓
    private slapFish: number = 0; // 拍击水面
    private hiddenFish: number = 0; // 隐藏鱼ID

    private tugType: TugType | null = null;
    private hookType: HookType | null = null;

    private result: FishingResult | FishingFail | null = null;
    fisherStats: FisherStats;

    #subscribe;
    update: (() => void) | null = null;

    constructor(epoch: number, baitId: number, stats: FisherStats) {
        this.startTime = epoch;
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

    public tug(tugType: TugType, epoch: number): void {
        this.endTime = epoch;
        this.tugType = tugType;
        this.endLocalTime = Date.now();

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
            if (this.endTime === 0) {
                this.endTime = epoch;
                this.endLocalTime = Date.now();
            }
        }
        this.onUpdate();
    }

    set HiddenFish(fishID: number) {
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

    // 当前经过的时间
    get ElapsedTimeMs(): number {
        this.#subscribe();

        if (this.endTime) {
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
        return flags;
    }

    serialize(): any {
        let data = [];
        data.push(this.startTime);
        data.push(this.zone);
        data.push(this.baitId);
        data.push(this.endTime - this.startTime);
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

enum FishingFlags {
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

    // bit 11-13
    StateHook = 1 << 11, // 普通提钩
    StateHookPowerful = 2 << 11, // 强力提钩
    StateHookPrecision = 3 << 11, // 精准提钩
    StateHookDouble = 4 << 11, // 双重提钩
    StateHookTriple = 5 << 11, // 三重提钩
    StateHookStellar = 6 << 11, // 华丽提钩

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
}