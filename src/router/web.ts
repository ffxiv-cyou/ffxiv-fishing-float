import Help from "@/web/OverlayHelp.svelte";
import type { NavTree, RouteConfig } from "./define";

import Main from "@/web/Main.svelte";
import Privacy from "@/web/Privacy.svelte";
import SpotInfo from "@/web/SpotInfo.svelte";
import FAQ from "@/web/FAQ.svelte";
import Methodology from "@/web/Methodology.svelte";
import NoteExport from "@/web/NoteExport.svelte";

export const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "主页",
    component: Main
  },
  {
    path: "/info/:spot/:bait",
    name: "钓场信息",
    component: SpotInfo
  },
  {
    path: "/help/privacy",
    name: "隐私政策",
    component: Privacy
  },
  {
    path: "/help/overlay",
    name: "使用说明",
    component: Help
  },
  {
    path: "/help/faq",
    name: "常见问题",
    component: FAQ
  },
  {
    path: "/help/methodology",
    name: "统计口径",
    component: Methodology
  },
  {
    path: "/export/:data",
    name: "导出钓鱼笔记",
    component: NoteExport,
  }
];

export const navTree: NavTree[] = [
  {
    name: "主页",
    path: "/"
  },
  {
    name: "钓场信息",
    path: "/info",
  },
  {
    name: "帮助",
    children: [
      {
        name: "统计口径",
        path: "/help/methodology"
      },
      {
        name: "常见问题",
        path: "/help/faq"
      },
      {
        name: "安装悬浮窗",
        path: "/help/overlay"
      },
      {
        name: "隐私政策",
        path: "/help/privacy"
      }
    ]
  }
];