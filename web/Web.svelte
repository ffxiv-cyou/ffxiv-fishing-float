<script lang="ts">
  import "./web.css";

  import { navTree, routes } from "../src/router/web";
  import Page from "../src/components/page.svelte";
  import { FishingTracker } from "../src/model/FishingTracker";

  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
    ThemeProvider,
    type ThemeConfig,
    Dropdown,
    DropdownItem,
  } from "flowbite-svelte";
  import ChevronDownOutline from "../src/components/icon/ChevronDownOutline.svelte";

  let url = $state("");
  function handleHashChange() {
    url = location.hash.replace("#", "");
    if (url === "") url = "/";
  }
  addEventListener("hashchange", handleHashChange);
  handleHashChange();

  let tracker = new FishingTracker();
  tracker.db.loadLatest().then(() => {
    console.log("FishingTracker loaded");
  });

  let theme: ThemeConfig = {
    accordionItem: {
      base: "mt-0! mb-0!",
    },
    toggle: {
      span: "peer-focus:ring-green-600 peer-checked:bg-green-500",
    },
    heading: "color-gray-900 dark:text-white text-xl py-1",
    paragraph: "text-gray-700 dark:text-gray-300 my-2",
    anchor: "hover:underline",
    navbar:
      "border-gray-200 py-0 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700",
    navbarUl: {
      ul: "flex flex-col md:p-2 xl:p-4 md:flex-row md:text-sm md:font-medium",
    },
    tabItem: {
      button: "px-4 py-2",
    },
    tableBodyCell: "px-4 py-2 whitespace-nowrap text-gray-900 dark:text-white",
    tableHeadCell:
      "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400",
    tableBodyRow:
      "bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
  };
</script>

<ThemeProvider {theme}>
  <main class="web-layout">
    <Navbar fluid={true}>
      <NavBrand href="#/">
        <span
          class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
          >杆时统计</span
        >
      </NavBrand>
      <NavHamburger />
      <NavUl activeUrl={"#" + url}>
        {#each navTree as route}
          <NavLi
            href={route.path ? "#" + route.path : undefined}
            class={route.children ? "cursor-pointer" : ""}
          >
            {route.name}
            {#if route.children}
              <ChevronDownOutline
                class="text-primary-800 inline h-5 w-5 dark:text-white"
              />
            {/if}
          </NavLi>
          {#if route.children}
            <Dropdown simple>
              {#each route.children as subRoute}
                <DropdownItem href={"#" + subRoute.path} class="pl-4">
                  {subRoute.name}
                </DropdownItem>
              {/each}
            </Dropdown>
          {/if}
        {/each}
      </NavUl>
    </Navbar>

    <div class="web-content">
      {#each routes as route}
        <Page
          path={route.path}
          title={route.name}
          {url}
          component={route.component}
          {tracker}
        />
      {/each}
    </div>
  </main>
</ThemeProvider>

<style>
  .web-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .web-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
</style>
