export enum PacketType {
    PlayerSetup,
    PlayerStats,
    UpdateHpMpTp,
    ActorControl,
    ActorControlSelf,
    FishingResultMsg,
    ClientTrigger,
    EventStart,
    EventPlay,
    EventPlay4,
    EventFinish,
    SystemLogMessage,
    StatusEffectList,
    StatusEffectList3,
    GuessDoAction,
};

export class PacketSegment {
    size: number;
    sourceActor: number;
    targetActor: number;
    type: number;

    constructor(dw: DataView, offset: number = 0) {
        this.size = dw.getUint16(offset, true);
        this.sourceActor = dw.getUint32(offset + 4, true);
        this.targetActor = dw.getUint32(offset + 8, true);
        this.type = dw.getUint16(offset + 12, true);
    }

    static PacketSize() {
        return 16;
    }
}

export class IpcPacket extends PacketSegment {
    opcode: number;
    serverId: number;
    timestamp: number;

    constructor(dw: DataView, offset: number = 0) {
        super(dw, offset);

        offset += PacketSegment.PacketSize();
        this.opcode = dw.getUint16(offset + 2, true);
        this.serverId = dw.getUint32(offset + 4, true);
        this.timestamp = dw.getUint32(offset + 8, true);
    }

    static PacketSize() {
        return PacketSegment.PacketSize() + 16;
    }
}

export class FFXIVIpcPlayerSetup extends IpcPacket {
    contentId: bigint;
    charId: number;
    useBait: number;
    currentJob: number;

    // 原始数据，供后续解析使用
    data: ArrayBufferLike;

    constructor(dw: DataView, offset: number = 0) {
        super(dw, offset);
        
        offset += IpcPacket.PacketSize();
        this.contentId = dw.getBigUint64(offset + 0, true);
        this.charId = dw.getUint32(offset + 24, true);
        this.useBait = dw.getUint32(offset + 44, true);
        this.currentJob = dw.getUint8(offset + 134);

        this.data = dw.buffer.slice(dw.byteOffset + offset);
    }
}

export class FFXIVIpcPlayerStats extends IpcPacket {
  strength: number;
  dexterity: number;
  vitality: number;
  intelligence: number;
  mind: number;
  piety: number;
  hp: number;
  mp: number;
  tp: number;
  gp: number;
  cp: number;
  delay: number;
  tenacity: number;
  attackPower: number;
  defense: number;
  directHitRate: number;
  evasion: number;
  magicDefense: number;
  criticalHit: number;
  attackMagicPotency: number;
  healingMagicPotency: number;
  elementalBonus: number;
  determination: number;
  skillSpeed: number;
  spellSpeed: number;
  haste: number;
  craftsmanship: number;
  control: number;
  gathering: number;
  perception: number;
  unknown: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();

    this.strength = dw.getUint32(offset + 0, true);
    this.dexterity = dw.getUint32(offset + 4, true);
    this.vitality = dw.getUint32(offset + 8, true);
    this.intelligence = dw.getUint32(offset + 12, true);
    this.mind = dw.getUint32(offset + 16, true);
    this.piety = dw.getUint32(offset + 20, true);
    this.hp = dw.getUint32(offset + 24, true);
    this.mp = dw.getUint32(offset + 28, true);
    this.tp = dw.getUint32(offset + 32, true);
    this.gp = dw.getUint32(offset + 36, true);
    this.cp = dw.getUint32(offset + 40, true);
    this.delay = dw.getUint32(offset + 44, true);
    this.tenacity = dw.getUint32(offset + 48, true);
    this.attackPower = dw.getUint32(offset + 52, true);
    this.defense = dw.getUint32(offset + 56, true);
    this.directHitRate = dw.getUint32(offset + 60, true);
    this.evasion = dw.getUint32(offset + 64, true);
    this.magicDefense = dw.getUint32(offset + 68, true);
    this.criticalHit = dw.getUint32(offset + 72, true);
    this.attackMagicPotency = dw.getUint32(offset + 76, true);
    this.healingMagicPotency = dw.getUint32(offset + 80, true);
    this.elementalBonus = dw.getUint32(offset + 84, true);
    this.determination = dw.getUint32(offset + 88, true);
    this.skillSpeed = dw.getUint32(offset + 92, true);
    this.spellSpeed = dw.getUint32(offset + 96, true);
    this.haste = dw.getUint32(offset + 100, true);
    this.craftsmanship = dw.getUint32(offset + 104, true);
    this.control = dw.getUint32(offset + 108, true);
    this.gathering = dw.getUint32(offset + 112, true);
    this.perception = dw.getUint32(offset + 116, true);
    this.unknown = dw.getUint32(offset + 120, true);
  }
}

export class FFXIVIpcUpdateHpMpTp extends IpcPacket {
  hp: number;
  mp: number;
  tp_gp: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.hp = dw.getUint32(offset + 0, true);
    this.mp = dw.getUint16(offset + 4, true);
    this.tp_gp = dw.getUint16(offset + 6, true);
  }
}

export class FFXIVIpcActorControl extends IpcPacket {
  category: number;
  padding: number;
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  padding1: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.category = dw.getUint16(offset + 0, true);
    this.padding = dw.getUint16(offset + 2, true);
    this.param1 = dw.getUint32(offset + 4, true);
    this.param2 = dw.getUint32(offset + 8, true);
    this.param3 = dw.getUint32(offset + 12, true);
    this.param4 = dw.getUint32(offset + 16, true);
    this.padding1 = dw.getUint32(offset + 20, true);
  }
}

export class FFXIVIpcActorControlSelf extends IpcPacket {
  category: number;
  padding: number;
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  param5: number;
  param6: number;
  padding1: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.category = dw.getUint16(offset + 0, true);
    this.padding = dw.getUint16(offset + 2, true);
    this.param1 = dw.getUint32(offset + 4, true);
    this.param2 = dw.getUint32(offset + 8, true);
    this.param3 = dw.getUint32(offset + 12, true);
    this.param4 = dw.getUint32(offset + 16, true);
    this.param5 = dw.getUint32(offset + 20, true);
    this.param6 = dw.getUint32(offset + 24, true);
    this.padding1 = dw.getUint32(offset + 28, true);
  }
}

export class FFXIVIpcClientTrigger extends IpcPacket {
  commandId: number;
  unk_2: number;
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  position: FFXIVARR_POSITION3;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.commandId = dw.getUint16(offset + 0, true);
    this.unk_2 = dw.getUint8(offset + 2);
    this.param1 = dw.getUint32(offset + 4, true);
    this.param2 = dw.getUint32(offset + 8, true);
    this.param3 = dw.getUint32(offset + 12, true);
    this.param4 = dw.getUint32(offset + 16, true);
    this.position = new FFXIVARR_POSITION3(dw, offset + 20);
  }
}

export class FFXIVARR_POSITION3 {
  X: number;
  Y: number;
  Z: number;

  constructor(dw: DataView, offset: number = 0) {
    this.X = dw.getFloat32(offset + 0, true);
    this.Y = dw.getFloat32(offset + 4, true);
    this.Z = dw.getFloat32(offset + 8, true);
  }
}
export class FFXIVIpcEventStart extends IpcPacket {
  actorId: bigint;
  eventId: number;
  param1: number;
  param2: number;
  padding: number;
  param3: number;
  padding1: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.actorId = dw.getBigUint64(offset + 0, true);
    this.eventId = dw.getUint32(offset + 8, true);
    this.param1 = dw.getUint8(offset + 12);
    this.param2 = dw.getUint8(offset + 13);
    this.padding = dw.getUint16(offset + 14, true);
    this.param3 = dw.getUint32(offset + 16, true);
    this.padding1 = dw.getUint32(offset + 20, true);
  }
}

export class FFXIVIpcEventPlay extends IpcPacket {
  actorId: bigint;
  eventId: number;
  scene: number;
  padding: number;
  flags: number;
  param3: number;
  paramSize: number;
  param: number[];
  unknown: number[];

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.actorId = dw.getBigUint64(offset + 0, true);
    this.eventId = dw.getUint32(offset + 8, true);
    this.scene = dw.getUint16(offset + 12, true);
    this.padding = dw.getUint16(offset + 14, true);
    this.flags = dw.getUint32(offset + 16, true);
    this.param3 = dw.getUint32(offset + 20, true);
    this.paramSize = dw.getUint32(offset + 24, true);
    this.param = new Array(2);
    for (let i = 0; i < 2; i++) {
      this.param[i] = dw.getUint32(offset + 28 + i * 4, true);
    }
    this.unknown = new Array(4);
    for (let i = 0; i < 4; i++) {
      this.unknown[i] = dw.getUint8(offset + 36 + i * 1);
    }
  }
}

export class FFXIVIpcEventPlay4 extends IpcPacket {
  actorId: bigint;
  eventId: number;
  scene: number;
  padding: number;
  flags: number;
  param3: number;
  paramSize: number;
  param: number[];
  padding2: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.actorId = dw.getBigUint64(offset + 0, true);
    this.eventId = dw.getUint32(offset + 8, true);
    this.scene = dw.getUint16(offset + 12, true);
    this.padding = dw.getUint16(offset + 14, true);
    this.flags = dw.getUint32(offset + 16, true);
    this.param3 = dw.getUint32(offset + 20, true);
    this.paramSize = dw.getUint32(offset + 24, true);
    this.param = new Array(4);
    for (let i = 0; i < 4; i++) {
      this.param[i] = dw.getUint32(offset + 28 + i * 4, true);
    }
    this.padding2 = dw.getUint32(offset + 44, true);
  }
}

export class FFXIVIpcEventFinish extends IpcPacket {
  eventId: number;
  param1: number;
  param2: number;
  padding: number;
  param3: number;
  padding1: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.eventId = dw.getUint32(offset + 0, true);
    this.param1 = dw.getUint8(offset + 4);
    this.param2 = dw.getUint8(offset + 5);
    this.padding = dw.getUint16(offset + 6, true);
    this.param3 = dw.getUint32(offset + 8, true);
    this.padding1 = dw.getUint32(offset + 12, true);
  }
}

export class FFXIVIpcGuessTargetAction extends IpcPacket {
  actionId: number;
  unknown04: number;
  sequence: number;
  unknown08: number;
  unknown0a: number;
  unknown0c: number;
  unknown0e: number;
  targetId: number;
  padding14: number;
  param1: number;
  unknown1c: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.actionId = dw.getUint32(offset + 0, true);
    this.unknown04 = dw.getUint16(offset + 4, true);
    this.sequence = dw.getUint16(offset + 6, true);
    this.unknown08 = dw.getUint16(offset + 8, true);
    this.unknown0a = dw.getUint16(offset + 10, true);
    this.unknown0c = dw.getUint16(offset + 12, true);
    this.unknown0e = dw.getUint16(offset + 14, true);
    this.targetId = dw.getUint32(offset + 16, true);
    this.padding14 = dw.getUint32(offset + 20, true);
    this.param1 = dw.getUint32(offset + 24, true);
    this.unknown1c = dw.getUint32(offset + 28, true);
  }
}

export class FFXIVIpcSystemLogMessage extends IpcPacket {
  eventId: number;
  messageId: number;
  paramSize: number;
  param1: number;
  param2: number;
  padding: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.eventId = dw.getUint32(offset + 0, true);
    this.messageId = dw.getUint32(offset + 4, true);
    this.paramSize = dw.getUint32(offset + 8, true);
    this.param1 = dw.getUint32(offset + 12, true);
    this.param2 = dw.getUint32(offset + 16, true);
    this.padding = dw.getUint32(offset + 20, true);
  }
}

export class FFXIVIpcStatusEffectList extends IpcPacket {
  classId: number;
  level1: number;
  level: number;
  current_hp: number;
  max_hp: number;
  current_mp: number;
  max_mp: number;
  shieldPercentage: number;
  unknown1: number;
  unknown2: number;
  effect: StatusEffect[];
  padding: number;

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.classId = dw.getUint8(offset + 0);
    this.level1 = dw.getUint8(offset + 1);
    this.level = dw.getUint16(offset + 2, true);
    this.current_hp = dw.getUint32(offset + 4, true);
    this.max_hp = dw.getUint32(offset + 8, true);
    this.current_mp = dw.getUint16(offset + 12, true);
    this.max_mp = dw.getUint16(offset + 14, true);
    this.shieldPercentage = dw.getUint8(offset + 16);
    this.unknown1 = dw.getUint8(offset + 17);
    this.unknown2 = dw.getUint16(offset + 18, true);
    this.effect = new Array(30);
    for (let i = 0; i < 30; i++) {
      this.effect[i] = new StatusEffect(dw, offset + 20 + i * 12);
    }
    this.padding = dw.getUint32(offset + 380, true);
  }
}

export class StatusEffect {
  effect_id: number;
  param: number;
  duration: number;
  sourceActorId: number;

  constructor(dw: DataView, offset: number = 0) {
    this.effect_id = dw.getUint16(offset + 0, true);
    this.param = dw.getUint16(offset + 2, true);
    this.duration = dw.getFloat32(offset + 4, true);
    this.sourceActorId = dw.getUint32(offset + 8, true);
  }
}

export class FFXIVIpcStatusEffectList2 extends IpcPacket {
  unknown3: number;
  classId: number;
  level1: number;
  level2: number;
  level3: number;
  current_hp: number;
  max_hp: number;
  current_mp: number;
  max_mp: number;
  shieldPercentage: number;
  unknown1: number;
  unknown2: number;
  effect: StatusEffect[];

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.unknown3 = dw.getUint32(offset + 0, true);
    this.classId = dw.getUint8(offset + 4);
    this.level1 = dw.getUint8(offset + 5);
    this.level2 = dw.getUint8(offset + 6);
    this.level3 = dw.getUint8(offset + 7);
    this.current_hp = dw.getUint32(offset + 8, true);
    this.max_hp = dw.getUint32(offset + 12, true);
    this.current_mp = dw.getUint16(offset + 16, true);
    this.max_mp = dw.getUint16(offset + 18, true);
    this.shieldPercentage = dw.getUint8(offset + 20);
    this.unknown1 = dw.getUint8(offset + 21);
    this.unknown2 = dw.getUint16(offset + 22, true);
    this.effect = new Array(30);
    for (let i = 0; i < 30; i++) {
      this.effect[i] = new StatusEffect(dw, offset + 24 + i * 12);
    }
  }
}

export class FFXIVIpcStatusEffectList3 extends IpcPacket {
  effect: StatusEffect[];

  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.effect = new Array(30);
    for (let i = 0; i < 30; i++) {
      this.effect[i] = new StatusEffect(dw, offset + 0 + i * 12);
    }
  }
}

export class FFXIVIpcFishingResultMsg extends IpcPacket {
  itemId: number;
  size: number;
  quantity: number;
  padding1: number;
  unk1: number;
  flags2: number;
  constructor(dw: DataView, offset: number = 0) {
    super(dw, offset);
    offset += IpcPacket.PacketSize();
    this.itemId = dw.getUint32(offset + 0, true);
    this.size = dw.getUint16(offset + 4, true);
    this.quantity = dw.getUint16(offset + 6, true);
    this.padding1 = dw.getUint16(offset + 8, true);
    this.unk1 = dw.getUint16(offset + 10, true);
    this.flags2 = dw.getUint32(offset + 12, true);
  }
}
