<script lang="ts">
  import { GameDatabase, type PlaceTree } from "@/model/GameDB";
  import { AccordionItem, Accordion } from "flowbite-svelte";
  import ChevronLeftOutline from "../icon/ChevronLeftOutline.svelte";
  import ChevronRightOutline from "../icon/ChevronRightOutline.svelte";
  import type { FishingStorage } from "@/model/HistoryStorage";

  let {
    spotID = $bindable(0),
    db,
    storage,
  }: {
    spotID: number;
    db: GameDatabase;
    storage?: FishingStorage;
  } = $props();

  let tree = $derived(db.getPlaceTree());

  let territoryID = $state(0);
  let territory = $derived(tree?.find((p) => p.id === territoryID));

  let zoneID = $state(0);
  let zone = $derived(territory?.children?.find((p) => p.id === zoneID));

  let spot = $derived(zone?.children?.find((p) => p.id === spotID));

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

  let commonBorder = "border-l-6 border-l-gray-200 dark:border-l-gray-700";

  let itemClasses = {
    button: `pl-3 pr-4 py-2 ${commonBorder} group-first:rounded-none`,
    content: "p-0",
  };
  let subItemClasses = {
    button: `pl-5 pr-4 py-2 ${commonBorder} group-first:rounded-none bg-gray-50 dark:bg-gray-800`,
    content: "py-0",
  };

  function getSpotClasses(spot: PlaceTree, isItem: boolean) {
    let classes = isItem ? { ...itemClasses } : { ...subItemClasses };
    const isFinished = isSpotFinish(spot);
    if (isFinished) {
      classes.button += " border-l-green-700";
    }
    return classes;
  }

  function isSpotFinish(tree: PlaceTree): boolean {
    if (!storage) return false;

    if (tree.children) {
      let completedCount = 0;
      let validSpotCount = 0;

      for (const child of tree.children) {
        const childResult = isSpotFinish(child);
        const hasFishList = child.fish && child.fish.length > 0;

        if (hasFishList) {
          validSpotCount++;
          if (childResult) {
            completedCount++;
          }
        }
      }

      if (validSpotCount === 0) {
        return false;
      }

      return completedCount === validSpotCount;
    }

    const fishList = tree.fish;
    if (!fishList || fishList.length === 0) {
      return false;
    }

    for (const fish of fishList) {
      if (!storage.isFishingLogged(fish, false)) {
        return false;
      }
    }
    return true;
  }

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
      <AccordionItem
        classes={getSpotClasses(territory, true)}
        open={territory.id === territoryID}
      >
        {#snippet header()}{territory.name}{/snippet}
        <Accordion flush>
          {#each territory.children as zone}
            <AccordionItem
              classes={getSpotClasses(zone, false)}
              open={zone.id === zoneID}
            >
              {#snippet header()}{zone.name}{/snippet}
              {#each zone.children as spot}
                <button
                  class={[
                    "pl-7 py-1 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-700",
                    commonBorder,
                    spot.id === spotID ? "bg-gray-300 dark:bg-gray-600" : "",
                    isSpotFinish(spot) ? "border-l-green-700" : "",
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
    class="w-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
    onclick={() => (expanded = !expanded)}
  >
    {#if expanded}
      <ChevronLeftOutline class="h-4 w-4" />
    {:else}
      <ChevronRightOutline class="h-4 w-4" />
    {/if}
  </button>
</div>
