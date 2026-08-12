<script lang="ts">
  let {
    value,
    max,
    colorFront = "var(--color-secondary-500)",
    colorBack = "var(--color-secondary-100)",
    class: className = "",
    percent,
  }: {
    value: number;
    max?: number;
    percent?: number;
    colorFront?: string;
    colorBack?: string;
    class?: string;
  } = $props();

  let percentage = $derived.by(() => {
    if (percent !== undefined) return percent * 100;

    if (!max) return 0;
    return (value / max) * 100;
  });

  let countLabel = $derived.by(() => {
    if (max) return `${value}/${max}`;
    else return `${value}`;
  });
</script>

<div
  class="gauge {className}"
  style="--percent: {percentage}; --color-front: {colorFront}; --color-back: {colorBack};"
>
  <div class="percentage"></div>
  <div class="mask"></div>
  <div class="value text-sm">
    <div class="primary">{percentage.toFixed(1)}%</div>
    <div class="text-xs text-gray-500">{countLabel}</div>
  </div>
</div>

<style>
  .gauge {
    position: relative;
    display: inline-block;
    background-color: var(--color-back);
    border-radius: 100% 100% 100% 100%;
    overflow: hidden;
  }

  .gauge .mask {
    position: absolute;
    --circle-size: 20%;
    left: var(--circle-size);
    right: var(--circle-size);
    bottom: var(--circle-size);
    top: var(--circle-size);
    background-color: var(--color-white);
    border-radius: 100% 100% 100% 100%;
  }

  .gauge.small .mask {
    --circle-size: 10%;
  }

  .gauge .percentage {
    position: absolute;
    top: -1px;
    left: -1px;
    bottom: 0;
    right: -1px;
    --deg: calc(var(--percent) * 1%);
    background: conic-gradient(
      var(--color-front) 0 var(--deg),
      transparent var(--deg) 100%
    );
    transition-duration: 600ms;
  }
  .gauge .value {
    position: absolute;
    bottom: 50%;
    transform: translateY(50%);
    left: 0;
    width: 100%;
    text-align: center;
  }

  .gauge .value .primary {
    margin-bottom: -4px;
  }
</style>
