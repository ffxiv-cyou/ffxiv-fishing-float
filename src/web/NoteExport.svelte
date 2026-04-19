<script lang="ts">
  import type { FishingTracker } from "@/model/FishingTracker";
  import {
    A,
    Accordion,
    AccordionItem,
    Input,
    Li,
    List,
    Textarea,
  } from "flowbite-svelte";

  let {
    tracker,
    data,
  }: {
    tracker: FishingTracker;
    data?: string;
  } = $props();

  let fishLog = $derived.by(() => {
    if (data) {
      const v = tracker.getFishingLogShareData(data);
      if (v) return v;
    }
    return tracker.history.storage.getFishingLog();
  });

  let fishLength = $derived(fishLog.fishes.filter((x) => x).length);
  let spearFishLength = $derived(fishLog.spear_fishes.filter((x) => x).length);

  let encodedUrl = $derived.by(() => {
    let shareData = tracker.getFishingLogShareUrl();
    let url = new URL(location.href);
    url.hash = `/export/${shareData}`;
    return url.toString();
  });

  function loadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          const blob = new Blob([generateFullData(content)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "fisher-exported.json";
          a.click();
          URL.revokeObjectURL(url);
        }
      };
      reader.readAsText(file);
    }
  }

  function generateFullData(str: string): string {
    try {
      const obj = JSON.parse(str);
      obj.completed = [...fishLog.fishes, ...fishLog.spear_fishes];
      const newContent = JSON.stringify(obj, null, 2);
      return newContent;
    } catch (e) {
      return "";
    }
  }

  let inputData = $state("");
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">笔记导出</h1>
  <p class="mb-2">
    钓鱼笔记数目：{fishLength + spearFishLength}（钓鱼 {fishLength} 条，叉鱼 {spearFishLength}
    条）
  </p>
  {#if data}
    <Accordion>
      <AccordionItem>
        {#snippet header()}导出到鱼糕{/snippet}
        <List tag="ol" class="pb-4">
          <Li
            >请访问<A
              href="https://fish.ffmomola.com/?utm_source=fishing-float"
              target="_blank"
              rel="noopener noreferrer">鱼糕</A
            >，点击右上角的齿轮按钮，选择“导出”功能，导出现有设置。</Li
          >
          <Li>在下面上传导出的文件，程序会自动将笔记数据合并到新的文件中。</Li>
          <Li
            >最后将合并后的文件导入到鱼糕中，就可以在鱼糕中查看完整的钓鱼笔记了。</Li
          >
        </List>
        <Input type="file" onchange={loadFile} accept=".json" />
      </AccordionItem>
      <AccordionItem>
        {#snippet header()}导出到钓鱼时钟{/snippet}
        <p class="mb-2">请在下面的框中填写钓鱼时钟的导出数据</p>
        <Textarea
          rows={10}
          bind:value={inputData}
          placeholder="在此粘贴钓鱼时钟的导出数据"
          class="w-full"
        />
        <p class="my-2">然后将下面的新的数据复制并导入到钓鱼时钟</p>
        <Textarea
          rows={10}
          readonly
          value={generateFullData(inputData)}
          placeholder="这里是新的钓鱼时钟导入用数据"
          class="w-full"
        />
      </AccordionItem>
    </Accordion>
  {:else}
    <p class="mb-2">由于悬浮窗功能限制，请使用 Ctrl + C 复制下方的链接，然后在浏览器中打开</p>
    <pre>{encodedUrl}</pre>
  {/if}
</div>

<style>
  pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    max-width: 800px;
    user-select: all;
  }
</style>
