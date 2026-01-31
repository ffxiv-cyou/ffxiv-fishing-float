<script lang="ts">
  import { GameDatabase } from "@/model/GameDB";

  let {
    spotID = $bindable(0),
  }: {
    spotID: number;
  } = $props();

  let db = $state(new GameDatabase());
  db.loadLatest().then(() => {
    console.log("GameDB loaded");
  });

  let tree = $derived(db.getPlaceTree());

  let territoryID = $state(0);
  let territory = $derived(tree?.find((p) => p.id === territoryID));

  let zoneID = $state(0);
  let zone = $derived(territory?.children?.find((p) => p.id === zoneID));

  let spot = $derived(zone?.children?.find((p) => p.id === spotID));

  function setTerritory(id: number) {
    territoryID = id;
    if (territoryID > 0 && !zone) {
      const zoneID = territory?.children?.length ? territory.children[0].id : 0;
      setZone(zoneID);
    }
  }

  function setZone(id: number) {
    zoneID = id;
    if (zoneID > 0 && !spot) {
      const spotID = zone?.children?.length ? zone.children[0].id : 0;
      setSpot(spotID);
    }
  }

  function setSpot(id: number) {
    spotID = id;
  }

  $effect(() => {
    if (tree.length === 0) {
      return;
    }

    if (spotID && !spot) {
      // 如果 spotID 不存在于当前 zone 中，查询整个树以定位它
      for (const terr of tree) {
        for (const zn of terr.children) {
          const sp = zn.children.find((s) => s.id === spotID);
          if (sp) {
            territoryID = terr.id;
            zoneID = zn.id;
            return;
          }
        }
      }
    }
  });
</script>

<select bind:value={() => territoryID, (v) => setTerritory(v)}>
  <option value={0} disabled>选择区域</option>
  {#each tree as territoryOption}
    <option value={territoryOption.id}>{territoryOption.name}</option>
  {/each}
</select>

<select bind:value={() => zoneID, (v) => setZone(v)}>
  <option value={0} disabled>选择地图</option>
  {#each territory?.children as zoneOption}
    <option value={zoneOption.id}>{zoneOption.name}</option>
  {/each}
</select>

<select bind:value={() => spotID, (v) => setSpot(v)}>
  <option value={0} disabled>选择钓场</option>
  {#each zone?.children as spotOption}
    <option value={spotOption.id}>{spotOption.name}</option>
  {/each}
</select>
