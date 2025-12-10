import type { Packet, PacketFilter } from "overlay-toolkit-lib";
import { FFXIVIpcActorControl, FFXIVIpcActorControlSelf, FFXIVIpcClientTrigger, FFXIVIpcEventFinish, FFXIVIpcEventPlay, FFXIVIpcEventPlay4, FFXIVIpcEventStart, FFXIVIpcGuessTargetAction, FFXIVIpcPlayerSetup, FFXIVIpcPlayerStats, FFXIVIpcStatusEffectList, FFXIVIpcStatusEffectList2, FFXIVIpcStatusEffectList3, FFXIVIpcSystemLogMessage, FFXIVIpcUpdateHpMpTp, PacketSegment, PacketType, StatusEffect } from "./Opcode";
import { ActorControlType, ClientTriggerType, EventID, EventPlayParamType, FishingActionType } from "./CommonEnums";
import { FailReason, HookType, LureType, TugType } from "./InnerEnums";
import { FishingTracker } from "./FishingTracker";

interface OpcodeMap {
    [key: string]: number;
}

const Direction = {
    [PacketType.PlayerSetup]: false,
    [PacketType.PlayerStats]: false,
    [PacketType.UpdateHpMpTp]: false,
    [PacketType.ActorControl]: false,
    [PacketType.ActorControlSelf]: false,
    [PacketType.ClientTrigger]: true,
    [PacketType.EventStart]: false,
    [PacketType.EventPlay]: false,
    [PacketType.EventPlay4]: false,
    [PacketType.EventFinish]: false,
    [PacketType.GuessDoAction]: true,
    [PacketType.SystemLogMessage]: false,
    [PacketType.StatusEffectList]: false,
    [PacketType.StatusEffectList3]: false,
}

export interface IPacketSource {
    SubscribePacket(name: string, filters: PacketFilter[], handler: (packet: Packet) => void): Promise<string>;
}

export class PacketHandler {
    public tracker: FishingTracker;

    constructor(tracker: FishingTracker) {
        this.tracker = tracker;
    }

    opcodeMap: Map<number, PacketType> = new Map<number, PacketType>();

    public init(source: IPacketSource): void {
        source.SubscribePacket("FishingFloat", this.genPacketFilter(), (packet: Packet) => this.packetHandler(packet));
    }

    //#region Opcode Management

    genPacketFilter(): PacketFilter[] {
        const filters: PacketFilter[] = [];
        this.opcodeMap.forEach((value, key) => {
            filters.push({
                opcode: key,
                direction: Direction[value],
            });
        });
        return filters;
    }

    public setOpcode(opcodeMap: OpcodeMap): void {
        this.opcodeMap.clear();

        Object.keys(PacketType).forEach((key) => {
            if (!isNaN(Number(key)))
                return;
            const value = PacketType[key as keyof typeof PacketType];
            this.opcodeMap.set(opcodeMap[key], value);
        });
    }

    //#endregion

    //#region Packet Handling
    private packetHandler(packet: Packet): void {
        const pktType = this.opcodeMap.get(packet.opcode);
        if (pktType === undefined) {
            console.warn(`Unknown opcode: ${packet.opcode}`);
            return;
        }

        if (Direction[pktType] !== packet.dir) {
            console.warn("Opcode direction mismatch: ", packet.opcode, "expected", Direction[pktType], "got", packet.dir);
            return;
        }

        const dw = new DataView(packet.data.buffer, packet.data.byteOffset, packet.data.byteLength);

        if (!PacketHandler.isSourceEqualsTarget(dw)) {
            return;
        }

        switch (pktType) {
            case PacketType.PlayerSetup:
                this.handlePlayerSetup(dw, packet.epoch);
                break;
            case PacketType.PlayerStats:
                this.handlePlayerStats(dw, packet.epoch);
                break;
            case PacketType.UpdateHpMpTp:
                this.handleUpdateHpMpTp(dw, packet.epoch);
                break;
            case PacketType.ActorControl:
                this.handleActorControl(dw, packet.epoch);
                break;
            case PacketType.ActorControlSelf:
                this.handleActorControlSelf(dw, packet.epoch);
                break;
            case PacketType.ClientTrigger:
                this.handleClientTrigger(dw, packet.epoch);
                break;
            case PacketType.EventStart:
                this.handleEventStart(dw, packet.epoch);
                break;
            case PacketType.EventPlay:
                this.handleEventPlay(dw, packet.epoch);
                break;
            case PacketType.EventPlay4:
                this.handleEventPlay4(dw, packet.epoch);
                break;
            case PacketType.EventFinish:
                this.handleEventFinish(dw, packet.epoch);
                break;
            case PacketType.GuessDoAction:
                this.handleGuessDoAction(dw, packet.epoch);
                break;
            case PacketType.SystemLogMessage:
                this.handleSystemLogMessage(dw, packet.epoch);
                break;
            case PacketType.StatusEffectList:
                this.handleStatusEffectList(dw, packet.epoch);
                break;
            case PacketType.StatusEffectList3:
                this.handleStatusEffectList3(dw, packet.epoch);
                break;
            default:
                console.warn(`Unhandled packet type: ${pktType}`);
        }
    }

    static isSourceEqualsTarget(dw: DataView): boolean {
        const seg = new PacketSegment(dw);
        return seg.sourceActor === seg.targetActor;
    }

    private handlePlayerSetup(dw: DataView, epoch: number): void {
        const playerSetup = new FFXIVIpcPlayerSetup(dw);
        this.tracker.setBait(playerSetup.useBait);
        this.tracker.changeJob(playerSetup.currentJob);
    }

    private handlePlayerStats(dw: DataView, epoch: number): void {
        const playerStats = new FFXIVIpcPlayerStats(dw);
        this.tracker.setPlayerStats(playerStats.gathering, playerStats.perception, playerStats.gp);
    }

    private handleUpdateHpMpTp(dw: DataView, epoch: number): void {
        const hpMpTp = new FFXIVIpcUpdateHpMpTp(dw);
        this.tracker.setCurrentGP(hpMpTp.tp_gp);
    }

    private handleActorControl(dw: DataView, epoch: number): void {
        const actorControl = new FFXIVIpcActorControl(dw);
        switch (actorControl.category) {
            case ActorControlType.StatusEffectGain:
                this.tracker.addBuff(actorControl.param1, actorControl.param2, epoch);
                break;
            case ActorControlType.StatusEffectLose:
                this.tracker.removeBuff(actorControl.param1, actorControl.param2, epoch);
                break;
            case ActorControlType.ClassJobChange:
                this.tracker.changeJob(actorControl.param1);
                break;
            default:
                break;
        }
    }

    private handleActorControlSelf(dw: DataView, epoch: number): void {
        const actorControlSelf = new FFXIVIpcActorControlSelf(dw);
        switch (actorControlSelf.category) {
            case ActorControlType.FishingBaitMsg:
                this.tracker.setBait(actorControlSelf.param1);
                break;
            case ActorControlType.FishingMsg:
                const itemId = actorControlSelf.param1;
                const quantity = actorControlSelf.param2 & 0xFFFF;
                const size = (actorControlSelf.param2 >> 16) & 0xFFFF;
                const isHQ = (actorControlSelf.param3 & 0x10) > 0;
                this.tracker.setFishingResult(itemId, quantity, size, isHQ, epoch);
                break;
            case ActorControlType.FishingTotalFishCaught:
                this.tracker.setFishingCaughtTotal(actorControlSelf.param1, epoch);
                break;
            case ActorControlType.FishingSwimbait:
                this.handleSwimbaitMsg(actorControlSelf, epoch);
                break;
            case ActorControlType.LogMsg:
                this.handleLogMessage(actorControlSelf.param1, [actorControlSelf.param2, actorControlSelf.param3, actorControlSelf.param4], epoch);
                break;
            default:
                break;
        }
    }

    private handleSwimbaitMsg(data: FFXIVIpcActorControlSelf, epoch: number): void {
        const currentIndex = data.param1;
        const swimbaitIds = [
            data.param2,
            data.param3,
            data.param4,
        ];
        if (currentIndex === 0xffff) {
            this.tracker.setUsingSwimbait(0);
        } else {
            const selectedSwimbaitId = swimbaitIds[currentIndex];
            this.tracker.setUsingSwimbait(selectedSwimbaitId);
        }
    }

    private handleClientTrigger(dw: DataView, epoch: number): void {
        const clientTrigger = new FFXIVIpcClientTrigger(dw);
        switch (clientTrigger.commandId) {
            case ClientTriggerType.Fishing:
                this.handleClientTriggerFishing(clientTrigger, epoch);
                break;
            default:
                break;
        }
    }

    private handleClientTriggerFishing(data: FFXIVIpcClientTrigger, epoch: number): void {
        const command: FishingActionType = data.param1;
        switch (command) {
            case FishingActionType.Bait:
                this.tracker.setBait(data.param2);
                break;
            // Casts
            case FishingActionType.Cast:
                this.tracker.cast(epoch);
                break;
            case FishingActionType.Mooch:
            case FishingActionType.MoochII:
                this.tracker.cast(epoch, this.tracker.lastCaught);
                break;
            // Hooks
            case FishingActionType.Hook:
                this.tracker.hook(HookType.Normal, epoch);
                break;
            case FishingActionType.PowerfulHookset:
                this.tracker.hook(HookType.Powerful, epoch);
                break;
            case FishingActionType.PreciseHookset:
                this.tracker.hook(HookType.Precise, epoch);
                break;
            case FishingActionType.DoubleHook:
                this.tracker.hook(HookType.Double, epoch);
                break;
            case FishingActionType.TripleHook:
                this.tracker.hook(HookType.Triple, epoch);
                break;
            case FishingActionType.StellarHookset:
                this.tracker.hook(HookType.Stellar, epoch);
                break;
            // Lures
            case FishingActionType.AmbitiousLure:
            case FishingActionType.ModestLure:
                this.tracker.resetLure(epoch);
                break;
            // Other action is ignored
            default:
                console.log("Ignore fishing command", FishingActionType[command], data);
                break;
        }
    }

    private handleEventStart(dw: DataView, epoch: number): void {
        const eventStart = new FFXIVIpcEventStart(dw);
        if (eventStart.eventId === EventID.Fishing) {
            this.tracker.setFishingEvent(true, epoch);
        }
    }
    private handleEventPlay(dw: DataView, epoch: number): void {
        const eventPlay = new FFXIVIpcEventPlay(dw);
        if (eventPlay.eventId !== EventID.Fishing) {
            return;
        }

        this.handleFishEventPlay(eventPlay.scene, eventPlay.param.slice(0, eventPlay.paramSize), epoch);
    }
    private handleEventPlay4(dw: DataView, epoch: number): void {
        const eventPlay4 = new FFXIVIpcEventPlay4(dw);
        if (eventPlay4.eventId !== EventID.Fishing) {
            return;
        }

        this.handleFishEventPlay(eventPlay4.scene, eventPlay4.param.slice(0, eventPlay4.paramSize), epoch);
    }
    private handleEventFinish(dw: DataView, epoch: number): void {
        const eventFinish = new FFXIVIpcEventFinish(dw);
        if (eventFinish.eventId === EventID.Fishing) {
            this.tracker.setFishingEvent(false, epoch);
        }
    }

    private handleFishEventPlay(scene: number, args: number[], epoch: number): void {
        if (args.length > 0) {
            switch (args[0]) {
                case EventPlayParamType.FishingIdle:
                case EventPlayParamType.FishingIdleSit:
                    this.tracker.resetCastState(epoch);
                    break;
                case EventPlayParamType.FishingTugLight:
                    this.tracker.tug(TugType.Light, epoch);
                    break;
                case EventPlayParamType.FishingTugMedium:
                    this.tracker.tug(TugType.Medium, epoch);
                    break;
                case EventPlayParamType.FishingTugHeavy:
                    this.tracker.tug(TugType.Heavy, epoch);
                    break;
            }
        }
    }

    private handleGuessDoAction(dw: DataView, epoch: number): void {
        const guessTargetAction = new FFXIVIpcGuessTargetAction(dw);
        console.log("Guess Target Action Packet:", guessTargetAction);
    }
    private handleSystemLogMessage(dw: DataView, epoch: number): void {
        const log = new FFXIVIpcSystemLogMessage(dw);
        this.handleLogMessage(log.messageId, [log.param1, log.param2].slice(0, log.paramSize), epoch);
    }

    private handleLogMessage(id: number, params: number[], epoch: number): void {
        switch (id) {
            case 1110: // ???在???甩出了鱼线开始钓鱼
                this.tracker.setFishingZone(params[0]);
                this.tracker.serverBegin(epoch);
                break;
            case 1111: // ???收回了鱼线。
            case 1112: // 陷入了无法战斗状态，钓鱼中断。
            case 1113: // 受到了敌人的攻击，钓鱼中断。
            case 1117: // 不经意间鱼饵被吃掉了……
            case 1118: // 不经意间???不见了……
            case 1127: // 没有钓到任何东西……\n现在使用的鱼饵可能不太适合这片钓场。
            case 1129: // 没有钓到任何东西……
                this.tracker.resetCastState(epoch); // 状态中断，或者是没钓起来东西
                break;

            case 1119: // 上钩的鱼逃走了……
            case 1120: // 鱼线断了！
                this.tracker.setFishingFail(FailReason.None, epoch);
                break;

            case 3527: // 获得力不足，无法钓起上钩的鱼。
                this.tracker.setFishingFail(FailReason.GatheringNotEnough, epoch);
                break;

            case 1121: // ???开始利用上钩的???尝试以小钓大。
                const fishID3 = params[0];
                break;

            case 3522: // 将???挂到了钓钩上。 (set swimbait)
            case 5558: // 将钓饵换成了??? (switch swimbait back)
                break;

            case 5505: // 发现了很多的???！
                this.tracker.setIdenticalFishID(params[0]);
                break;

            case 5506: // ???开始警惕，消失了踪迹……
                this.tracker.setSlapFishID(params[0]);
                break;

            case 5564: // 鱼眼提示词（水中出现了XXXX）
                this.tracker.setHiddenFish(params[0], epoch);
                break;
            case 5575: // 鱼眼消失（XXXX不见了）
            case 5582: // 钓起了XXXX（鱼眼）
                this.tracker.setHiddenFish(0, epoch);
                break;

            case 5565: // 现在感觉能钓到大型猎物！！！
                this.tracker.setLure(LureType.Ambitious, epoch);
                break;
            case 5569: // 现在感觉能钓到小型猎物！！！
                this.tracker.setLure(LureType.Modest, epoch);
                break;
        }
        console.log("Log Message Packet:", id);
    }

    private handleStatusEffectList(dw: DataView, epoch: number): void {
        const statusEffectList = new FFXIVIpcStatusEffectList(dw);
        this.handleBuffList(statusEffectList.effect, epoch);
    }

    private handleStatusEffectList3(dw: DataView, epoch: number): void {
        const statusEffectList = new FFXIVIpcStatusEffectList3(dw);
        this.handleBuffList(statusEffectList.effect, epoch);
    }

    private handleBuffList(list: StatusEffect[], epoch: number): void {
        // 处理buff列表
        this.tracker.setBuffList(list.map(e => {
            return {
                buffId: e.effect_id,
                stacks: e.param,
                duration: e.duration,
                toString(): string {
                    return `Buff ${this.buffId} (x${this.stacks}, ${this.duration.toFixed(1)}s)`;
                }
            }
        }), epoch);
    }
    //#endregion
}

