<script lang="ts">
  import { onMount } from "svelte";
  import {
    Alert,
    Button,
    Checkbox,
    Heading,
    Input,
    Label,
    P,
    Radio,
    Textarea,
  } from "flowbite-svelte";
  import {
    initFeedbackReceiver,
    isFeedbackFromOverlay,
    submitFeedback,
    type FeedbackCategory,
    type FeedbackFields,
    type FeedbackResult,
    type FeedbackAttachment,
  } from "@/lib/feedbackBridge";

  const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

  let fromOverlay = $state(false);

  let category = $state<FeedbackCategory | "">("");
  let message = $state("");
  let name = $state("");
  let email = $state("");
  let includePcap = $state(true);

  let screenshot: FeedbackAttachment | undefined = $state();
  let screenshotPreview = $state("");
  let screenshotError = $state("");

  let submitting = $state(false);
  let result: FeedbackResult | undefined = $state();
  let validationError = $state("");

  let showPcap = $derived(fromOverlay && category === "bug");

  onMount(() => {
    fromOverlay = isFeedbackFromOverlay();
    initFeedbackReceiver();
  });

  function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    screenshotError = "";
    if (file.size > MAX_SCREENSHOT_SIZE) {
      screenshotError = "图片大小超过 10MB，请压缩后重试";
      input.value = "";
      return;
    }
    void file.arrayBuffer().then((buf) => {
      screenshot = {
        filename: file.name,
        contentType: file.type || "image/png",
        data: new Uint8Array(buf),
      };
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      screenshotPreview = URL.createObjectURL(file);
    });
  }

  async function handleSubmit() {
    if (!category) {
      validationError = "请选择反馈类型";
      return;
    }
    if (!message.trim()) {
      validationError = "请填写描述";
      return;
    }
    validationError = "";
    submitting = true;
    result = undefined;
    const fields: FeedbackFields = {
      category,
      message: message.trim(),
      name: name || undefined,
      email: email || undefined,
      includePcap: showPcap && includePcap,
    };
    const r = await submitFeedback(fields, screenshot);
    submitting = false;
    result = r;
  }
</script>

<div class="mx-auto max-w-2xl p-6">
  <Heading tag="h1" class="text-2xl">问题反馈</Heading>
  <div class="mt-6 space-y-4">
    <div>
      <Label class="mb-1">反馈类型 *</Label>
      <div class="flex gap-4">
        <Radio
          bind:group={category}
          value="bug"
          onchange={() => (validationError = "")}
        >
          问题
        </Radio>
        <Radio
          bind:group={category}
          value="suggestion"
          onchange={() => (validationError = "")}
        >
          建议
        </Radio>

        <Radio
          bind:group={category}
          value="data_error"
          onchange={() => (validationError = "")}
        >
          数据错误
        </Radio>
      </div>
    </div>

    <div>
      <Label for="feedback-message" class="mb-1">描述 *</Label>
      <Textarea
        id="feedback-message"
        bind:value={message}
        placeholder="请描述遇到的问题、使用场景等信息"
        rows={4}
        class="w-full"
        oninput={() => (validationError = "")}
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label for="feedback-name" class="mb-1">昵称（选填）</Label>
        <Input id="feedback-name" bind:value={name} placeholder="选填" />
      </div>
      <div>
        <Label for="feedback-email" class="mb-1">联系方式（选填）</Label>
        <Input
          id="feedback-email"
          bind:value={email}
          placeholder="QQ / 邮箱 / 微信，选填"
        />
      </div>
    </div>

    {#if showPcap}
      <Checkbox bind:checked={includePcap}
        >附上最近的网络数据包，方便排查</Checkbox
      >
    {/if}

    <div>
      <Label for="feedback-screenshot" class="mb-1">截图（选填）</Label>
      <input
        id="feedback-screenshot"
        type="file"
        accept="image/*"
        class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
        onchange={handleFile}
      />
      {#if screenshotPreview}
        <img
          src={screenshotPreview}
          alt="截图预览"
          class="mt-2 max-h-40 rounded"
        />
      {/if}
      {#if screenshotError}
        <P class="size-sm mt-1 text-red-500">{screenshotError}</P>
      {/if}
    </div>

    {#if validationError}
      <Alert color="red">{validationError}</Alert>
    {/if}

    {#if result?.ok}
      <Alert color="green">提交成功，感谢你的反馈！</Alert>
    {:else if result && !result.ok}
      <Alert color="red">
        提交失败{result.error ? `：${result.error}` : ""}，请稍后重试。
      </Alert>
    {/if}

    <div class="flex gap-3">
      <Button color="primary" onclick={handleSubmit} disabled={submitting}>
        {submitting ? "提交中…" : "提交"}
      </Button>
      {#if result?.ok}
        <Button
          color="alternative"
          onclick={() => {
            category = "";
            message = "";
            name = "";
            email = "";
            screenshot = undefined;
            screenshotPreview = "";
            result = undefined;
          }}>再填一份</Button
        >
      {/if}
    </div>
  </div>
</div>
