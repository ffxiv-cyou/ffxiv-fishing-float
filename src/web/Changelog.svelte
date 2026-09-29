<script lang="ts">
  import { Heading, P, Spinner, Alert } from "flowbite-svelte";
  import { fetchChangelogMarkdown, renderMarkdown } from "@/lib/changelog";

  let html: string | null = $state(null);
  let failed = $state(false);

  $effect(() => {
    fetchChangelogMarkdown().then((md) => {
      if (md) {
        html = renderMarkdown(md);
      } else {
        failed = true;
      }
    });
  });
</script>

<div class="mx-auto max-w-3xl p-4">
  <Heading tag="h1" class="text-2xl">更新日志</Heading>
  {#if html}
    <div class="changelog-page">{@html html}</div>
  {:else if failed}
    <Alert color="red">更新日志加载失败，请稍后再试。</Alert>
  {:else}
    <Spinner />
  {/if}
</div>

<style>
  .changelog-page :global(h1) {
    font-size: 1.5rem;
    margin: 1em 0 0.5em;
  }
  .changelog-page :global(h2) {
    font-size: 1.25rem;
    margin: 1em 0 0.5em;
    padding-bottom: 0.25em;
    border-bottom: 1px solid var(--color-gray-200, #e5e7eb);
  }
  .changelog-page :global(h3),
  .changelog-page :global(h4) {
    font-size: 1.1rem;
    margin: 0.8em 0 0.4em;
  }
  .changelog-page :global(p) {
    margin: 0.5em 0;
  }
  .changelog-page :global(ul) {
    list-style: disc;
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  .changelog-page :global(li) {
    margin: 0.25em 0;
  }
  .changelog-page :global(a) {
    color: var(--color-blue-600, #2563eb);
    text-decoration: underline;
  }
  .changelog-page :global(code) {
    background: var(--color-gray-100, #f3f4f6);
    border-radius: 4px;
    padding: 0 4px;
  }
  .changelog-page :global(hr) {
    margin: 1em 0;
  }
</style>
