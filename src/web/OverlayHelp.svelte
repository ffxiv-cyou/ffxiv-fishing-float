<script lang="ts">
  import FeedbackLink from "@/components/FeedbackLink.svelte";
  import { A, Heading, P } from "flowbite-svelte";
</script>

<div class="p-4 max-w-3xl mx-auto">
  <Heading tag="h1" class="text-2xl">使用说明</Heading>
  <P
    >欢迎！如果你想要上报数据，或者只是简单的使用这个悬浮窗插件，这里有一些说明。</P
  >
  <Heading tag="h2" class="text-xl">安装悬浮窗插件</Heading>
  <P>
    本悬浮窗插件依赖于
    <A href="https://github.com/Lotlab/ffxiv-overlay-toolkit" target="_blank">
      overlay-toolkit
    </A> 提供的获取网络数据包的功能。
  </P>
  <P>
    请<A
      href="https://github.com/Lotlab/ffxiv-overlay-toolkit/releases"
      target="_blank"
      >访问此处下载 OverlayToolkit
    </A>，并在 ACT 中加载此插件。加载完毕后，需要重启 ACT 才可使用。
  </P>
  <P>
    点击 ACT 中的 “插件” - “ngld悬浮窗插件” - “新建”（左下角）添加悬浮窗。
    在弹出的窗口中随意填写名称，预设选择自订，类型选择数据统计，点击确定添加一个新的悬浮窗。
    然后在右侧的悬浮窗路径中，填写 https://fisher.ffxiv.cyou/
    ，然后点击重载悬浮窗即可。
  </P>
  <Heading tag="h2" class="text-xl">常见问题</Heading>
  <Heading tag="h3" class="text-lg">提示: 悬浮窗插件连接失败</Heading>
  <P>
    请检查 overlay-toolkit
    插件是否正确安装并启用。如果问题仍然存在，请尝试重新启动 ACT。
  </P>
  <Heading tag="h3" class="text-lg">为什么我的鱼饵提示未知</Heading>
  <P>
    可能是先登录了游戏再启动悬浮窗插件，导致数据未能正确加载。切换一次鱼饵应该就能解决。
  </P>
  <Heading tag="h2" class="text-xl">问题反馈</Heading>
  <P>
    【WPS表单】邀你填写「<FeedbackLink />」
  </P>
</div>
