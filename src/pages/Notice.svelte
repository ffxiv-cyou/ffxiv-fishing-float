<script lang="ts">
let {
  title,
  content,
  type,
}: {
  title: string;
  content: string;
  type: "info" | "warning" | "error";
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
</script>

<div class="notice">
  <h2 class={["xiv-text", getColor(type)]}>{title}</h2>
  <p class="xiv-text blue">{content}</p>
  <p class="xiv-text blue">
    <a href="/help.html" target="_blank">点击这里获取帮助</a>
  </p>
</div>

<style>
  .notice {
    border-radius: 8px;
    margin: 1em 0;
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
</style>