<script lang="ts">
  import { Heading } from "flowbite-svelte";

  export interface PreviewFish {
    id: number;
    speed: number;
    sizeClass: number;
  }

  let {
    fishes,
    getName,
  }: {
    fishes: PreviewFish[];
    getName: (id: number) => string;
  } = $props();

  const TRACK_WIDTH = 1000000;

  function durationMs(speed: number): string {
    return `${TRACK_WIDTH / speed}ms`;
  }

  function iconSize(sizeClass: number): number {
    switch (sizeClass) {
      case 1:
        return 22;
      case 3:
        return 48;
      default:
        return 34;
    }
  }

  const SHADOW_SVG = {
    viewBox: "0 0 48 16",
    body: '<ellipse cx="28" cy="8" rx="18" ry="6.5" /><polygon points="12,8 1,1 4.5,8 1,15" />',
  };
</script>

<Heading tag="h2" class="relative text-2xl leading-tight">速度</Heading>
<div class="mt-2">
  {#each fishes as fish}
    <div class="flex items-center gap-2 mb-1.5">
      <span class="w-24 shrink-0 truncate text-sm">{getName(fish.id)}</span>
      <span class="track">
        {#if fish.speed > 0}
          <svg
            class="fish swim"
            style={`width: ${iconSize(fish.sizeClass)}px; animation-duration: ${durationMs(fish.speed)};`}
            viewBox={SHADOW_SVG.viewBox}
            fill="currentColor"
            aria-hidden="true"
          >
            {@html SHADOW_SVG.body}
          </svg>
        {:else}
          <svg
            class="fish fish-unknown"
            style={`width: ${iconSize(fish.sizeClass)}px;`}
            viewBox={SHADOW_SVG.viewBox}
            fill="currentColor"
            aria-hidden="true"
          >
            {@html SHADOW_SVG.body}
          </svg>
        {/if}
      </span>
    </div>
  {/each}
</div>

<style>
  .track {
    position: relative;
    flex: 1;
    height: 2rem;
    background-color: var(--color-gray-100);
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .fish {
    position: absolute;
    top: 50%;
    height: auto;
    transform: translateY(-50%);
    color: rgba(30, 41, 59, 0.85);
  }

  .fish-unknown {
    color: var(--color-gray-300);
  }

  .swim {
    animation-name: spear-swim;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  @keyframes spear-swim {
    from {
      left: -32px;
    }
    to {
      left: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .swim {
      animation: none;
      left: 0;
    }
  }
</style>
