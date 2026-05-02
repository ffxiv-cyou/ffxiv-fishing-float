<script lang="ts">
  import { AdminAuth } from "@/model/AdminAuth";
  import type { FishingTracker } from "@/model/FishingTracker";
  import { Button, Modal, P, Alert, A } from "flowbite-svelte";
  import RecordTable from "@/components/admin/RecordTable.svelte";
  import Trash from "@/components/icon/Trash.svelte";

  let {
    tracker,
  }: {
    tracker: FishingTracker;
  } = $props();

  let api = $derived(tracker.api);
  let isAuthenticated = $state(AdminAuth.isAuthenticated());

  $effect(() => {
    if (!isAuthenticated) {
      location.hash = "#/admin/login";
    }
  });

  let error = $state("");

  let selectedIds = $state<number[]>([]);

  let deleteConfirm = $state({
    open: false,
    ids: [] as number[],
  });

  function toggleSelect(id: number) {
    const index = selectedIds.indexOf(id);
    if (index > -1) {
      selectedIds = selectedIds.filter((i) => i !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  function toggleSelectAll(ids: number[]) {
    if (selectedIds.length === ids.length) {
      selectedIds = [];
    } else {
      selectedIds = ids;
    }
  }

  function openDeleteModal(ids: number[]) {
    deleteConfirm = { open: true, ids };
  }

  let tableRef: RecordTable;

  async function confirmDelete(val: { action: string }) {
    if (val.action === "delete") {
      try {
        await api.deleteRecords(deleteConfirm.ids);
        await tableRef.loadRecords();
        selectedIds = [];
      } catch (e: any) {
        error = e.message || "删除失败";
      }
    }
    deleteConfirm.open = false;
  }
</script>

<div class="p-4">
  <div class="mb-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">记录管理</h1>
    <A href="#/admin/deleted">查看已删除记录</A>
  </div>
  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}

  <RecordTable
    {selectedIds}
    {tracker}
    onToggleSelect={toggleSelect}
    onToggleSelectAll={toggleSelectAll}
    onLoad={(filter, page, size) => api.getAdminRecords(filter, page, size)}
    bind:this={tableRef}
  >
    {#snippet operation(record)}
      <button
        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => openDeleteModal([record.id])}
        aria-label="删除"
      >
        <Trash class="w-4 h-4" />
      </button>
    {/snippet}
    {#snippet bottomNav()}
      <div class="flex items-center gap-2">
        <span class="text-sm">已选: {selectedIds.length} 条</span>
        {#if selectedIds.length > 0}
          <Button
            size="sm"
            color="red"
            class="py-1"
            onclick={() => openDeleteModal(selectedIds)}
          >
            批量删除
          </Button>
        {/if}
      </div>
    {/snippet}
  </RecordTable>

  <Modal
    title="确认删除"
    form
    bind:open={deleteConfirm.open}
    onaction={confirmDelete}
  >
    <P>确定删除 {deleteConfirm.ids.length} 条记录吗？</P>
    <P class="text-sm text-gray-500">此操作可以稍后在"已删除记录"中恢复。</P>

    {#snippet footer()}
      <Button type="submit" value="delete" color="red">删除</Button>
      <Button type="submit" value="cancel" color="alternative">取消</Button>
    {/snippet}
  </Modal>
</div>
