<script lang="ts">
  import type { GameDatabase } from "@/model/GameDB";
  import { Search } from "flowbite-svelte";

  import("@/lib/pinyinlite").then((m) => {
    pinyinlite = m.default;
  });
  let pinyinlite: (text: string) => string[][];

  let {
    db,
    value = $bindable(),
    id,
    placeholder
  }: {
    db: GameDatabase;
    value: number | undefined,
    id?: string,
    placeholder?: string
  } = $props();

  let searchValue = $state("");
  let textValue = $state("");

  type FilterItem = {
    id: number;
    name: string;
    desc?: string;
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
    if (!searchValue || textValue === searchValue) return [];

    let id = parseInt(searchValue);
    if (id > 0) {
      return [{
        id,
        name: db.getItemName(id)
      }];
    }

    let results: FilterItem[] = [];
    const keys = Object.keys(db.itemNames);
    for (const key of keys) {
      const id = parseInt(key);
      const name = db.getItemName(id);
      if (isNameMatch(name, searchValue)) {
        results.push({
          id: id,
          name,
        })
      }
    }
    return results.slice(0, 50);
  });

  function visit(item: FilterItem) {
    value = item.id;
    searchValue = item.name;
    textValue = item.name;
  }

  if (value) {
    textValue = db.getItemName(value);
    searchValue = textValue;
  }

  $effect(() => {
    if (!searchValue) {
      value = undefined;
      textValue = "";
    }
  });

</script>

<Search
  id={id}
  size="md"
  class="ms-auto"
  clearable={false}
  placeholder={placeholder ?? "搜索"}
  bind:value={searchValue}
  onkeydown={(e) => {
    if (e.key === "Enter" && filterList.length > 0) {
      visit(filterList[0]);
    }
  }}
  classes={{
    input: "pe-2 ps-8",
    content:
      "absolute inset-y-auto top-full right-0 left-0 z-20 mt-1 max-h-60 flex-col overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
  }}
  children={(searchValue && searchValue != textValue) ? children : undefined}
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
