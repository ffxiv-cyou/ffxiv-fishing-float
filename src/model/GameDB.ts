import { createSubscriber } from "svelte/reactivity";

export interface PlaceTree {
  name: string;
  id: number;
  children?: PlaceTree[];
  fish?: number[];
  weathers?: WeatherRateItem[];
  wks?: WKSInfo[];
  hasIntuition?: boolean;
}

export interface WeatherRateItem {
  id: number;
  rate: number;
}

export interface ItemCount {
  item: number;
  count: number;
}

export interface WKSInfo {
  id: number;
  name: string;
  baits: ItemCount[];
}

interface PlayerSetupInfo {
  fish_offset: number;
}

export interface FishingNoteInfo {
  fishes: number[];
  spear_fishes: number[];
  spot_max_id: number;
  spear_spot_max_id: number;
}

export interface FishIntuitionInfo {
  fish_id: number;
  spot_id: number;
  fishes: ItemCount[];
}

export class GameDatabase {
  placeNames: { [key: number]: string } = {};
  itemNames: { [key: number]: string } = {};
  opcodes: { [key: string]: number } = {};
  placeTree: PlaceTree[] = [];
  weatherNames: { [key: number]: string } = {};
  fishingNoteInfo?: FishingNoteInfo;
  intuitionInfo: FishIntuitionInfo[] = [];

  versions: { [key: string]: string } = {};
  playerSetupInfo?: PlayerSetupInfo;

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

    let weathers = await fetch(`/data/${version}/weather.json`);
    this.weatherNames = await weathers.json();

    let fishingNote = await fetch(`/data/${version}/note.json`);
    this.fishingNoteInfo = await fishingNote.json();

    let intuition = await fetch(`/data/intuition.json`);
    this.intuitionInfo = await intuition.json();

    // 尝试根据内部版本号反查版本号
    let versions = await this.getVersions();
    let friendlyVersion = "";
    for (const [key, value] of Object.entries(versions)) {
      if (value === version) {
        friendlyVersion = key;
      }
    }

    // 根据大版本加载 PlayerSetup 包的信息。这个数据一般只会在大版本更新变化
    let playerSetupInfo = await this.loadPlayerSetupInfo();
    for (const [key, value] of Object.entries(playerSetupInfo)) {
      if (friendlyVersion.startsWith(key)) {
        this.playerSetupInfo = value;
        break;
      }
    }

    if (this.update) {
      this.update();
    }
  }

  async getVersions(): Promise<{ [key: string]: string }> {
    if (Object.keys(this.versions).length > 0) {
      return this.versions;
    }
    let versionsResp = await fetch(`/data/version.json`);
    this.versions = await versionsResp.json();
    return this.versions;
  }

  async loadLatest(): Promise<void> {
    let versions = await this.getVersions();
    const values = Object.values(versions);
    if (values.length > 0) {
      await this.load(values[0]);
    }
  }

  async loadPlayerSetupInfo(): Promise<{ [key: string]: PlayerSetupInfo }> {
    let resp = await fetch(`/data/player_setup.json`);
    return await resp.json();
  }

  getZoneName(zoneId: number): string {
    this.#subscribe();
    return this.placeNames[zoneId] || "未知区域(" + zoneId + ")";
  }

  getItemName(itemId: number): string {
    this.#subscribe();
    return this.itemNames[itemId] || "未知物品(" + itemId + ")";
  }

  getItemNameRaw(itemId: number): string | undefined {
    this.#subscribe();
    return this.itemNames[itemId];
  }

  getOpcodes(): { [key: string]: number } {
    this.#subscribe();
    return this.opcodes;
  }

  getPlaceTree(): PlaceTree[] {
    this.#subscribe();
    return this.placeTree;
  }

  getPlayerSetupInfo(): PlayerSetupInfo | undefined {
    this.#subscribe();
    return this.playerSetupInfo;
  }

  getFishingNoteInfo(): FishingNoteInfo | undefined {
    this.#subscribe();
    return this.fishingNoteInfo;
  }

  getPlaceTreeByID(id: number, tree: PlaceTree[] = this.placeTree): PlaceTree | null {
    this.#subscribe();
    for (const node of tree) {
      if (node.id === id && node.children === undefined) {
        return node;
      }
      if (node.children) {
        const found = this.getPlaceTreeByID(id, node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  getTerritoryByPlaceID(placeID: number): PlaceTree | null {
    this.#subscribe();
    for (const node of this.placeTree) {
      for (const child of node.children ?? []) {
        for (const spot of child.children ?? []) {
          if (spot.id === placeID) {
            return child;
          }
        }
      }
    }
    return null;
  }

  getWeatherName(weatherId: number): string {
    this.#subscribe();
    return this.weatherNames[weatherId] || "未知天气(" + weatherId + ")";
  }

  /**
   * 获取钓场的鱼识信息
   * @param spotId 钓场ID
   * @param fishes 可选的鱼过滤器
   * @returns 空数组则不知道鱼识触发信息；undefined 则没有鱼识；否则返回鱼识触发信息
   */
  getSpotIntuition(spotId: number, fishes: number[]): ItemCount[] | undefined {
    this.#subscribe();

    let candidates = this.intuitionInfo.filter((info) => info.spot_id === spotId);
    if (candidates.length === 0) {
      const placeTree = this.getPlaceTreeByID(spotId);
      if (placeTree?.hasIntuition === true) {
        return [];
      }
      return undefined;
    }
    if (candidates.length === 1 || fishes.length === 0) {
      return candidates[0].fishes;
    }

    // 如果有多个候选，尝试匹配鱼类
    for (const candidate of candidates) {
      if (fishes.findIndex((fishId) => candidate.fish_id === fishId) >= 0) {
        return candidate.fishes;
      } 
    }
    // 没有候选那没办法了……
    return undefined;
  }
}