<script lang="ts">
  import Sound from "../components/Sound.svelte";
  import Timer from "../components/Timer.svelte";
  import { Config } from "../model/Config";
  import { GameDatabase } from "../model/GameDB";
  import { TugType } from "../model/InnerEnums";

  let config = new Config();
  let sound: Sound;
  let db = new GameDatabase();
  db.load("2025.12.23.0000.0000");

  const demoData = [
    {
      zone: 426,
      fish: 4932,
      bait: 2588,
      minBiteTime: 8.9,
      maxBiteTime: 13.6,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 8.4,
      maxBiteTime: 17.4,
      fish: 4942,
      bait: 2592,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 11.4,
      maxBiteTime: 18.2,
      fish: 4945,
      bait: 2592,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 10.3,
      maxBiteTime: 16.7,
      fish: 4951,
      bait: 2594,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 12.2,
      maxBiteTime: 19.3,
      fish: 4963,
      bait: 4927,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 16.5,
      maxBiteTime: 20.9,
      fish: 4968,
      bait: 2595,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 14,
      maxBiteTime: 21.6,
      fish: 4973,
      bait: 2597,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 15.3,
      maxBiteTime: 25.6,
      fish: 4975,
      bait: 4942,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 19.3,
      maxBiteTime: 31.4,
      fish: 7923,
      bait: 4942,
      tugType: TugType.Heavy,
      chum: false,
      count: 10,
    },
  ];
  function testSound(type: TugType) {
    sound.play(type);
  }
</script>

<main>
  <h1>设置页面</h1>
  <div class="setting-page">
    <h2>样式设置</h2>
    <div class="setting-item">
      <span class="setting-name">样式</span>
      <input
        type="radio"
        name="theme"
        value="default"
        id="theme-default"
        bind:group={config.Theme}
      />
      <label for="theme-default">默认</label>
      <input
        type="radio"
        name="theme"
        value="minimal"
        id="theme-minimal"
        bind:group={config.Theme}
      />
      <label for="theme-minimal">极简（渔人的直感）</label>
    </div>
    {#if config.Theme === "default"}
      <div class="setting-item">
        <span class="setting-name">显示组件</span>
        <input type="checkbox" id="show-zone" bind:checked={config.ShowZone} />
        <label for="show-zone">钓场</label>
        <input type="checkbox" id="show-bait" bind:checked={config.ShowBait} />
        <label for="show-bait">鱼饵</label>
        <input
          type="checkbox"
          id="show-catch"
          bind:checked={config.ShowCatch}
        />
        <label for="show-catch">渔获</label>
      </div>
    {/if}
    {#if config.Theme === "minimal"}
      <div class="setting-item">
        <span class="setting-name">颜色</span>
        <label for="color-idle">抛竿</label>
        <input type="color" id="color-idle" bind:value={config.IdleColor} />
        <label for="color-tug-light">轻杆</label>
        <input
          type="color"
          id="color-tug-light"
          bind:value={config.TugLightColor}
        />
        <label for="color-tug-medium">中杆</label>
        <input
          type="color"
          id="color-tug-medium"
          bind:value={config.TugMediumColor}
        />
        <label for="color-tug-heavy">重杆</label>
        <input
          type="color"
          id="color-tug-heavy"
          bind:value={config.TugHeavyColor}
        />
      </div>
    {/if}
    <div class="setting-item">
      <span class="setting-name">设置入口</span>
      <input
        type="radio"
        name="setting-btn"
        value={true}
        id="setting-btn-button"
        bind:group={config.ShowSettingBtn}
      />
      <label for="setting-btn-button">按钮</label>
      <input
        type="radio"
        name="setting-btn"
        value={false}
        id="setting-btn-double-click"
        bind:group={config.ShowSettingBtn}
      />
      <label for="setting-btn-double-click">双击进度条</label>
      <span class="setting-desc"
        >禁用按钮设置入口后，你可能需要抛竿后才能再次进入设置页面</span
      >
    </div>
    <h2>历史统计</h2>
    <div class="setting-item">
      <span class="setting-name">历史统计</span>
      <input
        type="checkbox"
        id="show-stats"
        bind:checked={config.ShowHistory}
      />
      <label for="show-stats">显示</label>
    </div>
    <div class="setting-item">
      <span class="setting-name">上报数据</span>
      <input
        type="checkbox"
        id="upload-history"
        bind:checked={config.UploadHistory}
      />
      <label for="upload-history">启用上报</label>
      <span class="setting-desc">启用后，历史统计数据会被匿名上传以帮助其他捕鱼人</span>
    </div>
    <div class="setting-item">
      <span class="setting-name">换算撒饵时间</span>
      <input
        type="checkbox"
        id="merge-chum-time"
        bind:checked={config.MergeChumTime}
      />
      <label for="merge-chum-time">启用</label>
      <span class="setting-desc">启用后，会合并显示撒饵和非撒饵时间</span>
    </div>
    <div class="setting-item">
      <span class="setting-name">雄心/谦逊空窗期</span>
      <input
        type="radio"
        name="empty-window"
        value="off"
        id="empty-window-off"
        bind:group={config.LureEmptyWindowHandling}
      />
      <label for="empty-window-off">关闭</label>
      <input
        type="radio"
        name="empty-window"
        value="label"
        id="empty-window-label"
        bind:group={config.LureEmptyWindowHandling}
      />
      <label for="empty-window-label">显示标记</label>
      <input
        type="radio"
        name="empty-window"
        value="tweak"
        id="empty-window-tweak"
        bind:group={config.LureEmptyWindowHandling}
      />
      <label for="empty-window-tweak">调整历史显示</label>
      <span class="setting-desc">
        "显示标记"会在历史记录上标记什么时间点后才会有鱼上钩<br />
        "调整历史显示"则会临时调整历史杆时的显示
      </span>
    </div>
    <h2>咬钩提醒</h2>
    <div class="setting-item">
      <span class="setting-name">播放音效</span>
      <input
        type="radio"
        name="sound"
        value=""
        id="sound-none"
        bind:group={config.Sound}
      />
      <label for="sound-none">关</label>
      <input
        type="radio"
        name="sound"
        value="intuition"
        id="sound-intuition"
        bind:group={config.Sound}
      />
      <label for="sound-intuition">渔人的直感</label>
      <input
        type="radio"
        name="sound"
        value="pastry"
        id="sound-pastry"
        bind:group={config.Sound}
      />
      <label for="sound-pastry">鱼捞</label>
    </div>
    <div class="setting-item">
      <span class="setting-name">测试</span>
      <div class="test-sound-buttons">
        <button on:click={() => testSound(0)}>轻杆</button>
        <button on:click={() => testSound(1)}>中杆</button>
        <button on:click={() => testSound(2)}>重杆</button>
      </div>
      <Sound bind:this={sound} sound={config.Sound} />
    </div>
  </div>
  <div class="preview">
    <span class="hint">效果预览</span>
    <Timer
      {config}
      {db}
      zone={426}
      bait={29717}
      tug={null}
      result={null}
      now={12.3}
      lureRest={14.5}
      lureType={1}
      total={30.0}
      highlight={[]}
      historyStats={demoData}
    />
  </div>
</main>

<style>
  .setting-page {
    padding: 10px;
    max-width: 600px;
    margin: auto;
    text-align: left;
  }
  .setting-item {
    margin-bottom: 5px;
  }
  .setting-name {
    display: inline-block;
    width: 8em;
    text-align: right;
    margin-right: 5px;

    &:after {
      content: ":";
    }
  }
  .setting-desc {
    font-size: 0.9em;
    line-height: 1.2em;
    color: #666;
    margin-left: 10em;
    display: block;
    margin-top: -2px;
    margin-bottom: 8px;
  }

  .test-sound-buttons {
    display: inline-flex;
    gap: 10px;
  }

  input[type="color"] {
    appearance: none;
    border: none;
    width: 2.5em;
    height: 1em;
    padding: 0;
    display: inline-block;
  }
  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  input[type="color"]::-webkit-color-swatch {
    border: none;
  }

  button {
    padding: 5px 10px;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f0f0f0;
  }

  .preview {
    position: fixed;
    left: 20px;
    bottom: 20px;

    background-color: #000000c0;
    width: 400px;
    height: 240px;
    padding: 20px;
    overflow: hidden;
  }

  .preview .hint {
    position: absolute;
    top: 4px;
    left: 10px;
    color: #ffffff80;
    font-size: 0.8em;
  }

</style>
