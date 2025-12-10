import { createSubscriber } from 'svelte/reactivity';

export class Config {
  #subscribe;

  theme: string;
  showHistory: boolean;
  showZone: boolean;
  showBait: boolean;
  showCatch: boolean;
  showSettingBtn: boolean;
  
  enableSound: boolean;
  update: (() => void) | null = null;

  constructor() {
    const obj = JSON.parse(localStorage.getItem('config') || '{}');
    this.theme = obj.theme || 'default';
    this.showHistory = obj.showHistory !== undefined ? obj.showHistory : true;
    this.showZone = obj.showZone !== undefined ? obj.showZone : true;
    this.showBait = obj.showBait !== undefined ? obj.showBait : true;
    this.showCatch = obj.showCatch !== undefined ? obj.showCatch : true;
    this.enableSound = obj.enableSound !== undefined ? obj.enableSound : true;
    this.showSettingBtn = obj.showSettingBtn !== undefined ? obj.showSettingBtn : true;

    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    });
  }

  save() {
    localStorage.setItem('config', JSON.stringify(this));
    if (this.update) {
      this.update();
    }
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
  get EnableSound() {
    this.#subscribe();
    return this.enableSound;
  }
  set EnableSound(value: boolean) {
    this.enableSound = value;
    this.save();
  }
}