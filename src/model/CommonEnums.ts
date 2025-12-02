export enum ActorControlType {
    SetStatus = 0x02,
    /**
     * param1 = ClassJob ID
     */
    ClassJobChange = 0x05,
    StatusEffectGain = 0x14,
    StatusEffectLose = 0x15,

    FishingMsg = 0x140,

    FishingTotalFishCaught = 0x142,
    FishingBaitMsg = 0x145,

    FishingReachMsg = 0x147,
    FishingFailMsg = 0x148,

    /**
     * param1 = current using swimbait index. 0xffff means none.
     * param2 = swimbait 1 item ID
     * param3 = swimbait 2 item ID
     * param4 = swimbait 3 item ID
     */
    FishingSwimbait = 0x152,

    LogMsg = 0x205,
};

export enum ClassJobID {
    Fisher = 18,
};

export enum EventID {
    Fishing = 0x150001, // 1376257, Fishing
};

export enum ClientTriggerType {
    Fishing = 0x2BD, // 701, Fishing
};

export enum FishingActionType {
    Cast = 0, // 抛竿
    Quit = 1, // 中断
    Hook = 2, // 提钩
    Mooch = 3, // 以小钓大
    Bait = 4, // 选饵, param2 = bait item id
    Sit = 5, // 坐下，/sit
    CastLight = 6, // 垂钓之光
    Release = 7, // 放生
    // 8 = ?
    Chum = 9, // 撒饵
    PowerfulHookset = 10, // 强力提钩
    PreciseHookset = 11, // 精准提钩
    FishEyes = 12, // 鱼眼
    Patience = 13, // 耐心
    PatienceII = 14, // 耐心2
    MoochII = 15, // 以小钓大2
    DoubleHook = 16, // 双重提钩
    ReleaseList = 17, // 打开放生列表
    ReleaseListApply = 18, // 应用放生列表，param2 = bitmask of selected fish, sequence in nq, hq
    MakeshiftBait = 19, // 熟练鱼技
    PrizeCatch = 20, // 大鱼猎手
    TripleHook = 21, // 三重提钩
    AmbitiousLure = 22, // 雄心之饵
    ModestLure = 23, // 谦逊之饵
    SparefulHand = 24, // 熟练妙招
    SelectSwimBait = 25, // 选择了游动饵
    BigGameFishing = 26, // 大鱼的知识
    Rest = 27, // 歇杆
    StellarHookset = 28, // 华丽提钩, used in cosmic exploration
};

export enum EventPlayParamType {
    // Idle
    FishingIdle = 0x10F, // 271

    FishingQuit = 0x111, // 273
    FishingCast1 = 0x112, // 274
    FishingCast2 = 0x113, // 275
    FishingCast3 = 0x114, // 276
    FishingSustain1 = 0x115, // 277 
    FishingSustain2 = 0x116, // 278
    FishingSustain3 = 0x117, // 279

    Fishing118 = 0x118, // 280
    Fishing119 = 0x119, // 281
    Fishing11a = 0x11a, // 282

    // 提钩动画？
    Fishing11b = 0x11b, // 283，脱钩？
    Fishing11c = 0x11c, // 284
    Fishing11d = 0x11d, // 285

    Fishing11e = 0x11e, // 286
    Fishing11f = 0x11f, // 287
    Fishing120 = 0x120, // 288

    Fishing121 = 0x121, // 289
    Fishing122 = 0x122, // 290
    Fishing123 = 0x123, // 291

    FishingTugLight = 0x124, // 292
    FishingTugMedium = 0x125, // 293
    FishingTugHeavy = 0x126, // 294

    FishingIdleSit = 0xC47, // 3143
    FishingQuitSit = 0xC48, // 3144
    FishingCast1Sit = 0xC49, // 3145
    FishingCast2Sit = 0xC4A, // 3146
    FishingCast3Sit = 0xC4B, // 3147
    FishingSustain1Sit = 0xC4C, // 3148
    FishingSustain2Sit = 0xC4D, // 3149
    FishingSustain3Sit = 0xC4E, // 3150

    // 提钩动画？
    FishingC52 = 0xC52, // 3154, 脱钩？
    FishingC53 = 0xC53, // 3155
    FishingC54 = 0xC54, // 3156

    FishingC55 = 0xC55, // 3157
    FishingC56 = 0xC56, // 3158
    FishingC57 = 0xC57, // 3159

    FishingC58 = 0xC58, // 3160
    FishingC59 = 0xC59, // 3161
    FishingC5a = 0xC5a, // 3162
};