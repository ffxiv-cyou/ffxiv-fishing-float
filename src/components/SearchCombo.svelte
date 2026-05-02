<script lang="ts">
  import type { GameDatabase } from "@/model/GameDB";
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

  type FilterItem = {
    type: "spot" | "fish";
    spot_id: number;
    fish_id?: number;
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

  let filterList: FilterItem[] = $derived.by(() => {
    if (!searchValue) return [];

    let results: FilterItem[] = [];
    let fishSet = new Set<number>();

    var placeTree = db.getPlaceTree();
    for (const territory of placeTree) {
      for (const zone of territory.children ?? []) {
        for (const spot of zone.children ?? []) {
          if (isNameMatch(spot.name, searchValue)) {
            results.push({
              type: "spot",
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
                spot_id: spot.id,
                fish_id: fishID,
                name: fishName,
                desc: spot.name,
              });
              fishSet.add(fishID);
            }
          }
        }
      }
    }

    return results.slice(0, 10);
  });

  function visit(item: FilterItem) {
    if (item.type === "spot") {
      window.location.hash = `/info/${item.spot_id}`;
    } else if (item.type === "fish") {
      window.location.hash = `/info/${item.spot_id}?f=${item.fish_id}`;
    }
    searchValue = "";
  }
</script>

<Search
  size="md"
  class="ms-auto"
  placeholder="搜索钓场/鱼"
  bind:value={searchValue}
  onkeydown={(e) => {
    if (e.key === "Enter" && filterList.length > 0) {
      visit(filterList[0]);
    }
  }}
  classes={{
    content:
      "absolute inset-y-auto top-full right-0 left-0 z-20 mt-1 max-h-60 flex-col overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
  }}
  children={searchValue ? children : undefined}
/>

{#snippet children()}
  {#each filterList as item}
    <button
      class="px-4 py-2 w-full flex text-left items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
      onclick={() => visit(item)}
    >
      <div>{item.name}</div>
      <div class="text-xs text-gray-400">
        {item.desc}
      </div>
    </button>
  {/each}
{/snippet}
