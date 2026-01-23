<script lang="ts">
  import { Config } from "../model/Config";

  let {
    config,
  }: {
    config: Config;
  } = $props();

  function openSettingPage() {
    window.open("/#/setting", "Settings", "width=800,height=600");
  }
</script>

<div class="setting-page">
  <h2 class="xiv-text brown">样式设置</h2>
  <div class="setting-item">
    <label class="xiv-text" for="theme-select">样式:</label>
    <input
      type="radio"
      name="theme"
      value="default"
      id="theme-default"
      bind:group={config.Theme}
    />
    <label class="xiv-text" for="theme-default">默认</label>
    <input
      type="radio"
      name="theme"
      value="minimal"
      id="theme-minimal"
      bind:group={config.Theme}
    />
    <label class="xiv-text" for="theme-minimal">极简（直感）</label>
  </div>
  {#if config.Theme === "default"}
    <div class="setting-item">
      <span class="xiv-text">组件:</span>
      <input type="checkbox" id="show-zone" bind:checked={config.ShowZone} />
      <label class="xiv-text" for="show-zone">钓场</label>
      <input type="checkbox" id="show-bait" bind:checked={config.ShowBait} />
      <label class="xiv-text" for="show-bait">鱼饵</label>
      <input type="checkbox" id="show-catch" bind:checked={config.ShowCatch} />
      <label class="xiv-text" for="show-catch">渔获</label>
    </div>
  {/if}
  <div class="setting-item">
    <label class="xiv-text" for="setting-btn">设置:</label>
    <input
      type="radio"
      name="setting-btn"
      value={true}
      id="setting-btn-button"
      bind:group={config.ShowSettingBtn}
    />
    <label class="xiv-text" for="setting-btn-button">按钮</label>
    <input
      type="radio"
      name="setting-btn"
      value={false}
      id="setting-btn-double-click"
      bind:group={config.ShowSettingBtn}
    />
    <label class="xiv-text" for="setting-btn-double-click">双击进度条</label>
  </div>
  <div class="setting-item">
    <label class="xiv-text" for="show-stats">历史:</label>
    <input type="checkbox" id="show-stats" bind:checked={config.ShowHistory} />
    <label class="xiv-text" for="show-stats">显示</label>
    <button class="xiv-text blue" aria-label="open window" onclick={openSettingPage}>更多设置</button>
  </div>
  <h2 class="xiv-text brown">音频设置</h2>
  <div class="setting-item">
    <label class="xiv-text" for="enable-sounds">音效: </label>
    <input
      type="radio"
      name="sound"
      value="intuition"
      id="sound-intuition"
      bind:group={config.Sound}
    />
    <label class="xiv-text" for="sound-intuition">直感</label>
    <input
      type="radio"
      name="sound"
      value="pastry"
      id="sound-pastry"
      bind:group={config.Sound}
    />
    <label class="xiv-text" for="sound-pastry">鱼捞</label>
    <input
      type="radio"
      name="sound"
      value=""
      id="sound-none"
      bind:group={config.Sound}
    />
    <label class="xiv-text" for="sound-none">无</label>
  </div>
</div>

<style scoped>
  .setting-page {
    text-align: left;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
  }

  h2 {
    margin: 5px 0;
    font-size: 1rem;
  }

  .setting-item label,
  .setting-item span {
    user-select: none;
    --shadow-color: var(--color-xiv-blue);
  }
</style>
