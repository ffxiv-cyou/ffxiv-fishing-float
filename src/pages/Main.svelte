<script lang="ts">
  import { PacketHandler } from "@/model/PacketHandler";
  import { FishingTracker } from "@/model/FishingTracker";
  import Timer from "@/pages/Timer.svelte";
  import overlayToolkit, { type GameVersion } from "overlay-toolkit";
  import { PcapReplay } from "@/model/dev/replay";
  import Notice, { type Message } from "@/pages/Notice.svelte";
  import SpectralTimer from "@/components/SpectralTimer.svelte";
  import {
    initFeedbackOverlayHandler,
    submitFeedbackToSentry,
    type FeedbackAttachment,
    type FeedbackFields,
    type FeedbackResult,
  } from "@/lib/feedbackBridge";

  let tracker = $state(new FishingTracker());
  let logic = new PacketHandler(tracker);
  let replay = $state(new PcapReplay());
  let availableVersions: { [key: string]: string } = $state({});

  // must be after overlayToolkit is imported
  overlayToolkit.Start();

  tracker
    .getVersions()
    .then(onVersionListLoaded)
    .finally(() => {
      overlayToolkit.GetGameVersion().then(handleGameVersion);
    });

  function importPackets(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer && arrayBuffer instanceof ArrayBuffer) {
          replay.loadPcapPackets(arrayBuffer);
          replay.play();
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  let showConfig = $state(false);
  function toggleConfig() {
    showConfig = !showConfig;
  }

  let message: Message | undefined = $state({
    title: "悬浮窗插件连接失败",
    content: "请安装 overlay-toolkit 插件并重启 ACT。",
    type: "error",
  });

  function handleGameVersion(version: GameVersion) {
    console.log("game version", version);

    // handler not found, plugin is not working properly
    if (!version) {
      return;
    }

    message = undefined;

    let ver = version?.version;
    if (!ver) {
      const values = Object.values(availableVersions);
      if (values.length > 0) {
        ver = values[0];
      }
      console.warn(
        "Game version not detected, defaulting to last available version.",
        ver,
      );
    }
    loadGameData(ver);
  }

  function onVersionListLoaded(versions: { [key: string]: string }) {
    availableVersions = versions;
  }

  async function loadGameData(version: string, localOnly = false) {
    tracker
      .loadGameData(version)
      .then(() => {
        let opcodes = tracker.db.getOpcodes();
        logic.setOpcode(opcodes);
        if (!localOnly) {
          logic.init(overlayToolkit);
          tracker.init(overlayToolkit);
        }
        logic.init(replay);
        console.log("Game data loaded for version:", version, opcodes);
      })
      .catch((e) => {
        message = {
          title: "游戏数据加载失败",
          content:
            `当前版本 (${version}) 数据加载失败，可能是还没更新。` +
            e.toString(),
          type: "error",
        };
        console.error("Failed to load game data:", e);
      });
  }

  function openHistory() {
    const spot = tracker.CurrentZone;
    const bait = tracker.CurrentBait;
    let hash = `/web/#/info/${spot}/${bait}`;
    if (spot === 0) {
      hash = `/web/#/info`;
    }
    window.open(hash, "_blank", "width=1000,height=600");
  }

  let showHistory = $derived(
    tracker.CurrentZone > 0 && tracker.IsInFishingEvent,
  );

  function openSettingPage() {
    window.open("/#/setting", "Settings", "width=800,height=700");
  }

  async function openExportUrl() {
    const tools = await overlayToolkit.GetPluginInfo().then((ver) => ver.tools);
    if (tools == null || !tools.includes("otk::open_browser")) {
      throw new Error("open_browser tool not available");
    }
    let url =
      location.protocol +
      "//" +
      location.host +
      "/web/#/export/" +
      tracker.getFishingLogShareUrl();
    await overlayToolkit.OpenBrowser(url);
  }

  function openNoteExportPage() {
    openExportUrl().catch(() => {
      window.open("/web/#/export/", "NoteExport", "width=800,height=400");
    });
  }

  function openFeedback() {
    window.open("/web/#/feedback", "Feedback", "width=920,height=760");
  }

  async function submitFeedback(
    fields: FeedbackFields,
    screenshot?: FeedbackAttachment,
  ): Promise<FeedbackResult> {
    const extraAttachments: FeedbackAttachment[] = [];
    if (fields.includePcap) {
      const pcap = logic.dumpPcap();
      if (pcap) {
        extraAttachments.push({
          data: new Uint8Array(pcap),
          filename: "recent_packets.pcap",
          contentType: "application/octet-stream",
        });
      }
    }
    return submitFeedbackToSentry(fields, screenshot, {
      source: "overlay",
      extraAttachments,
    });
  }

  initFeedbackOverlayHandler({
    onSubmit: submitFeedback,
  });

  let statsIsLow = $derived.by(() => {
    if (!tracker.config.StatsThresoldEnabled || !tracker.IsInFishingEvent)
      return false;
    return (
      (tracker.config.GatheringThresold > 0 &&
        tracker.gathering > 0 &&
        tracker.gathering < tracker.config.GatheringThresold) ||
      (tracker.config.PerceptionThresold > 0 &&
        tracker.perception > 0 &&
        tracker.perception < tracker.config.PerceptionThresold)
    );
  });

  let showSettingBtn = $derived(tracker.config.ShowSettingBtn || showConfig);

  (window as any).FishingFloat = {
    openHistory,
    openSettingPage,
    openNoteExportPage,
  };
</script>

<div class="debug-tool">
  <div>
    <h2>钓鱼悬浮窗</h2>
    <p>在ACT中添加此悬浮窗后开始使用</p>
    <div class="link-buttons">
      <a class="primary" href="/web/#/help/overlay" target="_blank">安装教程</a>
      <a href="/web/" target="_blank">查看统计数据</a>
    </div>
  </div>
  <details>
    <summary>调试工具</summary>
    <div>
      <label for="file">导入数据包: </label>
      <select
        id="version-select"
        value="unset"
        onchange={(e) =>
          loadGameData((e.target as HTMLSelectElement).value, true)}
      >
        <option value="unset" disabled selected>选择版本</option>
        {#each Object.entries(availableVersions) as [name, ver]}
          <option value={ver}>{name}</option>
        {/each}
      </select>
      <input
        type="file"
        id="file"
        accept=".pcap,.xml"
        onchange={importPackets}
        name="pcapFile"
      />
    </div>
  </details>
</div>
<Notice {message} />
<SpectralTimer {tracker}>
  {#snippet childrenLeft()}
    <div class="round-hint"></div>
    {#if showSettingBtn}
      <button class="round-btn setting-btn" onclick={toggleConfig}>⚙</button>
      {#if showHistory}
        <button class="round-btn history-btn" onclick={openHistory}>↗</button>
      {/if}
    {/if}
    {#if showConfig}
      <button
        class="xiv-text blue"
        aria-label="open window"
        onclick={openSettingPage}
        >设置 &raquo;
      </button>
      <button
        class="xiv-text blue"
        aria-label="open window"
        onclick={openHistory}
        >记录 &raquo;
      </button>
      <button
        class="xiv-text blue"
        aria-label="open window"
        onclick={openNoteExportPage}
        >导出笔记 &raquo;
      </button>
      <button
        class="xiv-text blue"
        aria-label="open window"
        onclick={openFeedback}
        >反馈 &raquo;
      </button>
    {/if}
  {/snippet}
  {#snippet childrenRight()}
    {#if statsIsLow}
      <span class="xiv-text red">双维低</span>
    {/if}
  {/snippet}
</SpectralTimer>
<Timer {tracker} onclick={toggleConfig} />

<style>
  :global([data-prod="true"]) .debug-tool {
    display: none;
  }

  :global([data-desktop="true"]) .round-hint {
    display: block;
    border: none;
    border-radius: 50%;
    background-color: #80808040;
    width: 7px;
    height: 7px;
  }

  .round-btn {
    border: none;
    border-radius: 50%;
    background-color: #ffffff80;
    cursor: pointer;
    width: 18px;
    height: 18px;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }

  :global([data-desktop="true"]) .round-btn {
    display: none;
  }

  .link-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 10px;
  }

  .link-buttons a {
    background-color: #0369a1;
    border-radius: 5px;
    padding: 8px 24px;
    color: white;
    text-decoration: none;
    font-size: 14px;
  }
  .link-buttons a.primary {
    background-color: #eb4f27;
  }
</style>
