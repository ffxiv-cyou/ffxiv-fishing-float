<script lang="ts">
  import type { Config } from "@/model/Config";
  import type { GameDatabase } from "@/model/GameDB";
  import type { IntuitionCounter } from "@/model/IntuitionCounter";

  let {
    db,
    config,
    intuition,
  }: {
    db: GameDatabase;
    config: Config;
    intuition: IntuitionCounter;
  } = $props();

  let show = $derived.by(() => {
    // 不显示未知鱼识状态
    if (!config.ShowUnknownIntuition && !intuition.ConditionKnown) {
      return false;
    }
    return intuition.Count.length > 0;
  });

  function formatThresold(value: number) {
    if (value > 0) return value.toString();
    return "?";
  }

</script>

{#if show}
  <div class="intuition-counter" data-counter-style={config.IntuitionCounter}>
    <div class="padding"></div>
    <ul>
      {#each intuition.Count as item}
        <li class="xiv-text blue">
          {db.getItemName(item.item)}
          {item.Count}/{formatThresold(item.Thresold)}
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .intuition-counter {
    flex: 8em 0;
    font-size: 0.8em;
    text-align: left;

    &[data-counter-style="right"] {
      border-left: 1px solid #808080;
      padding-left: 0.5em;

      & .padding {
        height: 2em;
      }

      & li {
        margin-bottom: 0.5em;
      }
    }

    & ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    &[data-counter-style="bottom"] {
      border-top: 1px solid #808080;
      padding-top: 0.25em;

      & li {
        display: inline-block;
        margin-right: 1em;
      }
    }
  }
</style>
