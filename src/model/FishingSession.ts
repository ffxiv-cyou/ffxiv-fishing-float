import type { LureType, TugType, HookType, FailReason } from "./InnerEnums";
import placename from "../lib/placename.json";
import items from "../lib/item.json";

export class FishingSession {
    startTime: number = 0;
    endTime: number = 0;
    startLocalTime: Date = new Date();

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
    slapFish: number = 0; // 拍击睡眠
    hiddenFish: number = 0; // 

    tugType: TugType | null = null;
    hookType: HookType | null = null;

    result: FishingResult | FishingFail | null = null;

    constructor(epoch: number, baitId: number) {
        this.startTime = epoch;
        this.baitId = baitId;
    }

    public tug(tugType: TugType, epoch: number): void {
        this.endTime = epoch;
        this.tugType = tugType;
    }

    public hook(hookType: HookType): void {
        this.hookType = hookType;
    }

    public setResult(itemId: number, quantity: number, size: number, isHQ: boolean): void {
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
    get durationMs(): number {
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

    get zoneName(): string {
        const placeNameLib: { [key: number]: string } = placename;
        return placeNameLib[this.zone] || "Unknown Zone";
    }

    get baitName(): string {
        const itemLib: { [key: number]: string } = items;
        return itemLib[this.baitId];
    }

    get itemName(): string {
        const itemLib: { [key: number]: string } = items;
        if (this.result && 'itemId' in this.result)
            return itemLib[this.result.itemId];
        return "";
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
