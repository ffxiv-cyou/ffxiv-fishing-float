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

  public async getSiteStats(opt?: {
    period?: string;
    limit?: number;
    groups?: string;
  }): Promise<HomeStatsResponse> {
    let query = "";
    if (opt?.period) {
      query += `?period=${opt.period}`;
    }
    if (opt?.limit) {
      query += `${query ? "&" : "?"}limit=${opt.limit}`;
    }
    if (opt?.groups) {
      query += `${query ? "&" : "?"}groups=${opt.groups}`;
    }

    const resp = await fetch(`${this.basePath}/stats${query}`, {
      method: "GET",
    });
    if (!resp.ok) {
      throw new Error(`Failed to get site stats: ${resp.statusText}`);
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

  private getAdminHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  public async getAdminRecords(filter: AdminRecordFilter, page: number, limit: number): Promise<AdminRecordListResponse> {
    const params = new URLSearchParams();
    params.set('_t', Date.now().toString());
    if (filter.spot) params.set('spot', filter.spot.toString());
    if (filter.bait) params.set('bait', filter.bait.toString());
    if (filter.fish) params.set('fish', filter.fish.toString());
    if (filter.user) params.set('user', filter.user.toString());
    if (filter.from) params.set('from', filter.from.toString());
    if (filter.to) params.set('to', filter.to.toString());
    if (filter.dirty !== undefined) params.set('dirty', filter.dirty.toString());
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const resp = await fetch(`${this.basePath}/admin/records?${params}`, {
      method: 'GET',
      headers: this.getAdminHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      if (resp.status === 401) {
        localStorage.removeItem('admin_token');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to get admin records: ${resp.statusText}`);
    }
    return await resp.json();
  }

  public async deleteRecords(ids: number[]): Promise<DeleteRecordsResponse> {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('id', id.toString()));

    const resp = await fetch(`${this.basePath}/admin/records?${params}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      if (resp.status === 401) {
        localStorage.removeItem('admin_token');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to delete records: ${resp.statusText}`);
    }
    return await resp.json();
  }

  public async getDeletedRecords(filter: AdminRecordFilter, page: number, limit: number): Promise<AdminRecordListResponse> {
    const params = new URLSearchParams();
    params.set('_t', Date.now().toString());
    if (filter.spot) params.set('spot', filter.spot.toString());
    if (filter.bait) params.set('bait', filter.bait.toString());
    if (filter.fish) params.set('fish', filter.fish.toString());
    if (filter.user) params.set('user', filter.user.toString());
    if (filter.from) params.set('from', filter.from.toString());
    if (filter.to) params.set('to', filter.to.toString());
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const resp = await fetch(`${this.basePath}/admin/records/deleted?${params}`, {
      method: 'GET',
      headers: this.getAdminHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      if (resp.status === 401) {
        localStorage.removeItem('admin_token');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to get deleted records: ${resp.statusText}`);
    }
    return await resp.json();
  }

  public async restoreRecords(ids: number[]): Promise<RestoreRecordsResponse> {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('id', id.toString()));

    const resp = await fetch(`${this.basePath}/admin/records/restore?${params}`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      if (resp.status === 401) {
        localStorage.removeItem('admin_token');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to restore records: ${resp.statusText}`);
    }
    return await resp.json();
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

export interface FishHookoffRateItem {
  id: number;
  hookoff_rate: number;
  confidence: number;
  count: number;
  caught: number;
}

export interface ETBucket {
  bucket: number;
  count: number;
}

export interface WeatherBucket {
  prev_weather: number;
  cur_weather: number;
  count: number;
}

export interface FishCondition {
  id: number;
  weather: WeatherBucket[];
  et: ETBucket[];
  et_bucket_minutes: number;
}

export interface SpotSampleCount {
  id: number;
  count: number;
  size_min: number;
  size_max: number;
}

export interface SpotTugCount {
  tug_type: number;
  hookoff: number;
  total: number;
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
  hookoff_rates: Array<FishHookoffRateItem>;
  conditions: Array<FishCondition>;
  samples: Array<SpotSampleCount>;
  tugs: Array<SpotTugCount>;
}

export interface RecentCatchesItem {
  spot_id?: number;
  bait_id?: number;
  fish_id?: number;
  count: number;
}

export interface HomeStatsResponse {
  summary: {
    records: number;
  },
  recent_catches: {
    [key: string]: RecentCatchesItem[];
  };
}

export interface AdminRecordFilter {
  spot?: number;
  bait?: number;
  fish?: number;
  user?: number;
  from?: number;
  to?: number;
  dirty?: boolean;
}

export interface AdminFishingRecord {
  id: number;
  user_id: number;
  is_dirty: boolean;
  deleted_at?: number;
  time: number;
  spot_id: number;
  bait_id: number;
  duration: number;
  fish_id?: number;
  size?: number;
  hq?: boolean;
  quantity?: number;
  eorzea_time: number;
  weather: number;
  prev_weather: number;
  tug: number;
  chum: boolean;
  slap_id?: number;
  identical_id?: number;
  ambious_lure?: number;
  modest_lure?: number;
  flags: number;
}

export interface AdminRecordListResponse {
  data: AdminFishingRecord[];
  count: number;
}

export interface DeleteRecordsResponse {
  deleted: number;
}

export interface RestoreRecordsResponse {
  restored: number;
}
