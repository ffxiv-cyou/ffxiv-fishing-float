<script lang="ts">
  import SiteStats from "@/components/spot/SiteStats.svelte";
  import type { FishingTracker } from "@/model/FishingTracker";
  import { A, Heading, Button, P, Hr } from "flowbite-svelte";

  let {
    tracker,
  }: {
    tracker: FishingTracker;
  } = $props();
</script>

<div class="text-center">
  <Heading tag="h1" class="my-4 text-3xl">欢迎使用 FFXIV 杆时统计服务</Heading>
  <P
    class="my-8 text-center text-lg sm:px-16 lg:text-xl xl:px-48 dark:text-gray-400"
    >点击下方按钮开始使用</P
  >
  <Button href="#/info">查看统计数据</Button>
  <Button href="#/help/overlay" color="secondary">安装悬浮窗</Button>
  <Hr />
  <P class="text-center my-4 text-xl">看看大家最近在钓什么鱼</P>
  <P class="text-center my-2 text-sm text-gray-500"
    >（展示过去24小时的数据，每10分钟更新一次）</P
  >
  <SiteStats {tracker} />
</div>

<style>
</style>
