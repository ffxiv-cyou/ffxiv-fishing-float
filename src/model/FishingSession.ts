import { type TugType, type HookType, FailReason, LureType } from "./InnerEnums";

export class FishingSession {
    startTime: number = 0;
    endTime: number = 0;
    startLocalTime: Date;
    endLocalTime: Date | null = null;

    baitId: number;
    zone: number = 0;

    chum: boolean = false; // 撒饵
    fishEyes: boolean = false; // 鱼眼
    fishersIntuition: boolean = false; // 捕鱼人之识
    collections: boolean = false; // 收藏品
    bigGameFishing: boolean = false; // 大鱼猎手
    prizeCatch: boolean = false; // 大鱼知识
    patients: number = 0; // 耐心层数

    lureType: LureType | null = null; // 雄心/谦逊
    lureTarget: boolean = false; // 是否为目标
    lureStacks: number = 0; // 层数
    lureAt: number = 0; // 最后一次的时间

    identicalFish: number = 0; // 专一垂钓
    slapFish: number = 0; // 拍击水面
    hiddenFish: number = 0; // 隐藏鱼ID

    tugType: TugType | null = null;
    hookType: HookType | null = null;

    result: FishingResult | FishingFail | null = null;

    constructor(epoch: number, baitId: number) {
        this.startTime = epoch;
        this.baitId = baitId;
        this.startLocalTime = new Date();
    }

    public serverCast(epoch: number): void {
        this.startTime = epoch;
        this.startLocalTime = new Date();
    }

    public tug(tugType: TugType, epoch: number): void {
        this.endTime = epoch;
        this.tugType = tugType;
        this.endLocalTime = new Date();
    }

    public hook(hookType: HookType): void {
        this.hookType = hookType;
    }

    public setResult(itemId: number, quantity: number, size: number, isHQ: boolean, isColl: boolean): void {
        this.result = { itemId, quantity, size, isHQ };
    }

    public setFail(reason: FailReason): void {
        this.result = { reason };
    }

    public setHiddenFish(fishID: number): void {
        this.hiddenFish = fishID;
    }

    public setLure(type: LureType, stacks: number, epoch: number): void {
        this.lureType = type;
        this.lureStacks = stacks;
        this.lureAt = epoch;
    }

    public setLureTarget(isTarget: boolean): void {
        this.lureTarget = isTarget;
    }

    // 当前经过的时间
    get elapsedTimeMs(): number {
        if (this.endTime) {
            return this.endTime - this.startTime;
        }

        const now = Date.now();
        return now - this.startLocalTime.getTime();
    }

    // 谦逊/雄心的保护时间窗
    get lureRestMs(): number {
        if (this.lureAt === 0)
            return 0;

        return this.lureAt - this.startTime + 3500;
    }

    get failReason(): FailReason | null {
        if (this.result && 'reason' in this.result)
            return this.result.reason;
        return null;
    }

    get fishResult(): FishingResult | null {
        if (this.result && 'itemId' in this.result)
            return this.result;
        return null;
    }

    get resultID(): number | undefined {
        if (this.fishResult)
            return this.fishResult.itemId;
        return undefined;
    }

    get flags(): FishingFlags {
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
        if (this.failReason === FailReason.GatheringNotEnough) {
            flags |= FishingFlags.StateGatheringNotEnough;
        } else if (this.fishResult) {
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

        if (this.fishResult) {
            let result = [];
            result.push(this.fishResult.itemId);
            result.push(this.fishResult.size);
            result.push(this.fishResult.isHQ);
            result.push(this.fishResult.quantity);
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