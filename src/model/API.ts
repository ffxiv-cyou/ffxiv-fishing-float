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

  public async getProbability(spotID: number, baitID: number, opt?: {
    lure?: number,
    slap?: number,
    hidden?: boolean,
    intuition?: boolean,
  }): Promise<ConditionalProbabilityResponse> {
    let query = `spot_id=${spotID}&bait_id=${baitID}`;
    if (opt?.lure)
      query += `&lure_state=${opt.lure}`;
    if (opt?.slap !== undefined)
      query += `&slap_id=${opt.slap}`;
    if (opt?.hidden !== undefined)
      query += `&has_hidden=${opt.hidden}`;
    if (opt?.intuition !== undefined)
      query += `&has_intuition=${opt.intuition}`;

    const resp = await fetch(`${this.basePath}/fish-probability/conditional?${query}`);
    if (!resp.ok) {
      throw new Error(`Failed to get probability: ${resp.statusText}`);
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

  private setFilterParams(filter: RecordFilter, params: URLSearchParams) {
    if (filter.spot) params.set('spot', filter.spot.toString());
    if (filter.bait) params.set('bait', filter.bait.toString());
    if (filter.fish) params.set('fish', filter.fish.toString());
    if (filter.user) params.set('user', filter.user.toString());
    if (filter.from) params.set('from', filter.from.toString());
    if (filter.to) params.set('to', filter.to.toString());
    if (filter.duration_from) params.set('duration_from', filter.duration_from.toString());
    if (filter.duration_to) params.set('duration_to', filter.duration_to.toString());
    if (filter.chum !== undefined) params.set('chum', filter.chum ? "true" : "false");
    if (filter.has_intuition !== undefined) params.set('has_intuition', filter.has_intuition.toString());
    if (filter.slap_id !== undefined) params.set('slap_id', filter.slap_id.toString());
    if (filter.tug !== undefined) params.set('tug', filter.tug.toString());
  }

  public async getAdminRecords(filter: AdminRecordFilter, page: number, limit: number): Promise<AdminRecordListResponse> {
    const params = new URLSearchParams();
    params.set('_t', Date.now().toString());
    this.setFilterParams(filter, params);
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
    this.setFilterParams(filter, params);
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

  /**
   * Export fishing records as a CSV file download.
   * Requires at least one of spot, bait, or fish in the filter.
   * @param filter filters applied to the export
   */
  public async exportFishingRecords(filter: RecordFilter): Promise<void> {
    if (!filter.spot && !filter.bait && !filter.fish) {
      throw new Error('At least one of spot, bait, or fish is required');
    }
    const params = new URLSearchParams();
    this.setFilterParams(filter, params);

    const resp = await fetch(`${this.basePath}/export?${params}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!resp.ok) {
      throw new Error(`Failed to export fishing records: ${resp.statusText}`);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fishing_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  public async getSuspiciousRecords(filter: AdminSuspiciousFilter, page: number, limit: number): Promise<AdminRecordListResponse> {
    const params = new URLSearchParams();
    params.set('_t', Date.now().toString());
    this.setFilterParams(filter, params);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const resp = await fetch(`${this.basePath}/admin/records/suspicious?${params}`, {
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

  public async deleteSuspiciousRecords(ids: number[]): Promise<DeleteRecordsResponse> {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('id', id.toString()));

    const resp = await fetch(`${this.basePath}/admin/records/suspicious?${params}`, {
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

  public async dismissSuspiciousRecords(ids: number[]): Promise<DeleteRecordsResponse> {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('id', id.toString()));

    const resp = await fetch(`${this.basePath}/admin/records/suspicious/dismiss?${params}`, {
      method: 'POST',
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

  public async restoreSuspiciousRecords(ids: number[]): Promise<DeleteRecordsResponse> {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('id', id.toString()));

    const resp = await fetch(`${this.basePath}/admin/records/suspicious/restore?${params}`, {
      method: 'POST',
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

  public async getDeletedSuspiciousRecords(filter: AdminSuspiciousFilter, page: number, limit: number): Promise<AdminRecordListResponse> {
    const params = new URLSearchParams();
    params.set('_t', Date.now().toString());
    this.setFilterParams(filter, params);
    if (filter.reason !== undefined) params.set('reason', filter.reason.toString());
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const resp = await fetch(`${this.basePath}/admin/records/suspicious/deleted?${params}`, {
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

  public async banUser(id: number, removeRecord: boolean): Promise<DeleteRecordsResponse> {
    const params = new URLSearchParams();
    params.set("user_id", id.toString());
    params.set("delete_data", removeRecord.toString());

    const resp = await fetch(`${this.basePath}/admin/users/ban?${params}`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      if (resp.status === 401) {
        localStorage.removeItem('admin_token');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to ban user: ${resp.statusText}`);
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
  samples: Array<FishSampleCount>;
}

export interface FishSampleCount {
  id: number;
  count: number;
  size_min: number;
  size_max: number;
  hook_type: FishHookType;
}

export enum FishHookType {
  Unknown = 0, // 未知
  Precision = 1, // 精准
  Powerful = 2, // 强力
};

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

export interface FishLureTriggerCount {
  fish_id: number;
  bait_id: number;
  lure_type: number;
  min_lure_level: number;
  trigger_count: number;
  total_count: number;
}

export interface LureTugStatItem {
  bait_id: number;
  lure_state: number;
  tug_light: number;
  tug_medium: number;
  tug_heavy: number;
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
  lure_trigger: Array<FishLureTriggerCount>;
  lure_tug: Array<LureTugStatItem>;
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

export interface RecordFilter {
  spot?: number;
  bait?: number;
  fish?: number;
  user?: number;
  from?: number;
  to?: number;
  duration_from?: number;
  duration_to?: number;
  chum?: boolean;
  has_intuition?: boolean;
  slap_id?: number;
  tug?: number;
}

export interface AdminRecordFilter extends RecordFilter {
  dirty?: boolean;
}

export interface AdminSuspiciousFilter extends AdminRecordFilter {
  reason?: SuspiciousReason;
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
  lure_at?: number;
  lure_ats?: number[];
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

export interface ConditionalProbabilityResponse {
  spot_id: number;
  bait_id: number;
  lure_state: number;
  slap_id?: number;
  has_hidden?: boolean;
  has_intuition?: boolean;
  rates: Array<FishProbabilityItem>;
}

export enum SuspiciousReason {
  FishNotInSpot = 1, // 鱼不在钓场中
  DurationOutOfRange = 2, // 杆时太短或太长
  BiteTooFast = 3, // 咬钩时间过快
}

export enum SuspiciousSeverity {
  Suspicious = 1,
  Certain = 2,
}

export interface AdminSuspiciousRecord extends AdminFishingRecord {
  record_id: number;
  reason: SuspiciousReason;
  severity: SuspiciousSeverity;
}

export interface AdminSuspiciousListResponse {
  data: AdminSuspiciousRecord[];
  count: number;
}
