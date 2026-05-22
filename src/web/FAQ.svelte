<script lang="ts">
  import FeedbackLink from "@/components/FeedbackLink.svelte";
  import { Heading, Li, List, P } from "flowbite-svelte";
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
  <Heading tag="h3" class="text-lg">为什么统计数据的数量似乎对不上？</Heading>
  <P>
    为了最大化利用统计数据，不同类型的统计数据口径可能会不一致。
  </P>
  <List tag="ul">
    <Li>尺寸数据：统计所有钓上来的鱼；</Li>
    <Li>杆时数据：排除掉在雄心/谦逊技能空窗期立刻结束后钓上来的鱼；</Li>
    <Li>咬钩率：根据杆种和杆时推测对应的咬钩的鱼，除以抛竿次数得到的结果；</Li>
    <Li>脱钩率：根据杆种和杆时推测对应的咬钩的鱼，用脱钩次数除以咬钩次数得到结果（不含获得力不足导致的脱钩）；</Li>
    <Li>脱钩次数：按杆种统计脱钩和咬钩次数（含获得力不足导致的脱钩）；</Li>
  </List>
  <Heading tag="h3" class="text-lg"
    >我觉得某个鱼的数据有问题，该怎么办？</Heading
  >
  <P>
    请填写「<FeedbackLink />」，我们会第一时间查看并处理。
  </P>
</div>
