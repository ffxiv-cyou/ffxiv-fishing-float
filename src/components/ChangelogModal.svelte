<script lang="ts">
  import { Modal, Button } from "flowbite-svelte";

  /**
   * 网页版更新日志弹窗（flowbite 风格）。
   * 数据与已读标记由父组件负责，本组件只负责展示。
   */
  let {
    open = $bindable(false),
    html,
    onclose,
  }: {
    open?: boolean;
    html: string;
    onclose: () => void;
  } = $props();

  let wasOpen = false;
  $effect(() => {
    if (wasOpen && !open) {
      onclose();
    }
    wasOpen = open;
  });

  function dismiss() {
    open = false;
  }
</script>

<Modal title="更新日志" bind:open>
  <div class="changelog-modal">{@html html}</div>
  {#snippet footer()}
    <Button href="#/changelog" onclick={dismiss}>查看完整日志</Button>
    <Button color="alternative" onclick={dismiss}>知道了</Button>
  {/snippet}
</Modal>

<style>
  .changelog-modal :global(h1) {
    font-size: 1.25rem;
    margin: 0.5em 0;
  }
  .changelog-modal :global(h2) {
    font-size: 1.1rem;
    margin: 0.6em 0 0.3em;
  }
  .changelog-modal :global(h3),
  .changelog-modal :global(h4) {
    font-size: 1rem;
    margin: 0.5em 0 0.25em;
  }
  .changelog-modal :global(p) {
    margin: 0.4em 0;
  }
  .changelog-modal :global(ul) {
    list-style: disc;
    margin: 0.4em 0;
    padding-left: 1.5em;
  }
  .changelog-modal :global(li) {
    margin: 0.2em 0;
  }
  .changelog-modal :global(hr) {
    margin: 0.6em 0;
  }
</style>
