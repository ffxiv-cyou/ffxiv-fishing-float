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
</script>

<div class="debug-tool">
  <div>
    <h2>钓鱼悬浮窗</h2>
    <p>在ACT中添加此悬浮窗后开始使用</p>
    <p>
      <a href="/web/#/help/overlay" target="_blank">安装方法</a> |
      <a href="/web/" target="_blank">查看数据</a>
    </p>
  </div>
  <details>
    <summary>调试工具</summary>
    <div>
      <label for="file">导入数据包: </label>
      <select
        id="version-select"
        onchange={(e) => loadGameData((e.target as HTMLSelectElement).value, true)}
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
  </details>
</div>
<Notice {message} />
{#if showConfig || tracker.config.ShowSettingBtn}
  <button class="round-btn setting-btn" onclick={toggleConfig}>⚙</button>
  <button class="round-btn history-btn" onclick={openHistory}>↗</button>
{/if}
{#if showConfig}
  <Setting config={tracker.config} />
{/if}
<Timer {tracker} onclick={toggleConfig} />

<style>
  :global([data-prod="true"]) .debug-tool {
    display: none;
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

  .setting-btn {
    position: absolute;
    left: -10px;
    top: -16px;
  }
  .history-btn {
    position: absolute;
    left: 10px;
    top: -16px;
  }
</style>
