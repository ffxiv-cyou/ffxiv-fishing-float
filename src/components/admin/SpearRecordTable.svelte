<script lang="ts">
  import type {
    AdminSpearRecord,
    SpearRecordFilter,
    AdminSpearRecordListResponse,
  } from "@/model/API";
  import type { FishingTracker } from "@/model/FishingTracker";
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
  import ItemCombo from "../ItemCombo.svelte";
  import { formatEorzeaTime, formatTime } from "../spot/data_helper";

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
      filter: SpearRecordFilter,
      page: number,
      pageSize: number,
    ) => Promise<AdminSpearRecordListResponse>;
    tracker: FishingTracker;
    bottomNav?: Snippet<[{}]>;
    operation: Snippet<[AdminSpearRecord]>;
  } = $props();

  let response: AdminSpearRecordListResponse | null = $state(null);
  let currentPage = $state(0);

  const limit = 20;
  let totalCount = $derived.by(() => response?.count ?? 0);
  let totalPages = $derived(Math.ceil(totalCount / limit));

  let records = $derived.by(() => response?.data ?? []);

  let filters = $state<SpearRecordFilter>({});

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
    if (response) response.data = []; // clear current data to show loading state

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

  loadRecords();

  //#region display helpers

  function getSpotName(id: number): string {
    return tracker.db.getZoneName(id);
  }

  function getFishName(id: number): string {
    if (!id) return "(未知)";
    return tracker.db.getItemName(id);
  }

  function getFishSize(sz: number | undefined): string {
    if (!sz) return "-";
    return (sz / 10).toFixed(1);
  }

  function getSizeClass(sizeClass: number): string {
    switch (sizeClass) {
      case 1:
        return "小";
      case 2:
        return "中";
      case 3:
        return "大";
      default:
        return "未知";
    }
  }
  //#endregion
</script>

<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
  <div class="flex gap-4 flex-wrap">
    <div>
      <Label for="spot">钓场 ID</Label>
      <SpotSelector
        bind:value={() => filters.spot ?? 0, (v) => (filters.spot = v)}
        db={tracker.db}
        spear={true}
        placeholder="选择钓场"
      />
    </div>
    <div class="w-32">
      <Label for="fish">鱼 ID</Label>
      <ItemCombo
        id="fish"
        db={tracker.db}
        bind:value={filters.fish}
        placeholder="鱼ID"
      />
    </div>
    <div class="w-32">
      <Label for="user">用户 ID</Label>
      <Input
        id="user"
        type="number"
        bind:value={filters.user}
        placeholder="用户ID"
      />
    </div>
    <div class="w-48">
      <Label for="dateFrom">开始时间</Label>
      <Input
        id="dateFrom"
        type="datetime-local"
        bind:value={
          () => timeToDate(filters.from), (v) => (filters.from = dateToTime(v))
        }
      />
    </div>
    <div class="w-48">
      <Label for="dateTo">结束时间</Label>
      <Input
        id="dateTo"
        type="datetime-local"
        bind:value={
          () => timeToDate(filters.to), (v) => (filters.to = dateToTime(v))
        }
      />
    </div>
    <div class="w-60">
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
      <TableHeadCell>ET</TableHeadCell>
      <TableHeadCell>钓场</TableHeadCell>
      <TableHeadCell>鱼种</TableHeadCell>
      <TableHeadCell>尺寸</TableHeadCell>
      <TableHeadCell>速度</TableHeadCell>
      <TableHeadCell>尺寸档</TableHeadCell>
      <TableHeadCell>状态</TableHeadCell>
      <TableHeadCell>发光</TableHeadCell>
      <TableHeadCell>鱼识</TableHeadCell>
      <TableHeadCell>操作</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each records as record}
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
          <TableBodyCell>{formatEorzeaTime(record.time)}</TableBodyCell>
          <TableBodyCell>{getSpotName(record.spot_id)}</TableBodyCell>
          <TableBodyCell>{getFishName(record.fish_id)}</TableBodyCell>
          <TableBodyCell>{getFishSize(record.size)}</TableBodyCell>
          <TableBodyCell>{record.speed || "-"}</TableBodyCell>
          <TableBodyCell>{getSizeClass(record.size_class)}</TableBodyCell>
          <TableBodyCell>
            <Badge color={record.uncaught ? "gray" : "green"}>
              {record.uncaught ? "未捕获" : "已捕获"}
            </Badge>
          </TableBodyCell>
          <TableBodyCell>{record.hq ? "是" : "-"}</TableBodyCell>
          <TableBodyCell>{record.intuition ? "是" : "-"}</TableBodyCell>
          <TableBodyCell>
            {@render operation(record)}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
  {#if isLoading}
    <TableSkeleton rows={20} columns={14} />
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
