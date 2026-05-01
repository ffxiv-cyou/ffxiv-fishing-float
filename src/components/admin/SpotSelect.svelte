<script lang="ts">
  import { type GameDatabase } from "@/model/GameDB";

  let {
    value = $bindable(0),
    db,
    placeholder = "选择钓场",
    id,
  }: {
    value: number;
    db: GameDatabase;
    placeholder?: string;
    id?: string;
  } = $props();

  interface SpotOption {
    id: number;
    name: string;
    fullName: string;
  }

  let tree = $derived(db.getPlaceTree());

  let options = $derived.by(() => {
    const result: SpotOption[] = [];
    const tree = db.getPlaceTree();

    for (const territory of tree) {
      if (territory.children) {
        for (const zone of territory.children) {
          if (zone.children) {
            for (const spot of zone.children) {
              result.push({
                id: spot.id,
                name: spot.name,
                fullName: `${territory.name} > ${zone.name} > ${spot.name}`,
              });
            }
          }
        }
      }
    }
    return result;
  });

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    value = parseInt(target.value) || 0;
  }
</script>

<select
  class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2.5"
  onchange={handleChange}
  {id}
>
  <option value="0">{placeholder}</option>
  <option value="950">未知钓场</option>
  {#each tree as territory}
    {#each territory.children as zone}
      <optgroup label={territory.name + " > " + zone.name}>
        {#each zone.children as spot}
          <option value={spot.id} selected={value === spot.id}>
            {spot.name}
          </option>
        {/each}
      </optgroup>
    {/each}
  {/each}
</select>
