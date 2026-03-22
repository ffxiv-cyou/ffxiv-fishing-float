<script lang="ts">
  export interface Message {
    title: string;
    content: string;
    type: "info" | "warning" | "error";
  }

  let {
    message,
  }: {
    message?: Message;
  } = $props();

  function getColor(type: string) {
    switch (type) {
      case "info":
        return "blue";
      case "warning":
        return "brown";
      case "error":
        return "red";
      default:
        return "green";
    }
  }

  let msgColor = $derived.by(() => {
    return getColor(message?.type || "info");
  });

  function onClickClose() {
    message = undefined;
  }

  function onClickHelp(evt: MouseEvent) {
    window.open("/web/#/help/overlay", "_blank");
    evt.preventDefault();
  }

  function onClickReload(evt: MouseEvent) {
    location.reload();
    evt.preventDefault();
  }
</script>

{#if message}
  <div class="notice">
    <h2 class={["xiv-text", msgColor]}>{message.title}</h2>
    <button class={["xiv-text", "close", msgColor]} onclick={onClickClose}
      >&times;</button
    >
    <p class="xiv-text blue">{message.content}</p>
    <p class="xiv-text blue">
      <a href="/web/#/help/overlay" target="_blank" onclick={onClickHelp}>查看帮助</a>
      <a href="/" onclick={onClickReload}>重载页面</a>
    </p>
  </div>
{/if}

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

  .notice p {
    margin: 0;
    font-size: 0.9em;
  }
  .notice a {
    color: white;
    text-decoration: underline;
  }
  .notice .close {
    position: absolute;
    top: 0;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
  }
</style>
