import overlayToolkit, { PlayerStats } from "overlay-toolkit-lib";
import type { Packet, PacketFilter } from "overlay-toolkit-lib";
import { FFXIVIpcActorControl, FFXIVIpcActorControlSelf, FFXIVIpcClientTrigger, FFXIVIpcEventFinish, FFXIVIpcEventPlay, FFXIVIpcEventPlay4, FFXIVIpcEventStart, FFXIVIpcGuessTargetAction, FFXIVIpcPlayerSetup, FFXIVIpcPlayerStats, FFXIVIpcSystemLogMessage, FFXIVIpcUpdateHpMpTp, PacketSegment, PacketType } from "./Opcode";
import { ActorControlType, ClassJobID, ClientTriggerType, EventID, EventPlayParamType, FishingActionType } from "./CommonEnums";
import { HookType, TugType } from "./InnerEnums";

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
}

export class FishingFloat {
    constructor() {
    }

    opcodeMap: Map<number, PacketType> = new Map<number, PacketType>();

    public init(): void {
        overlayToolkit.Start();
        overlayToolkit.SubscribePacket("FishingFloat", this.genPacketFilter(), (packet: Packet) => this.packetHandler(packet));
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

        if (!FishingFloat.isSourceEqualsTarget(dw)) {
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
        this.setBait(playerSetup.useBait);
    }

    private handlePlayerStats(dw: DataView, epoch: number): void {
        const playerStats = new FFXIVIpcPlayerStats(dw);
        this.setPlayerStats(playerStats.gathering, playerStats.perception, playerStats.gp);
    }

    private handleUpdateHpMpTp(dw: DataView, epoch: number): void {
        const hpMpTp = new FFXIVIpcUpdateHpMpTp(dw);
        this.setCurrentGP(hpMpTp.tp_gp);
    }

    private handleActorControl(dw: DataView, epoch: number): void {
        const actorControl = new FFXIVIpcActorControl(dw);
        switch (actorControl.category) {
            case ActorControlType.StatusEffectGain:
                this.addBuff(actorControl.param1, epoch);
                break;
            case ActorControlType.StatusEffectLose:
                this.removeBuff(actorControl.param1, epoch);
                break;
            case ActorControlType.ClassJobChange:
                this.changeJob(actorControl.param1);
                break;
            default:
                console.log("Actor Control Packet:", actorControl);
                break;
        }
    }

    private handleActorControlSelf(dw: DataView, epoch: number): void {
        const actorControlSelf = new FFXIVIpcActorControlSelf(dw);
        switch (actorControlSelf.category) {
            case ActorControlType.FishingBaitMsg:
                this.setBait(actorControlSelf.param1);
                break;
            case ActorControlType.FishingMsg:
                const itemId = actorControlSelf.param1;
                const quantity = actorControlSelf.param2 & 0xFFFF;
                const size = (actorControlSelf.param2 >> 16) & 0xFFFF;
                const isHQ = (actorControlSelf.param3 & 0x10) > 0;
                this.setFishingResult(itemId, quantity, size, isHQ, epoch);
                break;
            case ActorControlType.FishingTotalFishCaught:
                this.setFishingCaughtTotal(actorControlSelf.param1, epoch);
                break;
            case ActorControlType.FishingSwimbait:
                this.handleSwimbaitMsg(actorControlSelf, epoch);
                break;
            case ActorControlType.LogMsg:
                this.handleLogMessage(actorControlSelf.param1, [actorControlSelf.param2, actorControlSelf.param3, actorControlSelf.param4], epoch);
                break;
            default:
                console.log("Actor Control Self Packet:", actorControlSelf);
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
            this.setUsingSwimbait(0);
        } else {
            const selectedSwimbaitId = swimbaitIds[currentIndex];
            this.setUsingSwimbait(selectedSwimbaitId);
        }
    }

    private handleClientTrigger(dw: DataView, epoch: number): void {
        const clientTrigger = new FFXIVIpcClientTrigger(dw);
        switch (clientTrigger.commandId) {
            case ClientTriggerType.Fishing:
                this.handleClientTriggerFishing(clientTrigger, epoch);
                break;
            default:
                console.log("Client Trigger Packet:", clientTrigger);
                break;
        }
    }

    private handleClientTriggerFishing(data: FFXIVIpcClientTrigger, epoch: number): void {
        const command: FishingActionType = data.param1;
        switch (command) {
            case FishingActionType.Bait:
                this.setBait(data.param2);
                break;
            // Casts
            case FishingActionType.Cast:
                this.cast(epoch);
                break;
            case FishingActionType.Mooch:
            case FishingActionType.MoochII:
                const lastFishId = this.getLastCaughtFish();
                this.cast(epoch, lastFishId);
                break;
            // Hooks
            case FishingActionType.Hook:
                this.hook(HookType.Normal, epoch);
                break;
            case FishingActionType.PowerfulHookset:
                this.hook(HookType.Powerful, epoch);
                break;
            case FishingActionType.PreciseHookset:
                this.hook(HookType.Precise, epoch);
                break;
            case FishingActionType.DoubleHook:
                this.hook(HookType.Double, epoch);
                break;
            case FishingActionType.TripleHook:
                this.hook(HookType.Triple, epoch);
                break;
            case FishingActionType.StellarHookset:
                this.hook(HookType.Stellar, epoch);
                break;
            // Other action is ignored
            default:
                console.log("Fishing Client Trigger Packet:", data);
                break;
        }
    }

    private handleEventStart(dw: DataView, epoch: number): void {
        const eventStart = new FFXIVIpcEventStart(dw);
        if (eventStart.eventId === EventID.Fishing) {
            this.setFishingEvent(true, epoch);
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
            this.setFishingEvent(false, epoch);
        }
    }

    private handleFishEventPlay(scene: number, args: number[], epoch: number): void {
        if (args.length > 0) {
            switch (args[0]) {
                case EventPlayParamType.FishingIdle:
                    this.resetCastState(epoch);
                    break;
                case EventPlayParamType.FishingTugLight:
                    this.tug(TugType.Light, epoch);
                    break;
                case EventPlayParamType.FishingTugMedium:
                    this.tug(TugType.Medium, epoch);
                    break;
                case EventPlayParamType.FishingTugHeavy:
                    this.tug(TugType.Heavy, epoch);
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
            case 1111: // ???收回了鱼线。
            case 1112: // 陷入了无法战斗状态，钓鱼中断。
            case 1113: // 受到了敌人的攻击，钓鱼中断。
            case 1117: // 不经意间鱼饵被吃掉了……
            case 1118: // 不经意间???不见了……
                this.resetCastState(epoch);
                break;

            case 1119: // 上钩的鱼逃走了……
            case 1120: // 鱼线断了！
                break;

            case 1121: // ???开始利用上钩的???尝试以小钓大。
                break;

            case 1127: // 没有钓到任何东西……\n现在使用的鱼饵可能不太适合这片钓场。
            case 1129: // 没有钓到任何东西……
                break;

            case 3522: // 将???挂到了钓钩上。
            case 3527: // 获得力不足，无法钓起上钩的鱼。
                break;

            case 5505: // 发现了很多的???！
                const fishId2 = params[0];
                break;
            case 5506: // ???开始警惕，消失了踪迹……
                const fishId = params[0];
                break;

            case 5564: // 鱼眼提示词（水中出现了XXXX）
            case 5575: // 鱼眼消失（XXXX不见了）
            case 5582: // 钓起了XXXX（鱼眼）
                const fishIndex = params[0];
                break;
                
            case 5565: // 现在感觉能钓到大型猎物！！！
            case 5569: // 现在感觉能钓到小型猎物！！！
                break;
        }
        console.log("Log Message Packet:", id);
    }

    //#endregion
    private setCurrentGP(gp: number) {
        console.log(`Current GP set to: ${gp}`);
    }

    private setPlayerStats(gathering: number, perception: number, gp: number) {
        console.log(`Player Stats - Gathering: ${gathering}, Perception: ${perception}, GP: ${gp}`);
    }

    private setBait(baitId: number) {
        console.log(`Bait ID set to: ${baitId}`);
    }

    private setUsingSwimbait(baitId: number) {
        console.log(`Bait Override ID set to: ${baitId}`);
    }

    private changeJob(classJobId: number) {
        if (classJobId === ClassJobID.Fisher) {
            console.log("Player is now a Fisher.");
        } else {
            console.log(`Player changed to a different job: ${classJobId}`);
        }
    }

    private setFishingEvent(isFishing: boolean, epoch: number) {
        console.log(`Fishing event set to: ${isFishing}`);
    }

    private addBuff(buffId: number, epoch: number) {
        console.log(`Buff added: ${buffId}`);
    }
    private removeBuff(buffId: number, epoch: number) {
        console.log(`Buff removed: ${buffId}`);
    }
    private setBuffList(buffList: number[], epoch: number) {
        console.log(`Buff list updated: ${buffList.join(", ")}`);
    }

    private setFishingResult(itemId: number, quantity: number, size: number, isHQ: boolean, epoch: number) {
        console.log(`Fishing Result - Item ID: ${itemId}, Quantity: ${quantity}, Size: ${size}, HQ: ${isHQ}`);
    }

    private setFishingCaughtTotal(total: number, epoch: number) {

    }

    private getLastCaughtFish(): number {
        // todo: 
        return 0;
    }

    private cast(epoch: number, bait: number = 0): void {
        console.log("Casting with bait:", bait);
    }

    private hook(type: HookType, epoch: number): void {

    }

    private tug(type: TugType, epoch: number): void {
        console.log("Tug detected of type:", TugType[type]);
    }

    private resetCastState(epoch: number): void {
        console.log("Resetting cast state.");
    }
}