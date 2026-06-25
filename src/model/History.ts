import { encode } from "cbor2";
import * as Sentry from "@sentry/svelte";
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
  lastSessionLocalTime: number = 0;
  lastSessionStartTime: number = 0;

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

  public addSession(session: FishingSession | undefined | null): void {
    if (!session)
      return;

    // deduplication, avoid adding the same session multiple times
    if (this.lastSessionLocalTime === session.startLocalTime) {
      return;
    }
    if (session.startTime !== 0 && this.lastSessionStartTime === session.startTime) {
      return;
    }
    this.lastSessionLocalTime = session.startLocalTime;
    this.lastSessionStartTime = session.startTime;

    // don't record sessions shorter than 1s (e.g. invalid cast rejected by game)
    if (session.elapsedTime > 0 && session.elapsedTime < 1000) {
      return;
    }

    if (session.isIncomplete) {
      Sentry.captureMessage("incomplete fishing data", {
        level: "warning",
        extra: session.diagnosticSnapshot,
        fingerprint: session.incompleteReason,
      });
    }

    this.pendingSessions.push(session);
    this.triggerUpload();

    if (session.TugType != null) {
      this.storage.updateHistory(session);
    }
  }

  //#region Local History Management
  public async getHistory(zone: number, bait: number, chum?: boolean): Promise<HistoryStatsItem[]> {
    return this.storage.getHistory(zone, bait, chum);
  }
  //#endregion

  //#region Data Upload
  nextUpload: number | null = null;
  retryCount: number = 0;
  private triggerUpload(): void {
    if (!this.cfg.UploadHistory || this.pendingSessions.length === 0 || this.nextUpload !== null) {
      return;
    }

    // 一分钟上报一次，避免频繁请求
    this.nextUpload = setTimeout(() => this.uploadPendingSessions(), 60 * 1000);
  }

  uploadPendingSessions(): void {
    const sessionsToUpload = this.pendingSessions;
    if (sessionsToUpload.length === 0) {
      return;
    }

    const data = sessionsToUpload.map((s) => s.serialize());
    const body = encode(data);

    this.api.uploadFishingData(body).then((resp) => {
      if (!resp.ok) {
        console.error("Failed to upload fishing data, server responded with status", resp.status);
        this.retryCount++;
        this.nextUpload = setTimeout(() => this.uploadPendingSessions(), Math.min(10 * 60 * 1000, this.retryCount * 30000));
        return;
      }

      this.pendingSessions.splice(0, sessionsToUpload.length);
      this.nextUpload = null;
      this.retryCount = 0;
    }).catch((err) => {
      console.error("Failed to upload fishing data:", err);
      this.retryCount++;
      this.nextUpload = setTimeout(() => this.uploadPendingSessions(), Math.min(10 * 60 * 1000, this.retryCount * 30000));
    });
  }
  //#endregion
}
