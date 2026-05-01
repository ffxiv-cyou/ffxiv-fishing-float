<script lang="ts">
  import type { Component, Snippet } from "svelte";

  export type RouteParams = {
    [param: string]: string;
  };

  export type RouteProps = {
    path?: string;
    url?: string;
    title?: string;
    component?: Component<any, Record<string, any>>; //| AsyncSvelteComponent;
    [additionalProp: string]: unknown;
  };

  let {
    path = "",
    url = "",
    title = "",
    component,
    ...rest
  }: RouteProps = $props();

  const route = {
    path,
    // If no path prop is given, this Route will act as the default Route
    // that is rendered if no other Route in the Router is a match.
    default: path === "",
  };

  $effect.pre(() => {
    window?.scrollTo(0, 0);
  });

  function routerMatch(url: string, pattern: string): [boolean, RouteParams] {
    const urlParts = url.split("/").filter((part) => part.length > 0);
    const patternParts = pattern.split("/").filter((part) => part.length > 0);

    if (urlParts.length === 0 && patternParts.length === 0) {
      return [true, {}];
    }

    if (urlParts.length > patternParts.length || urlParts.length === 0) {
      return [false, {}];
    }

    // If the last pattern part is not a parameter, require exact match
    const lastPatternPart = patternParts[patternParts.length - 1];
    const requiresExactMatch = !lastPatternPart.startsWith(":");
    if (requiresExactMatch && urlParts.length !== patternParts.length) {
      return [false, {}];
    }

    let params: RouteParams = {};
    for (let i = 0; i < urlParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        const paramName = patternParts[i].substring(1);
        params[paramName] = decodeURIComponent(urlParts[i]);
      } else if (patternParts[i] !== urlParts[i]) {
        return [false, {}];
      }
    }

    return [true, params];
  }

  let PropComponent = component;

  let matched = $derived.by(() => {
    const result = routerMatch(url, path);
    return result[0];
  });

  let routeParams = $derived.by(() => {
    const result = routerMatch(url, path);
    return result[1];
  });

  function updateHash(params: RouteParams) {
    let newHash = path;
    for (const [key, value] of Object.entries(params)) {
      newHash = newHash.replace(`:${key}`, encodeURIComponent(value));
    }
    location.hash = `#${newHash}`;
  }

  function setTitle(title: string) {
    document.title = title;
  }

  $effect(() => {
    if (matched && title) {
      setTitle(title);
    }
  });

</script>

{#if matched}
  {#if PropComponent}
    <PropComponent {...routeParams} {...rest} navigate={updateHash} setTitle={setTitle} />
  {/if}
{/if}
