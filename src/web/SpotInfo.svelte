<script lang="ts">
  import SpotInfoView from "@/components/spot/SpotInfoView.svelte";
  import SpearSpotInfoView from "@/components/spot/SpearSpotInfoView.svelte";
  import SpotList from "@/components/spot/SpotListSelector.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";

  let {
    spot = $bindable(""),
    bait = $bindable(""),
    b: bait_id = $bindable(""),
    f: fish_id = $bindable(""),
    tracker,
    navigate,
    setTitle,
  }: {
    spot: string;
    bait: string;
    b: string;
    f: string;
    tracker: FishingTracker;
    navigate: (params: {
      spot: string;
      bait: string;
      b?: string;
      f?: string;
    }) => void;
    setTitle: (title: string) => void;
  } = $props();

  let spotID = $derived(parseInt(spot) || 0);
  // 钓鱼 / 叉鱼钓场 ID 不重合，命中叉鱼树即为叉鱼钓场，调叉鱼接口
  let isSpearSpot = $derived(
    spotID > 0 && tracker.db.isSpearSpot(spotID),
  );
  let myBaitID = $derived(parseInt(bait) || 0);
  let fishID = $derived(parseInt(fish_id) || 0);
  let baitID = $derived(parseInt(bait_id) || 0);

  // 等 hash 回流后派生值自动重算即可
  function setSpot(id: number) {
    bait_id = "";
    fish_id = "";
    bait = "";
    navigate({
      spot: id.toString(),
      bait: myBaitID > 0 ? myBaitID.toString() : "",
    });
  }
  function setMyBait(id: number) {
    navigate({ spot: spotID.toString(), bait: id.toString() });
  }
  function setFish(id: number) {
    navigate({
      spot: spotID.toString(),
      bait: "",
      f: id > 0 ? id.toString() : undefined,
    });
  }
  function setBait(id: number) {
    navigate({
      spot: spotID.toString(),
      bait: "",
      b: id > 0 ? id.toString() : undefined,
    });
  }

  $effect(() => {
    if (spotID > 0) {
      const spotName = tracker.db.getZoneName(spotID);
      setTitle(`${spotName} - 钓场信息`);
    } else {
      setTitle("钓场信息");
    }
  });
</script>

<!--左右排列-->
<div class="flex info-root">
  <SpotList
    bind:spotID={() => spotID, setSpot}
    db={tracker.db}
    storage={tracker.history.storage}
  />
  <div class="content-pane flex-1 p-4 overflow-y-auto">
    {#if spotID > 0}
      {#if isSpearSpot}
        {#key spotID}
          <SpearSpotInfoView
            {spotID}
            bind:fishID={() => fishID, setFish}
            {tracker}
          />
        {/key}
      {:else}
        <SpotInfoView
          {spotID}
          bind:myBaitID={() => myBaitID, setMyBait}
          bind:fishID={() => fishID, setFish}
          bind:baitID={() => baitID, setBait}
          {tracker}
        />
      {/if}
    {:else}
      <div class="h-16 flex flex-row items-center justify-center">
        <div class="flex-1">
          请在左侧选择钓场
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .info-root {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .content-pane {
    min-height: 0;
  }
</style>
