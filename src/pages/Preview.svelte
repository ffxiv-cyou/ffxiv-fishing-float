<script lang="ts">
  import TimerPreview from "@/components/TimerPreview.svelte";
  import { FishingTracker } from "@/model/FishingTracker";
  let tracker = $state(new FishingTracker());
  let config = $derived(tracker.config);
  let db = $derived(tracker.db);

  tracker.getVersions().then((versions) => {
    tracker.loadGameData(Object.values(versions)[0]);
  });
</script>

<TimerPreview {config} {db} />
