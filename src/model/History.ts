import { encode } from "cbor2";
import type { API } from "./API";
import type { FishingSession } from "./FishingSession";
import { createSubscriber } from "svelte/reactivity";
import type { Config } from "./Config";
import { FishingStorage, type HistoryStatsItem } from "./HistoryStorage";

export class FishingHistory {
  api: API;
  pendingSessions: FishingSession[] = [];
  storage: FishingStorage
  cfg: Config;

  #subscribe;
  update: (() => void) | null = null;

  constructor(api: API, config: Config) {
    this.api = api;
    this.cfg = config;

    this.#subscribe = createSubscriber((update) => {
      this.update = update;
    })

    this.storage = new FishingStorage();
  }

  public addSession(session: FishingSession): void {
    if (!session || session.TugType == null)
      return;

    this.pendingSessions.push(session);
    this.triggerUpload();

    this.storage.updateHistory(session);
  }

  //#region Local History Management
  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    return this.storage.getHistory(zone, bait, chum);
  }
  //#endregion

  //#region Data Upload
  nextUpload: number | null = null;
  private triggerUpload(): void {
    if (!this.cfg.UploadHistory || this.pendingSessions.length === 0 || this.nextUpload !== null) {
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
