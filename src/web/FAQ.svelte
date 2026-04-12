<script lang="ts">
  import FeedbackLink from "@/components/FeedbackLink.svelte";
  import { Heading, P } from "flowbite-svelte";
</script>

<div class="p-4 max-w-3xl mx-auto">
  <Heading tag="h1" class="text-2xl">常见问题</Heading>
  <Heading tag="h3" class="text-lg">为什么有的钓场显示没有数据？</Heading>
  <P>
    本站数据依赖于使用悬浮窗插件的用户上报，如果一个钓场没有数据，可能是因为没有用户上报过该钓场的数据。
  </P>
  <P>
    安装完悬浮窗插件后，只要在游戏内钓起对应的鱼，悬浮窗插件就会自动上报数据了。
  </P>
  <Heading tag="h3" class="text-lg"
    >为什么我在某个钓场钓上鱼后，还是没有数据？</Heading
  >
  <P>
    为了降低服务器负载，钓场数据上报和聚合有一定延迟，请在钓上鱼后等待5-10分钟再刷新页面查看数据。
  </P>
  <P>
    杆时聚合需要更多的数据才会更准确。只有当特定的鱼钓上超过10条时，才会在杆时分布中显示该鱼的数据。
  </P>
  <Heading tag="h3" class="text-lg"
    >我觉得某个鱼的数据有问题，该怎么办？</Heading
  >
  <P>
    请填写「<FeedbackLink />」，我们会第一时间查看并处理。
  </P>
</div>
