<script lang="ts">
  import { PacketHandler } from "@/model/PacketHandler";
  import { FishingTracker } from "@/model/FishingTracker";
  import Timer from "@/pages/Timer.svelte";
  import overlayToolkit, { type GameVersion } from "overlay-toolkit";
  import { PcapReplay } from "@/model/dev/replay";
  import Setting from "@/pages/Setting.svelte";
  import Notice, { type Message } from "@/pages/Notice.svelte";

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
    message = undefined;
    console.log(version);

    let ver = version.version;
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

  async function loadGameData(version: string) {
    tracker
      .loadGameData(version)
      .then(() => {
        let opcodes = tracker.db.getOpcodes();
        logic.setOpcode(opcodes);
        logic.init(overlayToolkit);
        logic.init(replay);
        console.log("Game data loaded for version:", version, opcodes);
      })
      .catch((e) => {
        message = {
          title: "游戏数据加载失败",
          content: `当前版本 (${version}) 数据加载失败。` + e.toString(),
          type: "error",
        };
        console.error("Failed to load game data:", e);
      });
  }
</script>

<div class="debug-tool">
  <div>
    <h2>钓鱼悬浮窗</h2>
    <p>
      在ACT中添加此悬浮窗后开始使用。<br />请参考<a
        href="/help.html"
        target="_blank">帮助页面</a
      >了解详细的安装步骤。
    </p>
  </div>
  <div>
    <label for="file">导入数据包（调试）</label>
    <select
      id="version-select"
      onchange={(e) => loadGameData((e.target as HTMLSelectElement).value)}
    >
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
</div>
<Notice {message} />
{#if showConfig || tracker.config.ShowSettingBtn}
  <button class="setting-btn" onclick={toggleConfig}>⚙</button>
{/if}
{#if showConfig}
  <Setting config={tracker.config} />
{/if}
<Timer {tracker} onclick={toggleConfig} />

<style>
  :global([data-prod="true"]) .debug-tool {
    display: none;
  }

  .setting-btn {
    position: absolute;
    left: -10px;
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
