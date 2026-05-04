import { createSubscriber } from 'svelte/reactivity';
import type { FisherStats } from './FishingTracker';

export class Config {
  #subscribe;
  update: (() => void) | null = null;

  /** 样式: 'default'-默认, 'minimal'-极简(渔人的直感) */
  theme: string = 'default';
  /** 是否显示历史统计 */
  showHistory: boolean = true;
  /** 是否启用数据上报(匿名上传历史统计以帮助其他捕鱼人) */
  uploadHistory: boolean = true;
  /** 是否使用在线历史数据（如果启用数据上报则默认为true） */
  useOnlineHistory: boolean = false;
  /** 是否显示钓场组件(默认样式下) */
  showZone: boolean = true;
  /** 是否显示鱼饵组件(默认样式下) */
  showBait: boolean = true;
  /** 是否显示渔获组件(默认样式下) */
  showCatch: boolean = true;
  /** 设置入口显示方式: true-显示按钮, false-双击进度条打开 */
  showSettingBtn: boolean = true;
  /** 是否合并显示撒饵和非撒饵时间 */
  mergeChumTime: boolean = true;
  /** 雄心/谦逊空窗期处理: 'off'-关闭, 'label'-显示标记, 'tweak'-调整历史显示 */
  lureEmptyWindowHandling: 'off' | 'label' | 'tweak' = 'off';

  /** 极简模式颜色: [抛竿, 轻杆, 中杆, 重杆] */
  minimalColors: string[] = [];
  /** 历史统计颜色: [轻杆, 中杆, 重杆] */
  historyColors: string[] = [];

  /** 咬钩提醒音效: 'intuition'-渔人的直感, 'pastry'-鱼捞, ''-关 */
  sound: 'intuition' | 'pastry' | '' = 'intuition';
  /** 音量大小 (0-100) */
  volume: number = 100;

  /** 三维阈值 */
  statsThresold: FisherStats = {
    gathering: 0,
    perception: 0,
    gp: 0
  };

  /**
   * 启用三维阈值提醒功能
   */
  statsThresoldEnabled: boolean = false;

  constructor() {
    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    });
    
    window.addEventListener("message", this.messageHandler.bind(this), false);

    this.load();
  }

  load() {
    const obj = JSON.parse(localStorage.getItem('config') || '{}');
    this.parseConfig(obj);
  }

  parseConfig(obj: any) {
    this.theme = obj.theme || 'default';
    this.showHistory = obj.showHistory !== undefined ? obj.showHistory : true;
    this.showZone = obj.showZone !== undefined ? obj.showZone : true;
    this.showBait = obj.showBait !== undefined ? obj.showBait : true;
    this.showCatch = obj.showCatch !== undefined ? obj.showCatch : true;
    this.showSettingBtn = obj.showSettingBtn !== undefined ? obj.showSettingBtn : true;
    this.sound = obj.sound || (obj.enableSound ? 'intuition' : '');
    this.volume = obj.volume !== undefined ? obj.volume : 100;
    this.minimalColors = obj.minimalColors || ['#eeeeee', '#69aff3', '#cc99ff', '#f1c64a'];
    this.mergeChumTime = obj.mergeChumTime !== undefined ? obj.mergeChumTime : true;
    this.lureEmptyWindowHandling = obj.lureEmptyWindowHandling || 'off';
    this.uploadHistory = obj.uploadHistory !== undefined ? obj.uploadHistory : true;
    this.historyColors = obj.historyColors || ['#4caf50', '#f44336', '#ccaf0a'];
    this.useOnlineHistory = obj.useOnlineHistory !== undefined ? obj.useOnlineHistory : true;
    this.statsThresold = obj.statsThresold || { gathering: 0, perception: 0, gp: 0 };
    this.statsThresoldEnabled = obj.statsThresoldEnabled !== undefined ? obj.statsThresoldEnabled : false;
  }

  reset() {
    this.parseConfig({});
    this.save();
  }

  messageHandler(event: MessageEvent) {
     if (event.data.type === "config-changed") {
        this.load();
        this.update?.();
      }
  }

  notifyOtherWindows() {
    const target = window.opener;
    target?.postMessage({ type: "config-changed" }, "*");
  }

  save() {
    localStorage.setItem('config', JSON.stringify(this));
    if (this.update) {
      this.update();
    }
    this.notifyOtherWindows();
  }

  /** 样式: 'default'-默认, 'minimal'-极简(渔人的直感) */
  get Theme() {
    this.#subscribe();
    return this.theme;
  }
  set Theme(value: string) {
    this.theme = value;
    this.save();
  }
  /** 是否显示历史统计 */
  get ShowHistory() {
    this.#subscribe();
    return this.showHistory;
  }
  set ShowHistory(value: boolean) {
    this.showHistory = value;
    this.save();
  }
  /** 是否显示钓场组件(默认样式下) */
  get ShowZone() {
    this.#subscribe();
    return this.showZone;
  }
  set ShowZone(value: boolean) {
    this.showZone = value;
    this.save();
  }
  /** 是否显示鱼饵组件(默认样式下) */
  get ShowBait() {
    this.#subscribe();
    return this.showBait;
  }
  set ShowBait(value: boolean) {
    this.showBait = value;
    this.save();
  }
  /** 是否显示渔获组件(默认样式下) */
  get ShowCatch() {
    this.#subscribe();
    return this.showCatch;
  }
  set ShowCatch(value: boolean) {
    this.showCatch = value;
    this.save();
  }
  /** 设置入口显示方式: true-显示按钮, false-双击进度条打开 */
  get ShowSettingBtn() {
    this.#subscribe();
    return this.showSettingBtn;
  }
  set ShowSettingBtn(value: boolean) {
    this.showSettingBtn = value;
    this.save();
  }
  /** 咬钩提醒音效: 'intuition'-渔人的直感, 'pastry'-鱼捞, ''-关 */
  get Sound() {
    this.#subscribe();
    return this.sound;
  }
  set Sound(value: 'intuition' | 'pastry' | '') {
    this.sound = value;
    this.save();
  }
  /** 音量大小 (0-100) */
  get Volume() {
    this.#subscribe();
    return this.volume;
  }
  set Volume(value: number) {
    this.volume = value;
    this.save();
  }

  /** 极简模式-抛竿颜色 */
  get IdleColor() {
    this.#subscribe();
    return this.minimalColors[0];
  }
  set IdleColor(value: string) {
    this.minimalColors[0] = value;
    this.save();
  }
  /** 极简模式-轻杆颜色 */
  get TugLightColor() {
    this.#subscribe();
    return this.minimalColors[1];
  }
  set TugLightColor(value: string) {
    this.minimalColors[1] = value;
    this.save();
  }
  /** 极简模式-中杆颜色 */
  get TugMediumColor() {
    this.#subscribe();
    return this.minimalColors[2];
  }
  set TugMediumColor(value: string) {
    this.minimalColors[2] = value;
    this.save();
  }
  /** 极简模式-重杆颜色 */
  get TugHeavyColor() {
    this.#subscribe();
    return this.minimalColors[3];
  }
  set TugHeavyColor(value: string) {
    this.minimalColors[3] = value;
    this.save();
  }

  /** 是否合并显示撒饵和非撒饵时间 */
  get MergeChumTime() {
    this.#subscribe();
    return this.mergeChumTime;
  }
  set MergeChumTime(value: boolean) {
    this.mergeChumTime = value;
    this.save();
  }

  /** 雄心/谦逊空窗期处理: 'off'-关闭, 'label'-显示标记, 'tweak'-调整历史显示 */
  get LureEmptyWindowHandling() {
    this.#subscribe();
    return this.lureEmptyWindowHandling;
  }
  set LureEmptyWindowHandling(value: 'off' | 'label' | 'tweak') {
    this.lureEmptyWindowHandling = value;
    this.save();
  }

  /** 是否启用数据上报(匿名上传历史统计以帮助其他捕鱼人) */
  get UploadHistory() {
    this.#subscribe();
    return this.uploadHistory;
  }
  set UploadHistory(value: boolean) {
    this.uploadHistory = value;
    this.save();
  }

  /** 是否使用在线历史数据（如果启用数据上报则默认为true） */
  get UseOnlineHistory() {
    this.#subscribe();
    return this.useOnlineHistory;
  }
  set UseOnlineHistory(value: boolean) {
    this.useOnlineHistory = value;
    this.save();
  }

  /** 历史统计-轻杆颜色 */
  get HistoryLightColor() {
    this.#subscribe();
    return this.historyColors[0];
  }
  set HistoryLightColor(value: string) {
    this.historyColors[0] = value;
    this.save();
  }
  /** 历史统计-中杆颜色 */
  get HistoryMediumColor() {
    this.#subscribe();
    return this.historyColors[1];
  }
  set HistoryMediumColor(value: string) {
    this.historyColors[1] = value;
    this.save();
  }
  /** 历史统计-重杆颜色 */
  get HistoryHeavyColor() {
    this.#subscribe();
    return this.historyColors[2];
  }
  set HistoryHeavyColor(value: string) {
    this.historyColors[2] = value;
    this.save();
  }

  /** 三维阈值 */
  get GatheringThresold() {
    this.#subscribe();
    return this.statsThresold.gathering;
  }
  set GatheringThresold(value: number) {
    this.statsThresold.gathering = value;
    this.save();
  }
  get PerceptionThresold() {
    this.#subscribe();
    return this.statsThresold.perception;
  }
  set PerceptionThresold(value: number) {
    this.statsThresold.perception = value;
    this.save();
  }
  
  /** 启用三维阈值提醒功能 */
  get StatsThresoldEnabled() {
    this.#subscribe();
    return this.statsThresoldEnabled;
  }
  set StatsThresoldEnabled(value: boolean) {
    this.statsThresoldEnabled = value;
    this.save();
  }
}