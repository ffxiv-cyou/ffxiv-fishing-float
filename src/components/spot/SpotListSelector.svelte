<script lang="ts">
  import { GameDatabase, type PlaceTree } from "@/model/GameDB";
  import {
    AccordionItem,
    Accordion,
    ButtonGroup,
    Button,
  } from "flowbite-svelte";
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

  // 钓场类型页签：垂钓 / 叉鱼。两类钓场 ID 不重合，切 Tab 只换数据源。
  let tab = $state("fish");
  let isSpearTab = $derived(tab === "spear");

  let tree = $derived(isSpearTab ? db.getSpearSpotTree() : db.getPlaceTree());

  function setTab(v: string) {
    if (v === tab) return;
    tab = v;
    // 若当前选中就属于新 Tab，直接定位它
    if (spotID) {
      for (const region of tree) {
        for (const zone of region.children ?? []) {
          if ((zone.children ?? []).some((s) => s.id === spotID)) {
            territoryID = region.id;
            zoneID = zone.id;
            return;
          }
        }
      }
    }
    // 否则沿用相同 ID 的展开位置（两边共用的区域/地点 ID 一致，
    // 如夏劳尼荒野 4508）；新树里没有才收起
    const region = tree.find((t) => t.id === territoryID);
    const zone = region?.children?.find((z) => z.id === zoneID);
    if (!region || !zone) {
      territoryID = -1;
      zoneID = 0;
    }
  }

  let territoryID = $state(-1);
  let territory = $derived(tree?.find((p) => p.id === territoryID));

  let zoneID = $state(0);
  let zone = $derived(territory?.children?.find((p) => p.id === zoneID));

  // 手风琴的手动开合也要落到父级状态，否则切 Tab 重建后展开态丢失
  function setTerritoryOpen(id: number, v: boolean) {
    if (v) {
      territoryID = id;
    } else if (territoryID === id) {
      territoryID = -1;
    }
  }
  function setZoneOpen(id: number, v: boolean) {
    if (v) {
      zoneID = id;
    } else if (zoneID === id) {
      zoneID = 0;
    }
  }

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

  // 上次已定位/分流过的选中。手动切 Tab 不改 spotID，靠它避免自动切 Tab
  // 把手动切换弹回去；只有 spotID 变化（如直链打开）时才自动切边。
  let tabbedSpotID = $state(0);

  $effect(() => {
    if (tree.length === 0) {
      return;
    }
    if (!spotID) {
      return;
    }
    if (spot) {
      // 当前 Tab 下已定位，记住，下次手动切 Tab 时不再自动弹回
      tabbedSpotID = spotID;
      return;
    }
    if (spotID === tabbedSpotID) {
      return;
    }

    // 如果 spotID 不存在于当前 zone 中，查询整个树以定位它
    for (const terr of tree) {
      for (const zn of terr.children!) {
        const sp = zn.children!.find((s) => s.id === spotID);
        if (sp) {
          territoryID = terr.id;
          zoneID = zn.id;
          tabbedSpotID = spotID;
          return;
        }
      }
    }
    // 当前 Tab 下找不到：鱼/叉鱼 ID 不重合，说明选中属于另一边，自动切过去
    // （如直链打开叉鱼钓场时）。切后不标记，下一轮在新树中定位。
    if (!isSpearTab && db.isSpearSpot(spotID)) {
      tab = "spear";
      territoryID = -1;
      zoneID = 0;
      return;
    } else if (isSpearTab && db.getPlaceTreeByID(spotID) !== null) {
      tab = "fish";
      territoryID = -1;
      zoneID = 0;
      return;
    }
    tabbedSpotID = spotID;
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
    const isFinished = isSpotFinish(spot, isSpearTab);
    if (isFinished) {
      classes.button += " border-l-green-700";
    }
    return classes;
  }

  function isSpotFinish(
    tree: PlaceTree,
    isSpear: boolean = false,
  ): boolean | undefined {
    if (!storage) return false;

    if (tree.children) {
      for (const child of tree.children) {
        if (isSpotFinish(child, isSpear) === false) {
          return false;
        }
      }
      return true;
    }

    const fishList = tree.fish;
    if (!fishList || fishList.length === 0) {
      return undefined;
    }

    // 只按钓鱼笔记判定完成度：过滤掉不在笔记中的鱼
    const noteInfo = db.getFishingNoteInfo();
    const noteFishes = isSpear ? noteInfo?.spear_fishes : noteInfo?.fishes;
    const checkList = noteFishes
      ? fishList.filter((fish) => noteFishes.includes(fish))
      : fishList;
    // 过滤后为空说明全是笔记外鱼（如宇宙探索等），视为已完成
    if (checkList.length === 0) {
      return true;
    }

    for (const fish of checkList) {
      if (!storage.isFishingLogged(fish, isSpear)) {
        return false;
      }
    }
    return true;
  }

  updateExpanded();
</script>

<div class="flex">
  <div
    class={[
      "flex-col",
      "min-h-0",
      "overflow-hidden",
      "border-r-1",
      "border-gray-200",
      "dark:border-gray-700",
      "flex",
      expanded ? "w-60" : "w-0",
      "transition-width",
    ].join(" ")}
  >
    <div
      class="shrink-0 p-2 border-b-1 border-gray-200 dark:border-gray-700"
    >
      <ButtonGroup size="sm" class="w-full">
        <Button
          class="flex-1"
          color={!isSpearTab ? "primary" : "light"}
          onclick={() => setTab("fish")}
        >
          垂钓
        </Button>
        <Button
          class="flex-1"
          color={isSpearTab ? "primary" : "light"}
          onclick={() => setTab("spear")}
        >
          刺鱼
        </Button>
      </ButtonGroup>
    </div>
    <Accordion
      flush
      multiple
      class={["overflow-y-auto", "flex-1", "min-h-0"].join(" ")}
    >
      {#each tree as territory (territory.id)}
        <AccordionItem
          classes={getSpotClasses(territory, true)}
          bind:open={
            () => territory.id === territoryID,
            (v) => setTerritoryOpen(territory.id, v)
          }
        >
          {#snippet header()}{territory.name}{/snippet}
          <Accordion flush multiple>
            {#each territory.children as zone (zone.id)}
              <AccordionItem
                classes={getSpotClasses(zone, false)}
                bind:open={
                  () => zone.id === zoneID, (v) => setZoneOpen(zone.id, v)
                }
              >
                {#snippet header()}{zone.name}{/snippet}
                {#each zone.children as spot (spot.id)}
                  <button
                    class={[
                      "pl-7 py-1 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-700",
                      commonBorder,
                      spot.id === spotID ? "bg-gray-300 dark:bg-gray-600" : "",
                      isSpotFinish(spot, isSpearTab)
                        ? "border-l-green-700"
                        : "",
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
  </div>
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
