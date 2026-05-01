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

  let restoreConfirm = $state({
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

  function openRestoreModal(ids: number[]) {
    restoreConfirm = { open: true, ids };
  }

  let tableRef: RecordTable;
  async function confirmRestore(val: { action: string }) {
    if (val.action === "restore") {
      try {
        await api.restoreRecords(restoreConfirm.ids);
        await tableRef.loadRecords();
      } catch (e: any) {
        error = e.message || "恢复失败";
      }
    }
    restoreConfirm.open = false;
  }
</script>

<div class="p-4">
  <div class="mb-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">已删除记录</h1>
    <A href="#/admin">返回记录管理</A>
  </div>

  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}

  <RecordTable
    {selectedIds}
    {tracker}
    showDeleted={true}
    onToggleSelect={toggleSelect}
    onToggleSelectAll={toggleSelectAll}
    onLoad={(filter, page, size) => api.getDeletedRecords(filter, page, size)}
    bind:this={tableRef}
  >
    {#snippet operation(record)}
      <button
        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => openRestoreModal([record.id])}
        aria-label="恢复"
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
            color="green"
            class="py-1"
            onclick={() => openRestoreModal(selectedIds)}
          >
            批量恢复
          </Button>
        {/if}
      </div>
    {/snippet}
  </RecordTable>

  <Modal
    title="确认恢复"
    form
    bind:open={restoreConfirm.open}
    onaction={confirmRestore}
  >
    <P>确定恢复 {restoreConfirm.ids.length} 条记录吗？</P>

    {#snippet footer()}
      <Button type="submit" value="restore" color="green">恢复</Button>
      <Button type="submit" value="cancel" color="alternative">取消</Button>
    {/snippet}
  </Modal>
</div>
