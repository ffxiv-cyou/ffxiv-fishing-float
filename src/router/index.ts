import History from "@/pages/History.svelte";
import Main from "@/pages/Main.svelte";
import SettingPage from "@/pages/SettingPage.svelte";

export interface RouteConfig {
  path: string;
  name: string;
  component: any;
}

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
  {
    path: "/history/:spot/:bait",
    name: "钓鱼记录",
    component: History
  }
];