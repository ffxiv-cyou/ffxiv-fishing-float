<script lang="ts">
  import SpotInfoView from "@/components/spot/SpotInfoView.svelte";
  import SpotList from "@/components/spot/SpotListSelector.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";

  let {
    spot = $bindable(""),
    bait = $bindable(""),
    tracker,
    navigate,
    setTitle,
  }: {
    spot: string;
    bait: string;
    tracker: FishingTracker;
    navigate: (params: { spot: string; bait: string }) => void;
    setTitle: (title: string) => void;
  } = $props();

  let spotID = $derived(parseInt(spot) || 0);
  let baitID = $derived(parseInt(bait) || 0);

  function setSpot(id: number) {
    spotID = id;
    navigate({ spot: spotID.toString(), bait: baitID.toString() });
  }
  function setBait(id: number) {
    baitID = id;
    navigate({ spot: spotID.toString(), bait: baitID.toString() });
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
  <SpotList bind:spotID={() => spotID, setSpot} db={tracker.db} />
  <div class="content-pane flex-1 p-4 overflow-y-auto">
    {#if spotID > 0}
      <SpotInfoView {spotID} bind:baitID={() => baitID, setBait} {tracker} />
    {:else}
      <div class="h-16 flex flex-row items-center justify-center">
        <div class="flex-1">请在左侧选择钓场</div>
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
