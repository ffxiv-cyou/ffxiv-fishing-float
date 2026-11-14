<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { HistoryItem, HistoryRecordFilter } from "@/model/HistoryStorage";
  import { LureType, TugType } from "@/model/InnerEnums";
  import {
    Button,
    Modal,
    P,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    PaginationNav,
  } from "flowbite-svelte";
  import Trash from "../icon/Trash.svelte";
  import FeedbackLink from "../FeedbackLink.svelte";
  import ChevronLeftOutline from "../icon/ChevronLeftOutline.svelte";
  import ChevronRightOutline from "../icon/ChevronRightOutline.svelte";
  import { formatEorzeaTime, formatTime } from "./data_helper";
  import { exportFileName, historyToCSV, saveCSV } from "@/lib/historyExport";

  let {
    tracker,
    spotID,
    baitID,
  }: {
    tracker: FishingTracker;
    spotID: number;
    baitID: number;
  } = $props();

  let history: HistoryItem[] = $state([]);
  let historyCount = $state(0);
  let limit = 10;

  // 渔获下拉只列出本地记录里出现过的鱼（与竿时图取数一致）
  let fishes: number[] = $state([]);
  $effect(() => {
    tracker.history.storage
      .getHistory(spotID, baitID > 0 ? baitID : undefined)
      .then((records) => {
        fishes = [...new Set(records.map((record) => record.fish))];
      });
  });

  // 空字符串表示不筛选，与 Select 的 value 类型对齐
  let tugType = $state("");
  let fish = $state("");

  let filter: HistoryRecordFilter = $derived({
    tugType: tugType === "" ? undefined : (Number(tugType) as TugType),
    fish: fish === "" ? undefined : Number(fish),
  });

  let tugTypeItems = [
    { value: "", name: "(全部竿型)" },
    { value: TugType.Light.toString(), name: "轻竿" },
    { value: TugType.Medium.toString(), name: "中竿" },
    { value: TugType.Heavy.toString(), name: "重竿" },
  ];

  let fishItems = $derived.by(() => {
    const arr = [
      { value: "", name: "(全部渔获)" },
      { value: "-1", name: "(脱钩)" },
    ];
    for (const id of fishes) {
      arr.push({ value: id.toString(), name: tracker.db.getItemName(id) });
    }
    return arr;
  });

  let currentPage = $state(1);
  let totalPages = $derived(Math.ceil(historyCount / limit));

  let offset = $derived((currentPage - 1) * limit);

  let exporting = $state(false);

  async function exportCSV() {
    if (exporting) return;
    exporting = true;
    try {
      const records = await tracker.history.storage.listHistory(
        spotID,
        baitID > 0 ? baitID : undefined,
        undefined,
        undefined,
        undefined,
        filter,
      );
      const csv = historyToCSV(records, tracker.db);
      await saveCSV(exportFileName(tracker.db.getZoneName(spotID)), csv);
    } finally {
      exporting = false;
    }
  }

  function handlePageChange(page: number) {
    currentPage = page;
  }

  // 筛选条件变化时回到第 1 页，避免停在已不存在的页上
  let filterKey = $state("");
  $effect(() => {
    const key = `${tugType}|${fish}`;
    if (key !== filterKey) {
      filterKey = key;
      currentPage = 1;
    }
  });

  // 切换鱼饵后，已选的具体渔获可能不在列表里，回到全部渔获
  $effect(() => {
    if (fish !== "" && fish !== "-1" && !fishes.includes(Number(fish))) {
      fish = "";
    }
  });

  $effect(() => {
    tracker.history.storage
      .countHistory(
        spotID,
        baitID > 0 ? baitID : undefined,
        undefined,
        filter,
      )
      .then((count) => {
        historyCount = count;
      });
  });

  $effect(() => {
    if (spotID > 0) {
      tracker.history.storage
        .listHistory(
          spotID,
          baitID > 0 ? baitID : undefined,
          undefined,
          limit,
          offset,
          filter,
        )
        .then((records) => {
          history = records;
        });
    }
  });

  function getItemName(id: number) {
    return tracker.db.getItemName(id);
  }

  function getFishName(item: HistoryItem) {
    if (item.fish !== undefined) return getItemName(item.fish);
    switch (item.tugType) {
      case TugType.Light:
        return "(轻竿脱钩)";
      case TugType.Medium:
        return "(中竿脱钩)";
      case TugType.Heavy:
        return "(重竿脱钩)";
    }
  }

  function getFishEorzeaTime(item: HistoryItem) {
    if (item.lureAt) return formatEorzeaTime(item.lureAt);
    else return formatEorzeaTime(item.date);
  }

  function getLureType(item: HistoryItem): string {
    if (
      item.lureType === null ||
      item.lureType === undefined ||
      item.lureStacks === 0
    )
      return "-";
    var prefix = "";
    switch (item.lureType) {
      case LureType.Ambitious:
        prefix = "雄心";
        break;
      case LureType.Modest:
        prefix = "谦逊";
        break;
    }
    return `${prefix} (x${item.lureStacks} @ ${((item.lureAt - item.date) / 1000).toFixed(1)}s)`;
  }

  function deleteRecord(index: number) {
    deleteConfirm.open = true;
    deleteConfirm.deleteIndex = index;
  }

  let deleteConfirm = $state({
    open: false,
    deleteIndex: -1,
  });

  function confirmDelete(val: { action: string; data: any }) {
    if (val.action === "delete") {
      tracker.history.storage.deleteHistory(deleteConfirm.deleteIndex);
    }
    deleteConfirm.open = false;
  }
</script>

<div class="flex justify-end gap-2 mb-2">
  <!-- flowbite 的 Select 默认会多渲染一个 value="" 的 placeholder 项，
       把下面 value="" 的「全部」项顶掉，所以置空 placeholder -->
  <Select
    items={tugTypeItems}
    bind:value={tugType}
    placeholder=""
    name="竿型"
    class="w-32"
  />
  <Select
    items={fishItems}
    bind:value={fish}
    placeholder=""
    name="渔获"
    class="w-40"
  />
  <Button size="sm" onclick={exportCSV} disabled={exporting}>导出 CSV</Button>
</div>
<Table>
  <TableHead>
    <TableHeadCell>时间</TableHeadCell>
    <TableHeadCell>ET</TableHeadCell>
    <TableHeadCell>鱼饵</TableHeadCell>
    <TableHeadCell>渔获</TableHeadCell>
    <TableHeadCell>竿时</TableHeadCell>
    <TableHeadCell>撒饵</TableHeadCell>
    <TableHeadCell>诱饵</TableHeadCell>
    <TableHeadCell>操作</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each history as record}
      <TableBodyRow>
        <TableBodyCell>{formatTime(record.date)}</TableBodyCell>
        <TableBodyCell>{getFishEorzeaTime(record)}</TableBodyCell>
        <TableBodyCell>{getItemName(record.bait)}</TableBodyCell>
        <TableBodyCell>{getFishName(record)}</TableBodyCell>
        <TableBodyCell>{record.biteTime.toFixed(1)}s</TableBodyCell>
        <TableBodyCell>{record.chum ? "撒饵" : "-"}</TableBodyCell>
        <TableBodyCell>{getLureType(record)}</TableBodyCell>
        <TableBodyCell>
          <Button
            class="p-2!"
            onclick={() => deleteRecord(record.date)}
            aria-label="删除记录"
          >
            <Trash />
          </Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
<div class="mt-2 flex justify-end">
  <PaginationNav {currentPage} {totalPages} onPageChange={handlePageChange}>
    {#snippet prevContent()}
      <span class="sr-only">Previous</span>
      <ChevronLeftOutline class="h-5 w-5" />
    {/snippet}
    {#snippet nextContent()}
      <span class="sr-only">Next</span>
      <ChevronRightOutline class="h-5 w-5" />
    {/snippet}
  </PaginationNav>
</div>

<Modal
  title="提示"
  form
  bind:open={deleteConfirm.open}
  onaction={confirmDelete}
>
  <P>确定删除此条本地记录吗？此操作不可撤销。</P>
  <P class="size-sm"
    >若此数据影响了在线数据的显示，麻烦填写<FeedbackLink
    />附上钓鱼的时间、渔获等信息方便我们修正。</P
  >

  {#snippet footer()}
    <Button type="submit" value="delete" color="red">删除</Button>
    <Button type="submit" value="decline" color="alternative">取消</Button>
  {/snippet}
</Modal>
