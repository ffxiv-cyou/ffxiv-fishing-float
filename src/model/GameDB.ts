import { createSubscriber } from "svelte/reactivity";

export class GameDatabase {
  placeNames: { [key: number]: string } = {};
  itemNames: { [key: number]: string } = {};
  opcodes: { [key: string]: number } = {};

  update: (() => void) | null = null;
  #subscribe;

  constructor() {
    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    });
  }

  async load(version: string): Promise<void> {
    let placnames = await fetch(`/data/${version}/placename.json`);
    this.placeNames = await placnames.json();

    let items = await fetch(`/data/${version}/item.json`);
    this.itemNames = await items.json();

    let opcodes = await fetch(`/data/${version}/opcode.json`);
    this.opcodes = await opcodes.json();

    if (this.update) {
      this.update();
    }
  }

  async getVersions(): Promise<{ [key: string]: string }> {
    let versionsResp = await fetch(`/data/version.json`);
    return await versionsResp.json();
  }

  getZoneName(zoneId: number): string {
    this.#subscribe();
    return this.placeNames[zoneId] || "未知区域(" + zoneId + ")";
  }

  getItemName(itemId: number): string {
    this.#subscribe();
    return this.itemNames[itemId] || "未知物品(" + itemId + ")";
  }

  getOpcodes(): { [key: string]: number } {
    this.#subscribe();
    return this.opcodes;
  }
}