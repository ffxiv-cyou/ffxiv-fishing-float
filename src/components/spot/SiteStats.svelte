<script lang="ts">
  import type { HomeStatsResponse, RecentCatchesItem } from "@/model/API";
  import type { FishingTracker } from "@/model/FishingTracker";
  import {
    Table,
    TableHead,
    TableBody,
    TableBodyCell,
    TableHeadCell,
    TableBodyRow,
    A,
  } from "flowbite-svelte";

  let {
    tracker,
  }: {
    tracker: FishingTracker;
  } = $props();

  let response: HomeStatsResponse | null = $state(null);
  let spotBait: RecentCatchesItem[] = $state([]);
  let fish: RecentCatchesItem[] = $state([]);

  async function loadData() {
    try {
      response = await tracker.api.getSiteStats({
        groups: "spot_bait,spot_fish",
        period: "1d",
      });
      spotBait = response.recent_catches["spot_bait"] ?? [];
      fish = response.recent_catches["spot_fish"] ?? [];
    } catch (e) {
      console.error("Failed to load site stats", e);
      return;
    }
  }

  function getPlaceName(spot_id: number) {
    return tracker.db.getZoneName(spot_id);
  }
  function getItemName(bait_id: number) {
    return tracker.db.getItemName(bait_id);
  }
  function getFishSpot(fish_id: number) {
    const tree = tracker.db.getPlaceTree();
    for (const territory of tree) {
      for (const zone of territory.children ?? []) {
        for (const spot of zone.children ?? []) {
          if ((spot.fish ?? []).some((f) => f === fish_id)) {
            return spot.id;
          }
        }
      }
    }
    return "";
  }

  loadData();
</script>

<div class="p-4 m-auto">
  <Table divClass="inline-block">
    <TableHead>
      <TableHeadCell>钓场</TableHeadCell>
      <TableHeadCell>鱼饵</TableHeadCell>
      <TableHeadCell>杆数</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y">
      {#each spotBait as item}
        <TableBodyRow>
          <TableBodyCell>
            <A href={`#/info/${item.spot_id}`} color="secondary">
              {getPlaceName(item.spot_id!)}
            </A>
          </TableBodyCell>
          <TableBodyCell>{getItemName(item.bait_id!)}</TableBodyCell>
          <TableBodyCell>{item.count}</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
  <Table divClass="ml-10 inline-block">
    <TableHead>
      <TableHeadCell>渔获</TableHeadCell>
      <TableHeadCell>钓场</TableHeadCell>
      <TableHeadCell>数量</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y">
      {#each fish as item}
        <TableBodyRow>
          <TableBodyCell>
            <A href={`#/info/${item.spot_id!}`} color="secondary">
              {tracker.db.getItemName(item.fish_id!)}
            </A>
          </TableBodyCell>
          <TableBodyCell>
            <a href={`#/info/${item.spot_id!}`}>
              {getPlaceName(item.spot_id!)}
            </a>
          </TableBodyCell>
          <TableBodyCell>{item.count}</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
