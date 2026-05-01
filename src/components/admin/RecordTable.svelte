<script lang="ts">
  import type {
    AdminFishingRecord,
    AdminRecordFilter,
    AdminRecordListResponse,
  } from "@/model/API";
  import type { FishingTracker } from "@/model/FishingTracker";
  import { FishingFlags } from "@/model/FishingSession";
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Badge,
    Checkbox,
    Label,
    Input,
    Button,
    PaginationNav,
    P,
  } from "flowbite-svelte";
  import SpotSelector from "@/components/admin/SpotSelect.svelte";
  import ChevronLeftOutline from "../icon/ChevronLeftOutline.svelte";
  import ChevronRightOutline from "../icon/ChevronRightOutline.svelte";
  import { type Snippet } from "svelte";
  import TableSkeleton from "./TableSkeleton.svelte";

  let {
    selectedIds,
    showDeleted = false,
    onToggleSelect,
    onToggleSelectAll,
    onLoad,
    bottomNav,
    operation,
    tracker,
  }: {
    selectedIds: number[];
    showDeleted?: boolean;
    onToggleSelect: (id: number) => void;
    onToggleSelectAll: (id: number[]) => void;
    onLoad: (
      filter: AdminRecordFilter,
      page: number,
      pageSize: number,
    ) => Promise<AdminRecordListResponse>;
    tracker: FishingTracker;
    bottomNav?: Snippet<[{}]>;
    operation: Snippet<[AdminFishingRecord]>;
  } = $props();

  let response: AdminRecordListResponse | null = $state(null);
  let currentPage = $state(0);

  const limit = 20;
  let totalCount = $derived.by(() => response?.count ?? 0);
  let totalPages = $derived(Math.ceil(totalCount / limit));

  let records = $derived.by(() => response?.data ?? []);

  let filters = $state<AdminRecordFilter>({});
  function dateToTime(dateStr: string): number | undefined {
    if (!dateStr) return undefined;
    return new Date(dateStr).getTime();
  }
  function timeToDate(time?: number): string {
    if (!time) return "";
    return new Date(time).toISOString().slice(0, 16);
  }

  function applyFilters() {
    currentPage = 0;
    loadRecords();
  }
  function resetFilters() {
    filters = {};
    currentPage = 0;
    loadRecords();
  }
  function setPage(page: number) {
    currentPage = page - 1;
    loadRecords();
  }

  let isLoading = $state(false);

  export function loadRecords() {
    isLoading = true;
    if (response)
      response.data = []; // clear current data to show loading state

    onLoad(filters, currentPage, limit)
      .then((res) => {
        response = res;
      })
      .catch((e) => {
        if (e.message === "Unauthorized") {
          location.hash = "#/admin/login";
          return;
        }
      })
      .finally(() => {
        isLoading = false;
      });
  }

  // isLoading = true;
  loadRecords();

  //#region display helpers

  function getSpotName(id: number): string {
    return tracker.db.getZoneName(id);
  }

  function getItemName(id: number | undefined): string {
    if (!id) return "N/A";
    return tracker.db.getItemName(id);
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  function formatDuration(duration: number): string {
    return `${(duration / 1000).toFixed(1)}s`;
  }

  function getHookType(flags: number): string {
    const hookValue = (flags & FishingFlags.StateHookMask) >> 11;
    switch (hookValue) {
      case 1:
        return "普通";
      case 2:
        return "强力";
      case 3:
        return "精准";
      case 4:
        return "双重";
      case 5:
        return "三重";
      case 6:
        return "华丽";
      default:
        return "-";
    }
  }

  function getTugType(flags: number): string {
    const tugValue = flags & FishingFlags.StateTugMask;
    switch (tugValue) {
      case FishingFlags.StateTugLight:
        return "轻杆";
      case FishingFlags.StateTugMedium:
        return "中杆";
      case FishingFlags.StateTugHeavy:
        return "重杆";
      default:
        return "-";
    }
  }

  function getResultType(record: AdminFishingRecord): {
    text: string;
    color: "gray" | "green" | "red" | "yellow";
  } {
    if (record.fish_id) {
      return { text: "上钩", color: "green" };
    }
    if ((record.flags & FishingFlags.StateHookMask) !== 0) {
      return { text: "脱钩", color: "red" };
    }
    if ((record.flags & FishingFlags.StateGatheringNotEnough) !== 0) {
      return { text: "获得力不足", color: "yellow" };
    }
    return { text: "未提", color: "gray" };
  }

  function getSlapName(id: number | undefined): string {
    if (!id) return "-";
    return getItemName(id);
  }

  function getLureStatus(record: AdminFishingRecord): string {
    if (record.ambious_lure) return `雄心${"I".repeat(record.ambious_lure)}`;
    if (record.modest_lure) return `谦逊${"I".repeat(record.modest_lure)}`;
    return "-";
  }
  //#endregion
</script>

<div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
    <div>
      <Label for="spot">钓场 ID</Label>
      <SpotSelector
        bind:value={() => filters.spot ?? 0, (v) => (filters.spot = v)}
        db={tracker.db}
        placeholder="选择钓场"
      />
    </div>
    <div>
      <Label for="bait">鱼饵 ID</Label>
      <Input
        id="bait"
        type="number"
        bind:value={filters.bait}
        placeholder="鱼饵ID"
      />
    </div>
    <div>
      <Label for="fish">鱼 ID</Label>
      <Input
        id="fish"
        type="number"
        bind:value={filters.fish}
        placeholder="鱼ID"
      />
    </div>
    <div>
      <Label for="user">用户 ID</Label>
      <Input
        id="user"
        type="number"
        bind:value={filters.user}
        placeholder="用户ID"
      />
    </div>
    <div>
      <Label for="dateFrom">开始时间</Label>
      <Input
        id="dateFrom"
        type="datetime-local"
        bind:value={
          () => timeToDate(filters.from), (v) => (filters.from = dateToTime(v))
        }
      />
    </div>
    <div>
      <Label for="dateTo">结束时间</Label>
      <Input
        id="dateTo"
        type="datetime-local"
        bind:value={
          () => timeToDate(filters.to), (v) => (filters.to = dateToTime(v))
        }
      />
    </div>
    <div>
      <Label class="invisible">操作</Label>
      <Button onclick={applyFilters}>查询</Button>
      <Button color="alternative" onclick={resetFilters}>重置</Button>
    </div>
  </div>
</div>

<div class="overflow-x-auto">
  <Table>
    <TableHead>
      <TableHeadCell>
        <Checkbox
          checked={selectedIds.length === records.length && records.length > 0}
          onchange={() => onToggleSelectAll(records.map((r) => r.id))}
        />
      </TableHeadCell>
      <TableHeadCell>ID</TableHeadCell>
      {#if showDeleted}
        <TableHeadCell>删除时间</TableHeadCell>
      {/if}
      <TableHeadCell>用户</TableHeadCell>
      <TableHeadCell>时间</TableHeadCell>
      <TableHeadCell>钓场</TableHeadCell>
      <TableHeadCell>鱼饵</TableHeadCell>
      <TableHeadCell>渔获</TableHeadCell>
      <TableHeadCell>结果</TableHeadCell>
      <TableHeadCell>杆时</TableHeadCell>
      <TableHeadCell>撒饵</TableHeadCell>
      <TableHeadCell>拍水</TableHeadCell>
      <TableHeadCell>咬钩</TableHeadCell>
      <TableHeadCell>提钩</TableHeadCell>
      <TableHeadCell>诱饵</TableHeadCell>
      <TableHeadCell>操作</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each records as record}
        {@const result = getResultType(record)}
        <TableBodyRow>
          <TableBodyCell>
            <Checkbox
              checked={selectedIds.includes(record.id)}
              onchange={() => onToggleSelect(record.id)}
            />
          </TableBodyCell>
          <TableBodyCell>{record.id}</TableBodyCell>
          {#if showDeleted}
            <TableBodyCell
              >{record.deleted_at
                ? formatTime(record.deleted_at as number)
                : "-"}</TableBodyCell
            >
          {/if}
          <TableBodyCell>{record.user_id}</TableBodyCell>
          <TableBodyCell>{formatTime(record.time)}</TableBodyCell>
          <TableBodyCell>{getSpotName(record.spot_id)}</TableBodyCell>
          <TableBodyCell>{getItemName(record.bait_id)}</TableBodyCell>
          <TableBodyCell>
            {#if record.is_dirty}
              <Badge color="yellow" class="mr-1">异常</Badge>
            {/if}
            {getItemName(record.fish_id)}
          </TableBodyCell>
          <TableBodyCell>
            <Badge color={result.color}>{result.text}</Badge>
          </TableBodyCell>
          <TableBodyCell>{formatDuration(record.duration)}</TableBodyCell>
          <TableBodyCell>{record.chum ? "是" : "-"}</TableBodyCell>
          <TableBodyCell>{getSlapName(record.slap_id)}</TableBodyCell>
          <TableBodyCell>{getTugType(record.flags)}</TableBodyCell>
          <TableBodyCell>{getHookType(record.flags)}</TableBodyCell>
          <TableBodyCell>{getLureStatus(record)}</TableBodyCell>
          <TableBodyCell>
            {@render operation(record)}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
  {#if isLoading}
    <TableSkeleton rows={20} columns={15} />
  {:else if records.length === 0}
    <P class="text-center py-4">暂无数据</P>
  {/if}
</div>

<div class="mt-2 flex justify-between items-center">
  {@render bottomNav?.({})}
  <span class="text-sm text-gray-600">共 {totalCount} 条记录</span>
  <PaginationNav
    currentPage={currentPage + 1}
    {totalPages}
    onPageChange={setPage}
  >
    {#snippet prevContent()}
      <span class="sr-only">上一页</span>
      <ChevronLeftOutline class="h-5 w-5" />
    {/snippet}
    {#snippet nextContent()}
      <span class="sr-only">下一页</span>
      <ChevronRightOutline class="h-5 w-5" />
    {/snippet}
  </PaginationNav>
</div>
