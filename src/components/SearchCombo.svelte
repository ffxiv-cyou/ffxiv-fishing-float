<script module lang="ts">
  let comboSeq = 0;
</script>

<script lang="ts">
  import type { GameDatabase, PlaceTree } from "@/model/GameDB";
  import { Search } from "flowbite-svelte";

  import("@/lib/pinyinlite").then((m) => {
    pinyinlite = m.default;
  });
  let pinyinlite: (text: string) => string[][];

  let {
    db,
  }: {
    db: GameDatabase;
  } = $props();

  let searchValue = $state("");
  let activeIndex = $state(-1);
  // Esc 收起列表后，输入框仍有内容，需要单独记一个开关
  let dismissed = $state(false);

  const uid = `search-combo-${++comboSeq}`;
  const listboxId = `${uid}-listbox`;
  const optionId = (i: number) => `${uid}-option-${i}`;

  type FilterItem = {
    type: "spot" | "fish" | "mission";
    isSpear: boolean;
    spot_id: number;
    fish_id?: number;
    wks_id?: number;
    name: string;
    desc: string;
  };

  // O(n^2), 不过n通常很小，所以应该没问题
  function prefixMatch(
    arr: string[][],
    prefix: string,
    depth = false,
  ): boolean {
    if (arr.length === 0) return prefix.length === 0;
    if (prefix.length === 0) return true;

    let length = depth ? 1 : arr.length;
    for (let j = 0; j < length; j++) {
      const current = arr[j];
      for (const c of current) {
        for (let i = 0; i < prefix.length; i++) {
          // 尝试前缀匹配
          if (c[i] === prefix[i]) {
            if (prefixMatch(arr.slice(j + 1), prefix.slice(i + 1), true))
              return true;
          } else {
            break;
          }
        }
      }
    }

    return false;
  }

  function isNameMatch(name: string, search: string): boolean {
    if (name.includes(search)) return true;
    const pinyin = pinyinlite(name);
    const match = prefixMatch(pinyin, search);
    // if (match) console.log("match", name, pinyin, search);
    return match;
  }

  function searchTree(
    tree: PlaceTree[],
    isSpear: boolean,
    results: FilterItem[],
    fishSet: Set<number>,
  ) {
    for (const territory of tree) {
      for (const zone of territory.children ?? []) {
        for (const spot of zone.children ?? []) {
          if (isNameMatch(spot.name, searchValue)) {
            results.push({
              type: "spot",
              isSpear,
              spot_id: spot.id,
              name: spot.name,
              desc: territory.name,
            });
          }
          for (const fishID of spot.fish ?? []) {
            if (fishSet.has(fishID)) continue;
            const fishName = db.getItemNameRaw(fishID);
            if (fishName === undefined) continue;
            if (isNameMatch(fishName, searchValue)) {
              results.push({
                type: "fish",
                isSpear,
                spot_id: spot.id,
                fish_id: fishID,
                name: fishName,
                desc: spot.name,
              });
              fishSet.add(fishID);
            }
          }
          // 宇宙探索钓场的任务
          for (const wks of spot.wks ?? []) {
            const wksName = wks.name.replace(/[\ue000-\uf8ff]/g, "").trim();
            if (!isNameMatch(wksName, searchValue)) continue;
            results.push({
              type: "mission",
              isSpear,
              spot_id: spot.id,
              wks_id: wks.id,
              name: wksName,
              desc: `宇宙探索`,
            });
          }
        }
      }
    }
  }

  let filterList: FilterItem[] = $derived.by(() => {
    if (!searchValue) return [];

    let results: FilterItem[] = [];
    let fishSet = new Set<number>();

    searchTree(db.getPlaceTree(), false, results, fishSet);
    searchTree(db.getSpearSpotTree(), true, results, fishSet);

    return results.slice(0, 50);
  });

  let expanded = $derived(searchValue !== "" && !dismissed);

  // 结果变化后旧的 activeIndex 就没意义了
  $effect(() => {
    filterList;
    activeIndex = -1;
  });

  // 用键盘上下移动时把当前项滚进可视区
  $effect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
  });

  // 结果数播报去抖，否则每敲一个字都是一次播报
  let announcedCount = $state(0);
  $effect(() => {
    const count = filterList.length;
    const t = setTimeout(() => (announcedCount = count), 300);
    return () => clearTimeout(t);
  });

  function onKeydown(e: KeyboardEvent) {
    const count = filterList.length;
    if (e.key === "ArrowDown") {
      if (count === 0) return;
      e.preventDefault();
      dismissed = false;
      activeIndex = activeIndex >= count - 1 ? 0 : activeIndex + 1;
    } else if (e.key === "ArrowUp") {
      if (count === 0) return;
      e.preventDefault();
      dismissed = false;
      activeIndex = activeIndex <= 0 ? count - 1 : activeIndex - 1;
    } else if (e.key === "Enter") {
      const target = filterList[activeIndex] ?? filterList[0];
      if (!target) return;
      e.preventDefault();
      visit(target);
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        dismissed = true;
        activeIndex = -1;
      } else if (searchValue) {
        e.preventDefault();
        searchValue = "";
      }
    }
  }

  function visit(item: FilterItem) {
    if (item.type === "spot") {
      window.location.hash = `/info/${item.spot_id}`;
    } else if (item.type === "fish") {
      window.location.hash = `/info/${item.spot_id}?f=${item.fish_id}`;
    } else if (item.type === "mission") {
      window.location.hash = `/info/${item.spot_id}?w=${item.wks_id}`;
    }
    searchValue = "";
    dismissed = false;
    activeIndex = -1;
  }
</script>

<Search
  size="md"
  class="ms-auto"
  placeholder="搜索钓场/鱼"
  autocomplete="off"
  role="combobox"
  aria-label="搜索钓场/鱼"
  aria-expanded={expanded}
  aria-controls={listboxId}
  aria-autocomplete="list"
  aria-activedescendant={expanded && activeIndex >= 0
    ? optionId(activeIndex)
    : undefined}
  bind:value={searchValue}
  oninput={() => {
    dismissed = false;
  }}
  onkeydown={onKeydown}
  onfocusout={(e) => {
    // 点到结果项时 relatedTarget 为空，交给 onclick 处理
    if (e.relatedTarget) dismissed = true;
  }}
  classes={{
    content:
      "absolute inset-y-auto top-full right-0 left-0 z-20 mt-1 max-h-60 flex-col overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
  }}
  children={expanded ? children : undefined}
/>

{#snippet children()}
  <div id={listboxId} role="listbox" aria-label="搜索结果">
    {#each filterList as item, i (i)}
      <button
        type="button"
        role="option"
        tabindex="-1"
        id={optionId(i)}
        aria-selected={i === activeIndex}
        class="px-4 py-2 w-full flex text-left items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer {i ===
        activeIndex
          ? 'bg-gray-100 dark:bg-gray-700'
          : ''}"
        onclick={() => visit(item)}
        onmouseenter={() => (activeIndex = i)}
        onmousedown={(e) => e.preventDefault()}
      >
        <div>{item.name}</div>
        <div class="text-xs text-gray-400">
          {item.desc}
        </div>
      </button>
    {/each}
  </div>
  <div class="sr-only" role="status">{announcedCount} 个结果</div>
{/snippet}
