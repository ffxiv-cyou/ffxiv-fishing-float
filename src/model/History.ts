import { encode } from "cbor2";
import type { API } from "./API";
import type { FishingSession } from "./FishingSession";
import { TugType } from "./InnerEnums";
import { createSubscriber } from "svelte/reactivity";

export interface HistoryStatsItem {
  zone: number;
  bait: number;
  fish: number;
  chum: boolean;

  tugType: TugType;
  minBiteTime: number;
  maxBiteTime: number;

  count: number;
}

export class FishingHistory {
  api: API;
  pendingSessions: FishingSession[] = [];
  histories: HistoryStatsItem[] = [];

  #subscribe;
  update: (() => void) | null = null;

  constructor(api: API) {
    this.api = api;

    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    })

    var text = localStorage.getItem("fishingHistory");
    if (text) {
      try {
        this.histories = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse fishing history from localStorage:", e);
      }
    }
  }

  public addSession(session: FishingSession): void {
    if (!session)
      return;

    this.pendingSessions.push(session);
    this.triggerUpload();

    this.updateHistory(session);
  }

  //#region Local History Management
  private updateHistory(session: FishingSession): void {
    if (session.resultID === undefined) {
      return;
    }

    if (session.elapsedTimeMs < session.lureRestMs) {
      return;
    }

    const biteTime = session.elapsedTimeMs / 1000;
    var item = this.histories.find((h) => h.zone === session.Zone && h.bait === session.baitId && h.fish === session.resultID && h.chum === session.chum);
    if (item === undefined) {
      item = {
        zone: session.Zone,
        bait: session.baitId,
        fish: session.resultID,
        chum: session.chum,

        tugType: session.tugType || TugType.Light,
        minBiteTime: biteTime,
        maxBiteTime: biteTime,
        count: 1,
      };
      this.histories.push(item);
    } else {
      if (biteTime < item.minBiteTime) {
        item.minBiteTime = biteTime;
      }
      if (biteTime > item.maxBiteTime) {
        item.maxBiteTime = biteTime;
      }
      item.count += 1;
    }
    console.log("Updated history:", item);
    localStorage.setItem("fishingHistory", JSON.stringify(this.histories));
    this.update?.();
  }

  public getHistory(zone: number, bait: number, chum: boolean): HistoryStatsItem[] {
    this.#subscribe();
    return this.histories.filter((h) => h.zone === zone && h.bait === bait && h.chum === chum);
  }
  //#endregion

  //#region Data Upload
  nextUpload: number | null = null;
  private triggerUpload(): void {
    if (this.pendingSessions.length === 0 || this.nextUpload !== null) {
      return;
    }

    // 一分钟上报一次，避免频繁请求
    this.nextUpload = setTimeout(() => this.uploadPendingSessions(), 60 * 1000);
  }

  private uploadPendingSessions(): void {
    const sessionsToUpload = this.pendingSessions;

    const data = sessionsToUpload.map((s) => s.serialize());
    const body = encode(data);

    this.api.uploadFishingData(body).then(() => {
      this.pendingSessions.splice(0, sessionsToUpload.length);
      this.nextUpload = null;
    }).catch((err) => {
      console.error("Failed to upload fishing data:", err);
      this.nextUpload = null;
    });
  }
  //#endregion
}

const demoData = [
  {
    zone: 105,
    fish: 4932,
    bait: 2588,
    minBiteTime: 8.9,
    maxBiteTime: 13.6,
    tugType: TugType.Medium,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 8.4,
    maxBiteTime: 17.4,
    fish: 4942,
    bait: 2592,
    tugType: TugType.Medium,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 11.4,
    maxBiteTime: 18.2,
    fish: 4945,
    bait: 2592,
    tugType: TugType.Medium,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 10.3,
    maxBiteTime: 16.7,
    fish: 4951,
    bait: 2594,
    tugType: TugType.Light,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 12.2,
    maxBiteTime: 19.3,
    fish: 4963,
    bait: 4927,
    tugType: TugType.Light,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 16.5,
    maxBiteTime: 20.9,
    fish: 4968,
    bait: 2595,
    tugType: TugType.Light,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 14,
    maxBiteTime: 21.6,
    fish: 4973,
    bait: 2597,
    tugType: TugType.Light,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 15.3,
    maxBiteTime: 25.6,
    fish: 4975,
    bait: 4942,
    tugType: TugType.Light,
    chum: false,
  },
  {
    zone: 105,
    minBiteTime: 19.3,
    maxBiteTime: 31.4,
    fish: 7923,
    bait: 4942,
    tugType: TugType.Heavy,
    chum: false,
  },
];