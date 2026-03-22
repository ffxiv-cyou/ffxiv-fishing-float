<script lang="ts">
  import { Heading, P, List, Listgroup, ListgroupItem } from "flowbite-svelte";
  import SpotFishView from "./SpotFishView.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import type { FishDurationDistribution } from "@/model/API";
  import type { PlaceTree } from "@/model/GameDB";

  let {
    spot,
    tracker,
    durations,
  }: {
    spot: PlaceTree | null;
    tracker: FishingTracker;
    durations: FishDurationDistribution[];
  } = $props();
</script>

<Heading tag="h2" class="relative text-2xl leading-tight">杆时</Heading>
<SpotFishView {durations} db={tracker.db} title="fish" />
{#if spot?.fish?.length ?? 0 > 0}
  <Heading tag="h2" class="relative text-2xl leading-tight">鱼类列表</Heading>
  <P>
    <List>
      <Listgroup>
        {#each spot?.fish as fishID}
          <ListgroupItem>
            {tracker.db.getItemName(fishID)}
          </ListgroupItem>
        {/each}
      </Listgroup>
    </List>
  </P>
{/if}
