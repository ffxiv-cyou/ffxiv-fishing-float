export enum ActorControlType {
    SetStatus = 0x02,
    /**
     * param1 = ClassJob ID
     */
    ClassJobChange = 0x05,
    StatusEffectGain = 0x14,
    StatusEffectLose = 0x15,

    DirectorInit = 0x64,
    DirectorClear = 0x65,
    DirectorUpdate = 0x6D,

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

    /**
     * param1 = fishing bait item id
     */
    WKSFishingBait = 3501,
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
    FishingIdle = 0x10F, // 271, fishing/idle

    FishingQuit = 0x111, // 273, fishing/end
    FishingCast1 = 0x112, // 274, fishing/cast_normal
    FishingCast2 = 0x113, // 275, fishing/cast_side
    FishingCast3 = 0x114, // 276, fishing/cast_fly
    FishingSustain1 = 0x115, // 277, fishing/retrieve_idle
    FishingSustain2 = 0x116, // 278, fishing/reeling_idle
    FishingSustain3 = 0x117, // 279, fishing/reeling_fast

    Fishing118 = 0x118, // 280, fishing/reeling_slow
    Fishing119 = 0x119, // 281, fishing/wobble_action
    Fishing11a = 0x11a, // 282, fishing/jerk_and_fall

    // 提钩动画？
    Fishing11b = 0x11b, // 283, fishing/cancel
    Fishing11c = 0x11c, // 284, fishing/hooking
    Fishing11d = 0x11d, // 285, fishing/short_landing_nq

    Fishing11e = 0x11e, // 286, fishing/short_landing_hq
    Fishing11f = 0x11f, // 287, fishing/normal_landing_nq
    Fishing120 = 0x120, // 288, fishing/normal_landing_hq

    Fishing121 = 0x121, // 289, fishing/long_landing_nq
    Fishing122 = 0x122, // 290, fishing/long_landing_hq
    Fishing123 = 0x123, // 291, fishing/landing_failure

    FishingTugLight = 0x124, // 292, fishing/hit_excite
    FishingTugMedium = 0x125, // 293, fishing/hit_strike
    FishingTugHeavy = 0x126, // 294, fishing/hit_bite

    FishingIdleSit = 0xC47, // 3143, fishing_chair/idle
    FishingQuitSit = 0xC48, // 3144, fishing_chair/end
    FishingCast1Sit = 0xC49, // 3145, fishing_chair/cast_normal
    FishingCast2Sit = 0xC4A, // 3146, fishing_chair/cast_side
    FishingCast3Sit = 0xC4B, // 3147, fishing_chair/cast_fly
    FishingSustain1Sit = 0xC4C, // 3148, fishing_chair/retrieve_idle
    FishingSustain2Sit = 0xC4D, // 3149, fishing_chair/reeling_idle
    FishingSustain3Sit = 0xC4E, // 3150, fishing_chair/reeling_fast

    // 提钩动画？
    FishingC52 = 0xC52, // 3154, fishing_chair/cancel
    FishingC53 = 0xC53, // 3155, fishing_chair/hooking
    FishingC54 = 0xC54, // 3156, fishing_chair/short_landing_nq

    FishingC55 = 0xC55, // 3157, fishing_chair/short_landing_hq
    FishingC56 = 0xC56, // 3158, fishing_chair/normal_landing_nq
    FishingC57 = 0xC57, // 3159, fishing_chair/normal_landing_hq

    FishingC58 = 0xC58, // 3160, fishing_chair/long_landing_nq
    FishingC59 = 0xC59, // 3161, fishing_chair/long_landing_hq
    FishingC5a = 0xC5a, // 3162, fishing_chair/landing_failure

    // 特殊提钩动画
    FishingStrongHooking = 4659, // fishing/strong_hooking
    FishingPrecisionHooking = 4660, // fishing/precision_hooking
    FishingChairStrongHooking = 4663, // fishing_chair/strong_hooking
    FishingChairStrongHookingBig = 4664, // fishing_chair/strong_hooking_big
    FishingChairPrecisionHooking = 4665, // fishing_chair/precision_hooking
    FishingChairPrecisionHookingBig = 4666, // fishing_chair/precision_hooking_big
    
    FishingStrongHookingNoVFX = 12510, // fishing/strong_hooking_novfx
    FishingPrecisionHookingNoVFX = 12511, // fishing/precision_hooking_novfx
    FishingChairStrongHookingNoVFX = 12512, // fishing_chair/strong_hooking_novfx
    FishingChairStrongHookingBigNoVFX = 12513, // fishing_chair/strong_hooking_big_novfx
    FishingChairPrecisionHookingNoVFX = 12514, // fishing_chair/precision_hooking_novfx
    FishingChairPrecisionHookingBigNoVFX = 12515, // fishing_chair/precision_hooking_big_novfx
};

export enum BuffID {
    FishersIntuition = 568, // 捕鱼人之识
    Snagging = 761, // 钓组, Action = 4100 钓组
    FishEyes = 762, // 鱼眼, Action = FishEyes
    Chum = 763, // 撒饵, Action = Chum
    InefficientHooking = 764, // 提钩成功率降低, Action = Patience,  764+850
    CatchAndRelease = 765, // 捉放, Action = PatienceII, 764+765+850
    CollectorsGlove = 805, // 收藏品采集, Action = 4101 收藏品采集
    AnglersFortune = 850, // 钓上大尺寸的鱼几率提升
    Fathom = 1166, // 鱼群测定
    TruthOfOceans = 1173, //  海洋之相
    SurfaceSlap = 1803, // 拍击水面, Action = 4595
    IdenticalCast = 1804, // 专一垂钓, Action = 4596
    AnglersArt = 2778, // 捕鱼人之计, Lose when Action = 26804 沙利亚克的恩宠
    MakeshiftBait = 2779, // 不受以小钓大发动条件限制, Action = MakeshiftBait
    PrizeCatch = 2780, // 下次必定钓到大尺寸的鱼, Action = PrizeCatch
    BigGameFishing = 3907, // 大鱼知识, Action = BigGameFishing
    AmbitiousLure = 3972, // 大型鱼类概率提升, Action = AmbitiousLure
    ModestLure = 3973, // 小型鱼类概率提升, Action = ModestLure
};