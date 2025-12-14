import { API } from "./API";
import { ClassJobID, BuffID } from "./CommonEnums";
import { Config } from "./Config";
import { FishingSession } from "./FishingSession";
import { GameDatabase } from "./GameDB";
import { FishingHistory } from "./History";
import { LureType, FailReason, HookType, TugType } from "./InnerEnums";

export class FishingTracker extends EventTarget {
    private bait: number = 0;
    private swimBait: number = 0;
    private lastFish: number = 0;
    private fisherStats: FisherStats = {
        gathering: 0,
        perception: 0,
        gp: 0,
    };
    private currentZone: number = 0;

    private current: FishingSession | null = null;
    
    history: FishingHistory;
    api: API;
    config: Config;
    db: GameDatabase;

    constructor() {
        super();

        var origin = document?.location?.origin;
        var basePath = origin + "/api";

        this.api = new API(basePath);
        this.history = new FishingHistory(this.api);
        this.config = new Config();
        this.db = new GameDatabase();
    }

    public loadGameData(version: string): Promise<void> {
        return this.db.load(version);
    }

    public getVersions(): Promise<{[key: string]: string}> {
        return this.db.getVersions();
    }

    get CurrentSession(): FishingSession | null {
        return this.current;
    }

    get currentBait(): number {
        if (this.swimBait)
            return this.swimBait;
        return this.bait;
    }

    get lastCaught(): number {
        return this.lastFish;
    }

    public setCurrentGP(gp: number) {
        this.fisherStats.gp = gp;
    }

    public setPlayerStats(gathering: number, perception: number, gp: number) {
        this.fisherStats = { gathering, perception, gp };
    }

    public setFishingZone(zoneId: number) {
        // Zone extract from log message, may late than cast action
        this.currentZone = zoneId;
        if (this.current) {
            this.current.zone = zoneId;
        }
    }

    public serverBegin(epoch: number) {
        this.current?.serverCast(epoch);
    }

    public setBait(baitId: number) {
        this.bait = baitId;
    }

    public setUsingSwimbait(baitId: number) {
        this.swimBait = baitId;
        console.log(`Bait Override ID set to: ${baitId}`);
    }

    public changeJob(classJobId: number) {
        if (classJobId === ClassJobID.Fisher) {
            console.log("Player is now a Fisher.");
        } else {
            this.stopRecording();
            console.log(`Player changed to a different job: ${classJobId}`);
        }
    }

    public setFishingEvent(isFishing: boolean, epoch: number) {
        console.log(`Fishing event set to: ${isFishing}`);
        if (isFishing) {
            this.dispatchEvent(new Event("start"));
        } else {
            this.dispatchEvent(new Event("stop"));
        }
        if (!isFishing) {
            this.stopRecording();
        }
    }

    buffs: Map<number, BuffState> = new Map<number, BuffState>();

    public addBuff(buffId: number, stacks: number, epoch: number) {
        // addBuff 和 removeBuff 可能有些buff会不存在，以SetBuffList为准
        // console.log(`Buff added: ${buffId}`);
    }
    public removeBuff(buffId: number, stacks: number, epoch: number) {
        // console.log(`Buff removed: ${buffId}`);
    }
    public setBuffList(buffList: BuffState[], epoch: number) {
        // 过滤掉不相关的buff
        var filterBuff = Object.keys(BuffID);
        const filterBuffList = buffList.filter(b => filterBuff.includes(BuffID[b.buffId]));

        // 对比当前buff列表，找出新增和移除的buff
        var gainedBuffs: BuffState[] = [];
        var lostBuffs: BuffState[] = [];

        for (let buff of filterBuffList) {
            if (!this.buffs.has(buff.buffId)) {
                gainedBuffs.push(buff);
            }
            const old = this.buffs.get(buff.buffId);
            if (old) {
                if (old.stacks < buff.stacks) {
                    gainedBuffs.push(buff);
                }
                if (old.stacks > buff.stacks) {
                    lostBuffs.push(buff);
                }
            }
            this.buffs.set(buff.buffId, buff);
        }

        for (let [buffId, oldBuff] of this.buffs) {
            if (!filterBuffList.find(b => b.buffId === buffId)) {
                lostBuffs.push(oldBuff);
                this.buffs.delete(buffId);
            }
        }

        for (let buff of gainedBuffs) {
            this.onBuffGain(buff, epoch);
        }
        for (let buff of lostBuffs) {
            this.onBuffLose(buff, epoch);
        }
    }

    onBuffGain(buff: BuffState, epoch: number) {
        console.log(`Buff gained: ${buff} (${BuffID[buff.buffId]})`);
        switch (buff.buffId) {
            case BuffID.AmbitiousLure:
                this.current?.setLure(LureType.Ambitious, buff.stacks, epoch);
                break;
            case BuffID.ModestLure:
                this.current?.setLure(LureType.Modest, buff.stacks, epoch);
                break;
        }
    }
    onBuffLose(buff: BuffState, epoch: number) {
        console.log(`Buff lose: ${buff} (${BuffID[buff.buffId]})`);
        switch (buff.buffId) {
            case BuffID.IdenticalCast:
                this.setIdenticalFishID(0);
                break;
            case BuffID.SurfaceSlap:
                this.setSlapFishID(0);
                break;
        }
    }

    syncBuffState(session: FishingSession) {
        if (this.buffs.has(BuffID.AnglersFortune)) {
            if (this.buffs.has(BuffID.CatchAndRelease)) {
                session.patients = 2;
            } else {
                session.patients = 1;
            }
        }
        session.chum = this.buffs.has(BuffID.Chum);
        session.fishEyes = this.buffs.has(BuffID.FishEyes);
        session.fishersIntuition = this.buffs.has(BuffID.FishersIntuition);
        session.collections = this.buffs.has(BuffID.CollectorsGlove);
        session.bigGameFishing = this.buffs.has(BuffID.BigGameFishing);
        session.prizeCatch = this.buffs.has(BuffID.PrizeCatch);
    }

    private stopRecording() {
    }

    public setFishingResult(itemId: number, quantity: number, size: number, isHQ: boolean, isColl: boolean, epoch: number) {
        this.current?.setResult(itemId, quantity, size, isHQ, isColl);
        console.log(`Caught`, this.current);
        this.lastFish = itemId;
        this.history.addSession(this.current!);
        this.dispatchEvent(new Event("end"));
    }

    public setFishingFail(reason: FailReason, epoch: number) {
        this.current?.setFail(reason);
        this.dispatchEvent(new Event("end"));
    }

    public setFishingCaughtTotal(total: number, epoch: number) {
    }

    public cast(epoch: number, bait: number = 0): void {
        console.log("Casting with bait:", bait, this.currentBait);
        if (bait === 0)
            bait = this.currentBait;

        this.current = new FishingSession(epoch, bait);
        this.current.zone = this.currentZone;

        if (this.nextIdenticalFish) {
            this.current.identicalFish = this.nextIdenticalFish;
        } else if (this.nextSlapFish) {
            this.current.slapFish = this.nextSlapFish;
        }

        this.syncBuffState(this.current);
        this.dispatchEvent(new Event("begin"));
    }

    public hook(type: HookType, epoch: number): void {
        this.current?.hook(type);
    }

    public tug(type: TugType, epoch: number): void {
        this.current?.tug(type, epoch);
        this.dispatchEvent(new CustomEvent<TugType>("tug", { detail: type }));
    }

    public resetCastState(epoch: number): void {
        console.log("Resetting cast state.");
        this.current = null;
    }

    private nextIdenticalFish: number = 0;
    private nextSlapFish: number = 0;

    public setIdenticalFishID(fishID: number): void {
        this.nextIdenticalFish = fishID;
    }

    public setSlapFishID(fishID: number): void {
        this.nextSlapFish = fishID;
    }

    public setLure(type: LureType, epoch: number): void {
        this.current?.setLureTarget(true);
    }

    public resetLure(epoch: number): void {
        this.current?.setLureTarget(false);
    }

    public setHiddenFish(fishID: number, epoch: number): void {
        console.log("Hidden fish detected:", fishID);
        this.current?.setHiddenFish(fishID);
    }
}

export interface FisherStats {
    gathering: number;
    perception: number;
    gp: number;
}

export interface BuffState {
    buffId: number;
    stacks: number;
    duration: number;
}

