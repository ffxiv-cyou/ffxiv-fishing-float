<script lang="ts">
  import { AdminAuth } from "@/model/AdminAuth";
  import type { FishingTracker } from "@/model/FishingTracker";
  import { Button, Modal, P, Alert } from "flowbite-svelte";
  import SpearRecordTable from "@/components/admin/SpearRecordTable.svelte";
  import Trash from "@/components/icon/Trash.svelte";
  import AdminNavigator from "@/components/admin/AdminNavigator.svelte";

  let {
    tracker,
    path,
  }: {
    tracker: FishingTracker;
    path?: string;
  } = $props();

  let api = $derived(tracker.api);
  let isAuthenticated = $state(AdminAuth.isAuthenticated());
  // 记录管理页与已删除页共用本组件，由路由路径区分。
  let showDeleted = $derived(path === "/admin/spear/deleted");

  $effect(() => {
    if (!isAuthenticated) {
      location.hash = "#/admin/login";
    }
  });

  let error = $state("");
  let selectedIds = $state<number[]>([]);

  let confirm = $state({
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

  function openConfirm(ids: number[]) {
    confirm = { open: true, ids };
  }

  let tableRef: SpearRecordTable;

  async function confirmAction(val: { action: string }) {
    if (val.action === "confirm") {
      try {
        if (showDeleted) {
          await api.restoreSpearRecords(confirm.ids);
        } else {
          await api.deleteSpearRecords(confirm.ids);
        }
        await tableRef.loadRecords();
        selectedIds = [];
      } catch (e: any) {
        error = e.message || (showDeleted ? "恢复失败" : "删除失败");
      }
    }
    confirm.open = false;
  }
</script>

<div class="p-4">
  <AdminNavigator {path}></AdminNavigator>

  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}

  <SpearRecordTable
    {selectedIds}
    {tracker}
    {showDeleted}
    onToggleSelect={toggleSelect}
    onToggleSelectAll={toggleSelectAll}
    onLoad={(filter, page, size) =>
      showDeleted
        ? api.getDeletedSpearRecords(filter, page, size)
        : api.getAdminSpearRecords(filter, page, size)}
    bind:this={tableRef}
  >
    {#snippet operation(record)}
      {#if showDeleted}
        <button
          class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          onclick={() => openConfirm([record.id])}
          aria-label="恢复"
        >
          恢复
        </button>
      {:else}
        <button
          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          onclick={() => openConfirm([record.id])}
          aria-label="删除"
        >
          <Trash class="w-4 h-4" />
        </button>
      {/if}
    {/snippet}
    {#snippet bottomNav()}
      <div class="flex items-center gap-2">
        <span class="text-sm">已选: {selectedIds.length} 条</span>
        {#if selectedIds.length > 0}
          <Button
            size="sm"
            color={showDeleted ? "green" : "red"}
            class="py-1"
            onclick={() => openConfirm(selectedIds)}
          >
            {showDeleted ? "批量恢复" : "批量删除"}
          </Button>
        {/if}
      </div>
    {/snippet}
  </SpearRecordTable>

  <Modal
    title={showDeleted ? "确认恢复" : "确认删除"}
    form
    bind:open={confirm.open}
    onaction={confirmAction}
  >
    <P>确定{showDeleted ? "恢复" : "删除"} {confirm.ids.length} 条记录吗？</P>
    {#if !showDeleted}
      <P class="text-sm text-gray-500">此操作可以稍后在"已删除刺鱼"中恢复。</P>
    {/if}

    {#snippet footer()}
      <Button
        type="submit"
        value="confirm"
        color={showDeleted ? "green" : "red"}>{showDeleted ? "恢复" : "删除"}</Button
      >
      <Button type="submit" value="cancel" color="alternative">取消</Button>
    {/snippet}
  </Modal>
</div>
