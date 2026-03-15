import { createSubscriber } from 'svelte/reactivity';

export class Config {
  #subscribe;
  update: (() => void) | null = null;

  theme: string = 'default';
  showHistory: boolean = true;
  uploadHistory: boolean = true;
  showZone: boolean = true;
  showBait: boolean = true;
  showCatch: boolean = true;
  showSettingBtn: boolean = true;
  mergeChumTime: boolean = true;
  lureEmptyWindowHandling: 'off' | 'label' | 'tweak' = 'off';

  minimalColors: string[] = [];
  historyColors: string[] = [];

  sound: 'intuition' | 'pastry' | '' = 'intuition';
  volume: number = 100;

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

  get Theme() {
    this.#subscribe();
    return this.theme;
  }
  set Theme(value: string) {
    this.theme = value;
    this.save();
  }
  get ShowHistory() {
    this.#subscribe();
    return this.showHistory;
  }
  set ShowHistory(value: boolean) {
    this.showHistory = value;
    this.save();
  }
  get ShowZone() {
    this.#subscribe();
    return this.showZone;
  }
  set ShowZone(value: boolean) {
    this.showZone = value;
    this.save();
  }
  get ShowBait() {
    this.#subscribe();
    return this.showBait;
  }
  set ShowBait(value: boolean) {
    this.showBait = value;
    this.save();
  }
  get ShowCatch() {
    this.#subscribe();
    return this.showCatch;
  }
  set ShowCatch(value: boolean) {
    this.showCatch = value;
    this.save();
  }
  get ShowSettingBtn() {
    this.#subscribe();
    return this.showSettingBtn;
  }
  set ShowSettingBtn(value: boolean) {
    this.showSettingBtn = value;
    this.save();
  }
  get Sound() {
    this.#subscribe();
    return this.sound;
  }
  set Sound(value: 'intuition' | 'pastry' | '') {
    this.sound = value;
    this.save();
  }
  get Volume() {
    this.#subscribe();
    return this.volume;
  }
  set Volume(value: number) {
    this.volume = value;
    this.save();
  }

  get IdleColor() {
    this.#subscribe();
    return this.minimalColors[0];
  }
  set IdleColor(value: string) {
    this.minimalColors[0] = value;
    this.save();
  }
  get TugLightColor() {
    this.#subscribe();
    return this.minimalColors[1];
  }
  set TugLightColor(value: string) {
    this.minimalColors[1] = value;
    this.save();
  }
  get TugMediumColor() {
    this.#subscribe();
    return this.minimalColors[2];
  }
  set TugMediumColor(value: string) {
    this.minimalColors[2] = value;
    this.save();
  }
  get TugHeavyColor() {
    this.#subscribe();
    return this.minimalColors[3];
  }
  set TugHeavyColor(value: string) {
    this.minimalColors[3] = value;
    this.save();
  }

  get MergeChumTime() {
    this.#subscribe();
    return this.mergeChumTime;
  }
  set MergeChumTime(value: boolean) {
    this.mergeChumTime = value;
    this.save();
  }

  get LureEmptyWindowHandling() {
    this.#subscribe();
    return this.lureEmptyWindowHandling;
  }
  set LureEmptyWindowHandling(value: 'off' | 'label' | 'tweak') {
    this.lureEmptyWindowHandling = value;
    this.save();
  }

  get UploadHistory() {
    this.#subscribe();
    return this.uploadHistory;
  }
  set UploadHistory(value: boolean) {
    this.uploadHistory = value;
    this.save();
  }

  get HistoryLightColor() {
    this.#subscribe();
    return this.historyColors[0];
  }
  set HistoryLightColor(value: string) {
    this.historyColors[0] = value;
    this.save();
  }
  get HistoryMediumColor() {
    this.#subscribe();
    return this.historyColors[1];
  }
  set HistoryMediumColor(value: string) {
    this.historyColors[1] = value;
    this.save();
  }
  get HistoryHeavyColor() {
    this.#subscribe();
    return this.historyColors[2];
  }
  set HistoryHeavyColor(value: string) {
    this.historyColors[2] = value;
    this.save();
  }
}