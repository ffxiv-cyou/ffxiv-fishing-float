export class API {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  public async uploadFishingData(data: Uint8Array): Promise<Response> {
    const headers = this.generateHeader(data);
    const resp = await fetch(`${this.basePath}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        ...headers,
      },
      body: data as any,
      credentials: "include",
    });
    this.handleResponseHeader(resp.headers);
    return resp;
  }

  /**
   * Get fishing duration distribution for a specific fishing spot
   * @param spotID spot ID, required
   * @param opt optional parameters for filtering the results
   * @returns fishing duration distribution
   */
  public async getFishingDuration(spotID: number, opt?: {
    baitID?: number;
    fishID?: number;
    isChum?: boolean;
    minCount?: number;
  }): Promise<FishDurationResponse> {
    let query = `?spot_id=${spotID}`;
    if (opt?.baitID) {
      query += `&bait_id=${opt.baitID}`;
    }
    if (opt?.fishID) {
      query += `&fish_id=${opt.fishID}`;
    }
    if (opt?.isChum !== undefined) {
      query += `&is_chum=${opt.isChum}`;
    }
    if (opt?.minCount !== undefined) {
      query += `&min_count=${opt.minCount}`;
    }

    const resp = await fetch(`${this.basePath}/fish-duration${query}`, {
      method: "GET",
      credentials: "include",
    });
    if (!resp.ok) {
      throw new Error(`Failed to get fishing duration: ${resp.statusText}`);
    }
    return await resp.json();
  }
  
  /**
   * Get fishing duration distribution for a specific fishing spot
   * @param spotID spot ID, required
   * @param opt optional parameters for filtering the results
   * @returns fishing duration distribution
   */
  public async getSpotStats(spotID: number, opt?: {
    baitID?: number;
    fishID?: number;
    isChum?: boolean;
    minCount?: number;
  }): Promise<SpotStatsResponse> {
    let query = `?spot_id=${spotID}`;
    if (opt?.baitID) {
      query += `&bait_id=${opt.baitID}`;
    }
    if (opt?.fishID) {
      query += `&fish_id=${opt.fishID}`;
    }
    if (opt?.isChum !== undefined) {
      query += `&is_chum=${opt.isChum}`;
    }
    if (opt?.minCount !== undefined) {
      query += `&min_count=${opt.minCount}`;
    }

    const resp = await fetch(`${this.basePath}/spot/stats${query}`, {
      method: "GET",
      credentials: "include",
    });
    if (!resp.ok) {
      throw new Error(`Failed to get spot info: ${resp.statusText}`);
    }
    return await resp.json();
  }

  generateHeader(data: Uint8Array): { [key: string]: string } {
    var now = Date.now();
    return {
      "X-Client-Timestamp": now.toString(),
    };
  }

  handleResponseHeader(headers: Headers): void {
    const serverTimestamp = headers.get("X-Server-Timestamp");
    if (serverTimestamp) {
      const serverTime = parseInt(serverTimestamp, 10);
      const localTime = Date.now();
      const timeDiff = serverTime - localTime;
      // todo: timestamp calibration
      console.log(`Time difference between server and client: ${timeDiff} ms`);
    }
  }
}

export interface FishDurationResponse {
  spot_id: number;
  updated_at: number;
  total: number;
  filtered: number;
  distributions: Array<FishDurationDistribution>;
  merged: Array<FishDurationDistribution>;
}

export interface FishDurationDistribution {
  bait_id: number;
  fish_id: number;
  is_chum: boolean;
  tug_type: number;
  count: number;
  outlier: number;
  range: {
    min: number;
    max: number;
    effective_min: number;
    effective_max: number;
  };
  percentiles: {
    p1: number;
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }
}

export interface DurationBucket {
  bait_id: number;
  fish_id: number;
  is_chum: boolean;
  tug_type: number;
  buckets: Array<number>;
  start_ms: number;
  size_ms: number;
}

export interface FishProbabilityItem {
  id: number;
  bait: number;
  tug: number;
  rate: number;
  count: number;
  is_hidden: boolean;
}

export interface SpotStatsResponse {
  spot_id: number;
  updated_at: number;
  duration: {
    distributions: Array<FishDurationDistribution>;
    merged: Array<FishDurationDistribution>;
    buckets: Array<DurationBucket>;
    total: number;
    filtered: number;
  };
  probability: {
    rates: Array<FishProbabilityItem>;
  };
}