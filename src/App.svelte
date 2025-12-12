<script lang="ts">
  import { PacketHandler } from "./model/PacketHandler";
  import { FishingTracker } from "./model/FishingTracker";
  import Timer from "./pages/Timer.svelte";
  import overlayToolkit, { type GameVersion } from "overlay-toolkit";
  import { PcapReplay } from "./model/dev/replay";
  import Setting from "./pages/Setting.svelte";
  import Notice from "./pages/Notice.svelte";

  let tracker = $state(new FishingTracker());
  let logic = new PacketHandler(tracker);
  let replay = $state(new PcapReplay());
  let availableVersions: { [key: string]: string } = {};

  // must be after overlayToolkit is imported
  overlayToolkit.Start();

  tracker
    .getVersions()
    .then((versions) => {
      availableVersions = versions;
    })
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

  let prodMode = overlayToolkit.IsOverlayPluginCEF();
  let showConfig = $state(false);

  function toggleConfig() {
    showConfig = !showConfig;
  }

  let message:
    | {
        title: string;
        content: string;
        type: "info" | "warning" | "error";
      }
    | undefined = $state({
    title: "悬浮窗插件连接失败",
    content: "请安装 overlay-toolkit 插件并重启 ACT。",
    type: "error",
  });

  function handleGameVersion(version: GameVersion) {
    message = undefined;
    console.log(version);

    let ver = version.version;
    if (!ver) {
      const values = Object.values(availableVersions);
      if (values.length > 0) {
        ver = values[values.length - 1];
      }
      console.warn(
        "Game version not detected, defaulting to last available version.",
        ver,
      );
    }

    try {
      loadGameData(ver);
    } catch (e: any) {
      message = {
        title: "游戏数据加载失败",
        content: `当前版本 (${ver}) 数据加载失败。` + e.toString(),
        type: "error",
      };
      console.error("Failed to load game data:", e);
    }
  }

  async function loadGameData(version: string) {
    await tracker.loadGameData(version);

    let opcodes = tracker.db.getOpcodes();
    logic.setOpcode(opcodes);
    logic.init(overlayToolkit);
    logic.init(replay);

    console.log("Game data loaded for version:", version, opcodes);
  }

  if (!prodMode) {
    // for dev mode, load a default version
    handleGameVersion({ version: "2025.10.23.0000.0000", lang: 5 });
  }
</script>

<main data-prod={prodMode}>
  <div class="debug-tool">
    <label for="file">Import</label>
    <input
      type="file"
      id="file"
      accept=".pcap,.xml"
      onchange={importPackets}
      name="pcapFile"
    />
  </div>
  {#if message !== undefined}
    <Notice
      title={message.title}
      content={message.content}
      type={message.type}
    />
  {/if}
  {#if showConfig || tracker.config.ShowSettingBtn}
    <button class="setting-btn" onclick={toggleConfig}>⚙</button>
  {/if}
  {#if showConfig}
    <Setting config={tracker.config} />
  {/if}
  <Timer {tracker} onclick={toggleConfig} />
</main>

<style>
  main[data-prod="true"] {
    width: 100%;
    height: 100%;
  }
  main[data-prod="true"] .debug-tool {
    display: none;
  }
  .setting-btn {
    position: absolute;
    left: 20px;
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
</style>
