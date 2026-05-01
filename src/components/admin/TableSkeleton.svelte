<script lang="ts">
  let {
    rows = 5,
    columns = 6,
  }: {
    rows?: number;
    columns?: number;
  } = $props();
</script>

<div class="animate-pulse px-4">
  {#each Array(rows) as _, i}
    <div
      class="flex items-center space-x-4 skeleton-line border-b border-gray-200 dark:border-gray-700"
    >
      <div class="w-4 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
      {#each Array(columns) as _, j}
        <div class="h-4 bg-gray-200 rounded dark:bg-gray-700 flex-1"></div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .skeleton-line {
    padding: 10.5px 0;
  }
</style>
