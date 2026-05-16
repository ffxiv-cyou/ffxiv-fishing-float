# 当前使用的数据包列表

## PlayerSetup

用于获取初始鱼饵，以及钓鱼笔记。

## PlayerStats

获取获得、鉴别、采集力

## UpdateHpMpTp

获取当前采集力

## ActorControl

### StatusEffectGain, StatusEffectLose

附加/丢失 Buff 后会触发。

由于有的 Buff 不会触发这个消息，使用后面的 StatusEffectList 替代。

### ClassJobChange

处理切换职业

## ActorControlSelf

很多类型的信息

### FishingBaitMsg

用户手动切换鱼饵

### FishingMsg

捕鱼结果。

在7.5版本后使用 FishingResult 代替

### FishingTotalFishCaught

更新总捕鱼数量。

未使用。

### WKSFishingBait

宇宙探索接受任务时，会下发这个数据包，指示当前使用的鱼饵。

接受相同任务时，不会重复下发此数据包。

### FishingSwimbait

更新当前游动饵状态，设置对应游动饵信息

### LogMsg

一些原始日志信息，参见后续 SystemLogMessage

### DirectorInit, DirectorUpdate, DirectorClear

获取出海垂钓的副本时间，用于计算幻海流时长。

## FishingResult

当前钓鱼结果。

卡收藏品时，这个消息会等到确定后才下发。

```text
00 ItemID   int32 物品ID
04 Size     int16 大小
06 Quantity int8  数量
07 flags1   int8  是否为收藏品
08 Unk1     int16
0a Unk2     int16
0c flags2   int32 未知 (0x10 是 HQ)
```

## ClientTrigger

用户动作

### Fishing

使用了哪些钓鱼技能。

详细技能列表请参考 FishingActionType

## EventStart, EventFinish

服务器下发的角色状态。

用于判断是否处于钓鱼状态

## EventPlay, EventPlay4

服务器下发的角色动画状态。

用于判断咬钩类型。

## StatusEffectList, StatusEffectList3

角色当前 Buff 列表。

用于判断鱼识、诱饵技能状态等会出现 Buff 的状态。

## GuessDoAction

可能是对目标使用技能。暂时未使用。

使用 拍击水面, 专一垂钓，打捞，收藏品，沙利亚克的恩宠，钓组 等技能会触发。

## WeatherChange

判断幻海流的进入
