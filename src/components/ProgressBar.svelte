<script lang="ts">
  import type { Config } from "@/model/Config";

  let {
    value,
    total,
    hint,
    color = "#23456780",
    theme = "default",
    align = undefined,
    inline = false,
  }: {
    config: Config;
    value: number;
    total: number;
    hint: string;
    color?: string;
    theme?: "minimal" | "default" | "box";
    align?: "left" | "center" | "right";
    inline?: boolean;
  } = $props();

  let remainText = $derived.by(() => {
    if (value === 0) return "";
    return value.toFixed(1) + "s";
  });

  let styleStr = $derived.by(() => {
    let str = "";
    str += `--now-time:${value};`;
    str += `--total-time:${total};`;
    str += `--color:${color};`;
    return str;
  });
</script>

<div
  class="progress-bar"
  data-style={theme}
  data-align={align}
  data-inline={inline ? "true" : "false"}
>
  <div class="bkg-bar" style={styleStr}></div>
  {#if remainText}
    <span class="xiv-text blue hint-text">{hint}</span>
    <span class="xiv-text blue remain-text">{remainText}</span>
  {/if}
</div>

<style>
  [data-inline="true"].progress-bar {
    display: inline-block;
  }
  [data-inline="false"].progress-bar {
    position: relative;
  }

  [data-align="left"].progress-bar {
    text-align: left;
    padding-left: 4px;
  }
  [data-align="center"].progress-bar {
    text-align: center;
  }
  [data-align="right"].progress-bar {
    text-align: right;
    padding-right: 4px;
  }

  [data-style="minimal"] .bkg-bar,
  [data-style="box"] .bkg-bar {
    position: absolute;
    --width: calc(100% * var(--now-time) / var(--total-time));
    width: var(--width);
    background-color: var(--color);
    z-index: -1;
  }

  [data-style="minimal"] .bkg-bar {
    top: 2px;
    height: 16px;
    border-radius: 10px;
  }

  [data-style="box"] .bkg-bar {
    height: 20px;
  }

  [data-align="left"] .bkg-bar {
    left: 0;
  }
  [data-align="right"] .bkg-bar {
    right: 0;
  }
  [data-align="center"] .bkg-bar {
    left: calc(50% - var(--width) / 2);
    right: calc(50% - var(--width) / 2);
  }

  [data-style="default"] .bkg-bar {
    display: none;
  }

  [data-style="minimal"] .hint-text {
    display: none;
  }

  [data-style="minimal"] .remain-text {
    font-size: 12px;
    line-height: 20px;
    padding: 0 5px;
  }
</style>
