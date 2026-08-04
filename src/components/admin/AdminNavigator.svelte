<script lang="ts">
  import { TabItem, Tabs } from "flowbite-svelte";

  let {
    path,
  }: {
    path?: string;
  } = $props();

  let routes = [
    {
      name: "记录管理",
      key: "/admin",
    },
    {
      name: "已删除记录",
      key: "/admin/deleted",
    },
    {
      name: "可疑记录",
      key: "/admin/suspicious",
    },
  ];

  let selectedTab = $state(location.hash.substring(1));
  $effect(() => {
    location.hash = "#" + selectedTab;
    window?.scrollTo(0, 0);
  });
</script>

<Tabs bind:selected={selectedTab} contentClass="hidden">
  {#each routes as item}
    <TabItem title={item.name} key={item.key} open={item.key == path} />
  {/each}
</Tabs>
