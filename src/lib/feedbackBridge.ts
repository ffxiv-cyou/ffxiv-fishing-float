import * as Sentry from "@sentry/svelte";
import { getRecentError } from "@/sentry";

export const FEEDBACK_MSG_PREFIX = "fishing-float:feedback-";

export const FEEDBACK_MSG_SUBMIT = "fishing-float:feedback-submit";
export const FEEDBACK_MSG_RESULT = "fishing-float:feedback-result";

export const FEEDBACK_SUBMIT_TIMEOUT_MS = 8000;

export type FeedbackCategory = "suggestion" | "bug" | "data_error";

export interface FeedbackFields {
  category: FeedbackCategory;
  message: string;
  name?: string;
  email?: string;
  includePcap: boolean;
}

export interface FeedbackResult {
  ok: boolean;
  error?: string;
}

export interface FeedbackAttachment {
  data: string | Uint8Array;
  filename: string;
  contentType?: string;
}

export type FeedbackMessage =
  | { type: typeof FEEDBACK_MSG_SUBMIT; fields: FeedbackFields; screenshot?: FeedbackAttachment }
  | { type: typeof FEEDBACK_MSG_RESULT; ok: boolean; error?: string };

function isFeedbackMessage(data: unknown): data is FeedbackMessage {
  if (typeof data !== "object" || data === null) return false;
  const type = (data as { type?: unknown }).type;
  return typeof type === "string" && type.startsWith(FEEDBACK_MSG_PREFIX);
}

/** 判断当前窗口是否由其他窗口（悬浮窗）打开。 */
export function isFeedbackFromOverlay(): boolean {
  return !!window.opener;
}

/**
 * 通过 Sentry 提交反馈事件（overlay 与 web 共用）。
 * 自动关联最近 10 分钟内的错误事件（当前窗口自身捕获的）。
 */
export function submitFeedbackToSentry(
  fields: FeedbackFields,
  screenshot: FeedbackAttachment | undefined,
  opts: {
    source: "overlay" | "web";
    extraAttachments?: FeedbackAttachment[];
  },
): FeedbackResult {
  const attachments: FeedbackAttachment[] = [];
  if (screenshot) attachments.push(screenshot);
  if (opts.extraAttachments) attachments.push(...opts.extraAttachments);

  try {
    Sentry.captureFeedback(
      {
        message: fields.message,
        name: fields.name || undefined,
        email: fields.email || undefined,
        associatedEventId: getRecentError()?.id,
        tags: { feedback_type: fields.category, source: opts.source },
      },
      { attachments },
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

//#region 弹窗侧（子窗口）

let receiverInitialized = false;
let resultResolver: ((r: FeedbackResult) => void) | undefined;
let resultTimer: ReturnType<typeof setTimeout> | undefined;

/** 弹窗侧注册消息接收：处理 feedback-result 以兑现提交 promise。重复调用不叠加监听。 */
export function initFeedbackReceiver(): void {
  if (receiverInitialized) return;
  receiverInitialized = true;

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    if (!isFeedbackMessage(e.data)) return;

    if (e.data.type === FEEDBACK_MSG_RESULT) {
      if (resultResolver) {
        const resolver = resultResolver;
        resultResolver = undefined;
        clearTimeout(resultTimer);
        resolver({ ok: e.data.ok, error: e.data.error });
      }
      // 无 pending resolver 时忽略（兜底自提后到达的重复结果）
    }
  });
}

/** 弹窗侧提交入口：优先经 opener（悬浮窗）提交（可附 pcap），失败/不可达时由页面直接提交（无 pcap）。 */
export async function submitFeedback(
  fields: FeedbackFields,
  screenshot?: FeedbackAttachment,
): Promise<FeedbackResult> {
  const viaOpener = await submitFeedbackViaOpener(fields, screenshot);
  if (viaOpener.ok) return viaOpener;
  return submitFeedbackToSentry(fields, screenshot, { source: "web" });
}

/** 通过 opener 提交反馈；失败或超时返回 ok=false。 */
export function submitFeedbackViaOpener(
  fields: FeedbackFields,
  screenshot?: FeedbackAttachment,
): Promise<FeedbackResult> {
  const opener = window.opener;
  if (!opener) return Promise.resolve({ ok: false, error: "no-opener" });

  if (resultResolver) return Promise.resolve({ ok: false, error: "busy" });

  return new Promise((resolve) => {
    resultResolver = resolve;
    resultTimer = setTimeout(() => {
      const resolver = resultResolver;
      resultResolver = undefined;
      resolver?.({ ok: false, error: "timeout" });
    }, FEEDBACK_SUBMIT_TIMEOUT_MS);

    try {
      opener.postMessage({ type: FEEDBACK_MSG_SUBMIT, fields, screenshot }, location.origin);
    } catch (e) {
      clearTimeout(resultTimer);
      resultResolver = undefined;
      resolve({ ok: false, error: "post-failed" });
    }
  });
}

//#endregion

//#region opener 侧（悬浮窗）

export interface FeedbackOverlayHandlerOptions {
  /** 处理提交请求，返回提交结果。 */
  onSubmit: (fields: FeedbackFields, screenshot?: FeedbackAttachment) => Promise<FeedbackResult>;
}

let overlayHandlerInitialized = false;
let overlayHandlerOptions: FeedbackOverlayHandlerOptions = {
  onSubmit: async () => ({ ok: false, error: "uninitialized" }),
};

/** 注册悬浮窗侧的反馈处理：监听 submit，回发 result。重复调用仅更新选项，不会叠加监听。 */
export function initFeedbackOverlayHandler(opts: FeedbackOverlayHandlerOptions): void {
  overlayHandlerOptions = { ...overlayHandlerOptions, ...opts };
  if (overlayHandlerInitialized) return;
  overlayHandlerInitialized = true;

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    if (!isFeedbackMessage(e.data)) return;
    const source = e.source as Window | null;

    if (e.data.type === FEEDBACK_MSG_SUBMIT) {
      void overlayHandlerOptions.onSubmit(e.data.fields, e.data.screenshot).then((result) => {
        source?.postMessage(
          { type: FEEDBACK_MSG_RESULT, ok: result.ok, error: result.error },
          location.origin,
        );
      });
    }
  });
}

//#endregion