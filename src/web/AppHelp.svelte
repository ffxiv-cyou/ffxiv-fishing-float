<script lang="ts">
  import FeedbackLink from "@/components/FeedbackLink.svelte";
  import {
    A,
    Heading,
    P,
    Accordion,
    AccordionItem,
    Alert,
    List,
    Li,
    Checkbox,
  } from "flowbite-svelte";
</script>

<div class="p-4 max-w-3xl mx-auto">
  <Heading tag="h1" class="text-2xl">使用说明</Heading>
  <Alert>
    桌面版仅提供给不想使用 ACT 的用户，其功能与<A href="#/help/overlay"
      >悬浮窗版</A
    >没有区别。<br />
    对于 ACT 用户，建议使用悬浮窗版本。
  </Alert>
  <Heading tag="h2" class="text-xl">下载桌面版</Heading>
  <P>
    请访问 <A
      href="https://github.com/ffxiv-cyou/ffxiv-fishing-float-app/releases"
      target="_blank"
    >
      Github
    </A>
    下载。下载完成后，解压缩文件直接运行即可。
  </P>
  <Heading tag="h2" class="text-xl">安装依赖</Heading>
  <P>
    首次启动会弹出依赖检查页面，如果有未安装的依赖项，可以按照下面的步骤安装。
  </P>
  <Accordion>
    <AccordionItem>
      {#snippet header()}安装 Webview2{/snippet}
      <P>桌面版使用了微软的 Webview2 组件来加载网页。</P>
      <P
        >Window 10 及以后的系统都内置了 Webview2
        组件，大部分情况下无需手动安装。</P
      >
      <P>
        若系统真的没有安装此组件，请
        <A
          href="https://go.microsoft.com/fwlink/p/?LinkId=2124703"
          target="_blank"
        >
          点击这里下载 Webview2
        </A>
        ，下载完毕后直接双击安装即可。
      </P>
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}安装 Npcap{/snippet}
      <P>桌面版也依赖 Npcap 来获取网络数据包。</P>
      <P>
        请访问 <A href="https://npcap.com/dist/" target="_blank">Npcap 官网</A> 下载
        Npcap（选择 Npcap 1.XX installer）。
      </P>
      <Alert>
        Win11 下有用户反馈安装 Npcap 1.81
        之后的版本会无法正常使用。若遇到类似情况，请尝试安装 Npcap 1.80。
      </Alert>
      <P>安装过程中请保持默认安装选项不动：</P>
      <ul>
        <Li
          ><Checkbox disabled /> Restrict Npcap driver to administrators only</Li
        >
        <Li
          ><Checkbox disabled /> Support raw 802.11 traffic (and monitor mode) for
          wireless adapters</Li
        >
        <Li
          ><Checkbox disabled checked /> Install Npcap in WinPcap API-compatible
          Mode</Li
        >
      </ul>
    </AccordionItem>
  </Accordion>
  <Heading tag="h2" class="text-xl">使用方法</Heading>
  <P>安装好依赖后，直接运行即可开始使用。</P>
  <P
    >首次使用时，会弹出位置调整窗口。请移动窗口到合适的位置后，右键选择锁定窗口即可开始使用。</P
  >
  <Alert color="blue">
    由于抓包方式的限制，若不启用内存读取功能，您需要先启动软件，再从游戏大厅进入游戏。<br
    />
    游戏中途的网络波动可能会导致数据捕获失败无法恢复，请小退游戏重新进入。
  </Alert>
  <P>右键点击托盘图标可以弹出菜单</P>
  <List tag="ul">
    <Li>悬浮窗设置：打开悬浮窗设置的界面</Li>
    <Li>历史记录：查看钓场的历史数据</Li>
    <Li>导出钓鱼笔记：将钓鱼数据导出为文件</Li>
    <Li
      >窗口锁定/穿透：解锁后可以调整窗口位置和大小，锁定后将不会响应鼠标操作</Li
    >
  </List>
  <Heading tag="h3" class="text-lg">内存读取模式</Heading>
  <P>版本 0.9.0 起新增了实验性的内存读取功能。</P>
  <Alert color="blue">
    当前内存读取功能属于实验性质。在使用过程中遇到任何问题，请提交反馈。
  </Alert>
  <P
    >在启用内存读取功能后，可以先从游戏大厅进入游戏，再启动软件。网络波动后，软件一般也能够自动恢复而不需要小退游戏。</P
  >
  <Alert color="green">
    内存读取模式旨在提供与ACT注入模式一致的用户体验，但其并不会修改任何游戏数据。
    <br />
    具体实现原理与“渔人的直感”软件一致，只读取游戏内存中的信息而不对游戏本身做修改。
  </Alert>
  <Heading tag="h2" class="text-xl">常见问题</Heading>
  <Heading tag="h3" class="text-lg">提示: 悬浮窗插件连接失败</Heading>
  <P>请右键点击托盘图标，选择“刷新”。如果问题依旧，请尝试重启软件。</P>
  <Heading tag="h3" class="text-lg"
    >为什么我一开始能认到钓鱼事件，一会之后就认不到了？</Heading
  >
  <P>
    可能是中途网络波动了，请小退游戏重新进入。由于抓包方式的限制，如果不启用内存读取模式，则无法在游戏中途恢复数据捕获。
  </P>
  <P>
    如果经常遇到这种情况，可以启用内存读取模式或是使用ACT的悬浮窗版本，这两种方式不受网络波动影响。
  </P>
  <Heading tag="h2" class="text-xl">问题反馈</Heading>
  <P>
    【WPS表单】邀你填写「<FeedbackLink />」
  </P>
</div>
