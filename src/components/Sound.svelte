<script lang="ts">
  import type { TugType } from "../model/InnerEnums";

  let {
    sound,
    volume
  }: {
    sound: string;
    volume?: number;
  } = $props();

  let sounds: HTMLAudioElement[] = $state([]);
  let srcs = $derived.by(() => {
    let sources: string[] = [];
    if (sound === "intuition") {
      sources = [
        "/assets/light.ogg",
        "/assets/medium.ogg",
        "/assets/heavy.ogg",
      ];
    } else if (sound === "pastry") {
      sources = [
        "/assets/pastry_light.ogg",
        "/assets/pastry_medium.ogg",
        "/assets/pastry_heavy.ogg",
      ];
    }
    return sources;
  });

  export function play(type: TugType) {
    if (sound === "") {
      return;
    }
    sounds[type].volume = (volume ?? 100) / 100;
    sounds[type]?.play();
  }
</script>

<div>
  {#each srcs as src, index}
    <audio {src} bind:this={sounds[index]} preload="auto" hidden></audio>
  {/each}
</div>
