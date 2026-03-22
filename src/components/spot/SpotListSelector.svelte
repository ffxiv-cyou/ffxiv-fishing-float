<script lang="ts">
  import { GameDatabase } from "@/model/GameDB";
  import { AccordionItem, Accordion } from "flowbite-svelte";
  import ChevronLeftOutline from "../icon/ChevronLeftOutline.svelte";
  import ChevronRightOutline from "../icon/ChevronRightOutline.svelte";

  let {
    spotID = $bindable(0),
    db,
  }: {
    spotID: number;
    db: GameDatabase;
  } = $props();

  let tree = $derived(db.getPlaceTree());

  let territoryID = $state(0);
  let territory = $derived(tree?.find((p) => p.id === territoryID));

  let zoneID = $state(0);
  let zone = $derived(territory?.children?.find((p) => p.id === zoneID));

  let spot = $derived(zone?.children?.find((p) => p.id === spotID));

  function setTerritory(id: number) {
    territoryID = id;
    zoneID = 0;
    spotID = 0;
    if (territoryID > 0 && !zone) {
      const zoneID = territory?.children?.length ? territory.children[0].id : 0;
      setZone(zoneID);
    }
  }

  function setZone(id: number) {
    zoneID = id;
    spotID = 0;
    if (zoneID > 0 && !spot) {
      const spotID = zone?.children?.length ? zone.children[0].id : 0;
      setSpot(spotID);
    }
  }

  let expanded = $state(true);
  function updateExpanded() {
    if (window.innerWidth < 1024) {
      expanded = false;
    }
  }

  function setSpot(id: number) {
    spotID = id;
    updateExpanded(); // 窄屏幕下需要在选择后自动收起列表
  }

  $effect(() => {
    if (tree.length === 0) {
      return;
    }

    if (spotID && !spot) {
      // 如果 spotID 不存在于当前 zone 中，查询整个树以定位它
      for (const terr of tree) {
        for (const zn of terr.children!) {
          const sp = zn.children!.find((s) => s.id === spotID);
          if (sp) {
            territoryID = terr.id;
            zoneID = zn.id;
            return;
          }
        }
      }
    }
  });

  let itemClasses = {
    button: "px-4 py-2 ",
    content: "p-0",
  };
  let subItemClasses = {
    button: "pl-6 pr-4 py-2 bg-gray-50 dark:bg-gray-800",
    content: "py-0",
  };

  updateExpanded();
</script>

<div class="flex">
  <Accordion
    flush
    class={[
      "border-r-1",
      "border-gray-200",
      "dark:border-gray-700",
      "overflow-y-auto",
      expanded ? "w-60" : "w-0",
      "transition-width",
    ].join(" ")}
  >
    {#each tree as territory}
      <AccordionItem classes={itemClasses}>
        {#snippet header()}{territory.name}{/snippet}
        <Accordion flush>
          {#each territory.children as zone}
            <AccordionItem classes={subItemClasses}>
              {#snippet header()}{zone.name}{/snippet}
              {#each zone.children as spot}
                <button
                  class={[
                    "pl-8 py-1 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-700",
                    spot.id === spotID ? "bg-gray-300 dark:bg-gray-600" : "",
                  ].join(" ")}
                  onclick={() => setSpot(spot.id)}
                >
                  {spot.name}
                </button>
              {/each}
            </AccordionItem>
          {/each}
        </Accordion>
      </AccordionItem>
    {/each}
  </Accordion>
  <button
    class="w-4 bg-gray-50 dark:bg-gray-800"
    onclick={() => (expanded = !expanded)}
  >
    {#if expanded}
      <ChevronLeftOutline class="h-4 w-4" />
    {:else}
      <ChevronRightOutline class="h-4 w-4" />
    {/if}
  </button>
</div>
