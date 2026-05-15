<script lang="ts">
  import { TugType } from "@/model/InnerEnums";
  import Timer from "../components/Timer.svelte";
  import type { Config } from "../model/Config";
  import type { GameDatabase } from "../model/GameDB";

  let { config, db }: { config: Config; db: GameDatabase } = $props();
  const demoData = [
    {
      zone: 426,
      fish: 4932,
      bait: 2588,
      minBiteTime: 8.9,
      maxBiteTime: 13.6,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 8.4,
      maxBiteTime: 17.4,
      fish: 4942,
      bait: 2592,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 11.4,
      maxBiteTime: 18.2,
      fish: 4945,
      bait: 2592,
      tugType: TugType.Medium,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 10.3,
      maxBiteTime: 16.7,
      fish: 4951,
      bait: 2594,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 12.2,
      maxBiteTime: 19.3,
      fish: 4963,
      bait: 4927,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 16.5,
      maxBiteTime: 20.9,
      fish: 4968,
      bait: 2595,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 14,
      maxBiteTime: 21.6,
      fish: 4973,
      bait: 2597,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 15.3,
      maxBiteTime: 25.6,
      fish: 4975,
      bait: 4942,
      tugType: TugType.Light,
      chum: false,
      count: 10,
    },
    {
      zone: 426,
      minBiteTime: 19.3,
      maxBiteTime: 31.4,
      fish: 7923,
      bait: 4942,
      tugType: TugType.Heavy,
      chum: false,
      count: 10,
    },
  ];
</script>

<Timer
  {config}
  {db}
  zone={426}
  bait={29717}
  chum={false}
  tug={null}
  result={null}
  now={12.3}
  lureRest={14.5}
  total={30.0}
  highlight={[]}
  downplay={[4942, 4963]}
  historyStats={demoData}
/>
