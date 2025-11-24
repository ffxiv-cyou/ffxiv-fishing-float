<script lang="ts">
  import { FishingFloat } from "./model/FishingFloat";
  import defaultOpcode from "./lib/opcode.json";

  let logic = new FishingFloat();
  logic.setOpcode(defaultOpcode);
  console.log("FishingFloat logic initialized:", logic.genPacketFilter());
  logic.init();
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
