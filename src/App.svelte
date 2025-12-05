<script lang="ts">
  import { PacketHandler } from "./model/FishingFloat";
  import defaultOpcode from "./lib/opcode.json";
  import { FishingTracker, TugEvent } from "./model/FishingTracker";
    import type { TugType } from "./model/InnerEnums";

  let tracker = new FishingTracker();
  let logic = new PacketHandler(tracker);
  logic.setOpcode(defaultOpcode);
  console.log("FishingFloat logic initialized:", logic.genPacketFilter());
  logic.init();

  tracker.addEventListener("begin", startSession);
  tracker.addEventListener("end", stopSession);
  tracker.addEventListener("tug", (evt) => {
    tug((evt as TugEvent).tugType); 
  });

  function startSession() {

  }

  function stopSession() {
  }

  function stopFishing() {

  }

  function tug(type: TugType) {
    console.log("Fishing tug", type);
  }

</script>

<main>
  <h1>Vite + Svelte</h1>

  <div class="card"></div>

  <p>
    Check out <a
      href="https://github.com/sveltejs/kit#readme"
      target="_blank"
      rel="noreferrer">SvelteKit</a
    >, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
</main>

<style>
  .read-the-docs {
    color: #888;
  }
</style>
