<script lang="ts">
  /**
   * 悬浮窗更新日志弹窗，样式对齐 Notice.svelte（透明底 + xiv-text）。
   * - 无操作 N 秒后自动关闭
   * - 父组件在开始钓鱼（tracker 的 start/begin 事件）时直接关闭本弹窗
   */
  let {
    html,
    autoCloseSec = 10,
    onclose,
  }: {
    html: string;
    autoCloseSec?: number;
    onclose: () => void;
  } = $props();

  let remaining = $state(autoCloseSec);

  $effect(() => {
    if (remaining <= 0) {
      onclose();
      return;
    }
    const id = setTimeout(() => {
      remaining -= 1;
    }, 1000);
    return () => clearTimeout(id);
  });

</script>

<div class="notice">
  <h2 class="xiv-text green">更新日志</h2>
  <div class="head-right">
    <span class="xiv-text green count">{remaining}s</span>
    <button
      class="xiv-text close green"
      aria-label="关闭更新日志"
      onclick={onclose}>&times;</button
    >
  </div>
  <div class="xiv-text blue body">{@html html}</div>
</div>

<style>
  .notice {
    border-radius: 8px;
    margin: 1em 0;
    position: relative;
  }

  .notice h2 {
    margin-top: 0;
    margin-bottom: 0.5em;
    font-size: 1em;
  }

  .head-right {
    position: absolute;
    top: 0;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .notice .close {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    padding: 0;
  }
  .count {
    font-size: 0.8em;
  }

  .notice .body {
    font-size: 0.9em;
    max-height: 40vh;
    overflow-y: auto;
  }
  .body :global(h1),
  .body :global(h2),
  .body :global(h3),
  .body :global(h4) {
    font-size: 1em;
    margin: 0.4em 0 0.2em;
  }
  .body :global(p) {
    margin: 0.3em 0;
  }
  .body :global(ul) {
    margin: 0.3em 0;
    padding-left: 1.4em;
  }
  .body :global(li) {
    margin: 0.15em 0;
  }
  .body :global(a) {
    margin-right: 0;
  }
  .body :global(code) {
    background: #ffffff22;
    border-radius: 4px;
    padding: 0 4px;
  }
  .body :global(hr) {
    border: none;
    border-top: 1px solid #ffffff2e;
    margin: 0.5em 0;
  }
</style>
