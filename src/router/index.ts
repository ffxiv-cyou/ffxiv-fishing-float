import Main from "@/pages/Main.svelte";
import SettingPage from "@/pages/SettingPage.svelte";

import type { RouteConfig } from "./define";

export const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "主页",
    component: Main
  },
  {
    path: "/setting",
    name: "设置",
    component: SettingPage
  },
];