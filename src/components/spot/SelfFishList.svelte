<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { HistoryItem } from "@/model/HistoryStorage";
  import { LureType } from "@/model/InnerEnums";
  import {
    Button,
    Modal,
    P,
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

  let {
    tracker,
    spotID,
    baitID
  }: {
    tracker: FishingTracker;
    spotID: number;
    baitID: number;
  } = $props();

  let history: HistoryItem[] = $state([]);
  let historyCount = $state(0);
  let limit = 10;

  let currentPage = $state(1);
  let totalPages = $derived(Math.ceil(historyCount / limit));

  let offset = $derived((currentPage - 1) * limit);

  function handlePageChange(page: number) {
    currentPage = page;
  }

  $effect(() => {
    tracker.history.storage.countHistory(spotID, baitID > 0 ? baitID : undefined).then((count) => {
      historyCount = count;
    });
  });

  $effect(() => {
    if (spotID > 0) {
      tracker.history.storage
        .listHistory(spotID, baitID > 0 ? baitID : undefined, undefined, limit, offset)
        .then((records) => {
          history = records;
        });
    }
  });

  function getItemName(id: number) {
    return tracker.db.getItemName(id);
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

<Table>
  <TableHead>
    <TableHeadCell>时间</TableHeadCell>
    <TableHeadCell>鱼饵</TableHeadCell>
    <TableHeadCell>渔获</TableHeadCell>
    <TableHeadCell>杆时</TableHeadCell>
    <TableHeadCell>撒饵</TableHeadCell>
    <TableHeadCell>诱饵</TableHeadCell>
    <TableHeadCell>操作</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each history as record}
      <TableBodyRow>
        <TableBodyCell>{new Date(record.date).toLocaleString()}</TableBodyCell>
        <TableBodyCell>{getItemName(record.bait)}</TableBodyCell>
        <TableBodyCell>{getItemName(record.fish)}</TableBodyCell>
        <TableBodyCell>{record.biteTime.toFixed(1)}s</TableBodyCell>
        <TableBodyCell>{record.chum ? "是" : "否"}</TableBodyCell>
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
