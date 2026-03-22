<script lang="ts">
  import uPlot from "uplot";
  import "uplot/dist/uPlot.min.css";
  import { onDestroy, onMount } from "svelte";

  export type AlignedData = uPlot.AlignedData;
  export type Options = uPlot.Options;

  let {
    options,
    data,
    target,
    onDelete,
    onCreate,
    resetScales = true,
    className,
  }: {
    options: Options;
    data: AlignedData;
    target?: HTMLElement;
    onDelete?: (chart: uPlot) => void;
    onCreate?: (chart: uPlot) => void;
    resetScales?: boolean;
    className?: string;
  } = $props();

  let chart: uPlot | null = $state(null);
  let div: HTMLDivElement | undefined = $state(undefined);

  function optionsUpdateState(_lhs: uPlot.Options, _rhs: uPlot.Options) {
    const { width: lhsWidth, height: lhsHeight, ...lhs } = _lhs;
    const { width: rhsWidth, height: rhsHeight, ...rhs } = _rhs;

    let state = "keep";
    if (lhsHeight !== rhsHeight || lhsWidth !== rhsWidth) {
      state = "update";
    }
    if (Object.keys(lhs).length !== Object.keys(rhs).length) {
      return "create";
    }
    for (const k of Object.keys(lhs)) {
      if (!Object.is((lhs as any)[k], (rhs as any)[k])) {
        state = "create";
        break;
      }
    }
    return state;
  }

  function destroy() {
    if (chart) {
      onDelete?.(chart);
      chart.destroy();
      chart = null;
    }
  }

  function create() {
    if (!target && !div) {
      typeof requestAnimationFrame !== "undefined" &&
        requestAnimationFrame(() => create());
      return;
    }
    if (!chart) {
      chart = new uPlot(options, data, target || div);
      onCreate?.(chart);
    }
  }

  onMount(async () => {
    create();
  });

  onDestroy(() => {
    destroy();
  });

  let prevOptions = { ...options };

  $effect(() => {
    if (options) {
      const state = optionsUpdateState(prevOptions, options);
      prevOptions = { ...options };
      if (state === "create") {
        destroy();
        create();
      } else if (state === "update" && chart) {
        chart.setSize({
          width: options.width,
          height: options.height,
        });
      }
    }
  });

  $effect(() => {
    if (target) {
      destroy();
      create();
      console.log("Target changed, recreated chart");
    }
  });

  $effect(() => {
    if (!chart) {
      create();
    } else if (resetScales) {
      chart.setData(data, true);
    } else {
      chart.setData(data, false);
      chart.redraw();
    }
  });
</script>

{#if !target}
  <div bind:this={div} class={className ? className + " relative" : "relative"}></div>
{/if}
