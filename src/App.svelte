<script lang="ts">
  import { PacketHandler } from "./model/PacketHandler";
  import defaultOpcode from "./lib/opcode.json";
  import { FishingTracker } from "./model/FishingTracker";
  import Timer from "./pages/Timer.svelte";
  import overlayToolkit, { type GameVersion } from "overlay-toolkit-lib";
  import { PcapReplay } from "./model/dev/replay";
  import Setting from "./pages/Setting.svelte";
  import Notice from "./pages/Notice.svelte";

  let tracker = $state(new FishingTracker());
  let logic = new PacketHandler(tracker);
  let replay = $state(new PcapReplay());

  logic.setOpcode(defaultOpcode);
  console.log("FishingFloat logic initialized:", logic.genPacketFilter());

  // must be after overlayToolkit is imported
  overlayToolkit.Start();
  overlayToolkit.GetGameVersion().then(handleGameVersion);
  logic.init(overlayToolkit);
  logic.init(replay);

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
