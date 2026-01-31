import { createSubscriber } from "svelte/reactivity";

export interface PlaceTree {
  name: string;
  id: number;
  children: PlaceTree[];
}

export class GameDatabase {
  placeNames: { [key: number]: string } = {};
  itemNames: { [key: number]: string } = {};
  opcodes: { [key: string]: number } = {};
  placeTree: PlaceTree[] = [];

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

    let placetree = await fetch(`/data/${version}/placetree.json`);
    this.placeTree = await placetree.json();

    if (this.update) {
      this.update();
    }
  }

  async getVersions(): Promise<{ [key: string]: string }> {
    let versionsResp = await fetch(`/data/version.json`);
    return await versionsResp.json();
  }

  async loadLatest(): Promise<void> {
    let versions = await this.getVersions();
    const values = Object.values(versions);
    if (values.length > 0) {
      await this.load(values[0]);
    }
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

  getPlaceTree(): PlaceTree[] {
    this.#subscribe();
    return this.placeTree;
  }
}