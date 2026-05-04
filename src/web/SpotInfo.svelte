<script lang="ts">
  import SpotInfoView from "@/components/spot/SpotInfoView.svelte";
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
  let myBaitID = $derived(parseInt(bait) || 0);
  let fishID = $derived(parseInt(fish_id) || 0);
  let baitID = $derived(parseInt(bait_id) || 0);

  function setSpot(id: number) {
    spotID = id;
    bait_id = "";
    fish_id = "";
    bait = "";
    navigate({
      spot: spotID.toString(),
      bait: myBaitID > 0 ? myBaitID.toString() : "",
    });
  }
  function setMyBait(id: number) {
    myBaitID = id;
    navigate({ spot: spotID.toString(), bait: myBaitID.toString() });
  }
  function setFish(id: number) {
    fishID = id;
    navigate({
      spot: spotID.toString(),
      bait: "",
      f: id > 0 ? id.toString() : undefined,
    });
  }
  function setBait(id: number) {
    baitID = id;
    navigate({
      spot: spotID.toString(),
      bait: "",
      b: id > 0 ? id.toString() : undefined,
    });
  }

  $effect(() => {
    if (spotID > 0) {
      const spotName = tracker.db.getZoneName(spotID);
      setTitle(`钓场信息 - ${spotName}`);
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
      <SpotInfoView
        {spotID}
        bind:myBaitID={() => myBaitID, setMyBait}
        bind:fishID={() => fishID, setFish}
        bind:baitID={() => baitID, setBait}
        {tracker}
      />
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
