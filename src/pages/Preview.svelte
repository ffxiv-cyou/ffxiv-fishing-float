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

<div class="control-bar">
  <span class="xiv-text blue">请调整窗口位置与大小</span>
  <span class="xiv-text blue">锁定后开始使用</span>
</div>
<TimerPreview {config} {db} />

<style>
  .control-bar {
    margin-top: -20px;
    height: 20px;
    text-align: left;
    font-size: 15px;
    text-align: center;
    user-select: none;
  }
</style>
