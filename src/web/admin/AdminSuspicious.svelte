<script lang="ts">
  import { AdminAuth } from "@/model/AdminAuth";
  import type { FishingTracker } from "@/model/FishingTracker";
  import { Button, Modal, P, Alert, A } from "flowbite-svelte";
  import RecordTable from "@/components/admin/RecordTable.svelte";
  import Trash from "@/components/icon/Trash.svelte";
  import AdminNavigator from "@/components/admin/AdminNavigator.svelte";
  import CircleX from "@/components/icon/CircleX.svelte";
  import { type AdminSuspiciousRecord } from "@/model/API";

  let {
    tracker,
    path,
  }: {
    tracker: FishingTracker;
    path?: string;
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
    message: "",
    confirm: "确认",
    callback: (val: { action: string }) => {},
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
    deleteConfirm = {
      open: true,
      ids,
      message: `确定删除 ${ids.length} 条记录吗？`,
      confirm: "删除",
      callback: confirmDelete,
    };
  }
  function openDismissModal(ids: number[]) {
    deleteConfirm = {
      open: true,
      ids,
      message: `确定忽略 ${ids.length} 条记录吗？`,
      confirm: "忽略",
      callback: confirmDismiss,
    };
  }

  let tableRef: RecordTable;

  async function confirmDelete(val: { action: string }) {
    if (val.action === "delete") {
      try {
        await api.deleteSuspiciousRecords(deleteConfirm.ids);
        await tableRef.loadRecords();
        selectedIds = [];
      } catch (e: any) {
        error = e.message || "删除失败";
      }
    }
    deleteConfirm.open = false;
  }

  async function confirmDismiss(val: { action: string }) {
    if (val.action === "delete") {
      try {
        await api.dismissSuspiciousRecords(deleteConfirm.ids);
        await tableRef.loadRecords();
        selectedIds = [];
      } catch (e: any) {
        error = e.message || "忽略失败";
      }
    }
    deleteConfirm.open = false;
  }
</script>

<div class="p-4">
  <AdminNavigator {path}></AdminNavigator>
  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}

  <RecordTable
    {selectedIds}
    {tracker}
    onToggleSelect={toggleSelect}
    onToggleSelectAll={toggleSelectAll}
    onLoad={(filter, page, size) =>
      api.getSuspiciousRecords(filter, page, size)}
    getID={(r) => (r as AdminSuspiciousRecord).record_id}
    bind:this={tableRef}
  >
    {#snippet operation(record)}
    {@const r = record as AdminSuspiciousRecord}
      <button
        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => openDeleteModal([r.record_id])}
        aria-label="删除"
      >
        <Trash class="w-4 h-4" />
      </button>
      <button
        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => openDismissModal([r.record_id])}
        aria-label="忽略"
      >
        <CircleX class="w-4 h-4" />
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
          <Button
            size="sm"
            color="green"
            class="py-1"
            onclick={() => openDismissModal(selectedIds)}
          >
            批量忽略
          </Button>
        {/if}
      </div>
    {/snippet}
  </RecordTable>

  <Modal
    title="确认删除"
    form
    bind:open={deleteConfirm.open}
    onaction={deleteConfirm.callback}
  >
    <P>{deleteConfirm.message}</P>
    <P class="text-sm text-gray-500">此操作可以稍后在"已删除记录"中恢复。</P>

    {#snippet footer()}
      <Button type="submit" value="delete" color="red">{deleteConfirm.confirm}</Button>
      <Button type="submit" value="cancel" color="alternative">取消</Button>
    {/snippet}
  </Modal>
</div>
