import overlayToolkit from "overlay-toolkit";

export const CSV_FILE_TYPES = [{ description: "CSV 文件", accept: { "text/csv": [".csv"] } }];

const MSG_SAVE = "fishing-float:file-save";

interface SaveFileMessage {
  type: string;
  suggestedName: string;
  content: string;
}

/**
 * 判断 opener 是否为 ACT 悬浮窗：opener 上有 OverlayPluginApi 且非独立程序（desktopApp）。
 * 跨源 opener 访问会抛异常，视为非悬浮窗。
 */
export function isActOverlayOpener(): boolean {
  const opener = window.opener;
  if (!opener) return false;
  try {
    const api = (opener as any).OverlayPluginApi;
    return !!api && !api.desktopApp;
  } catch {
    return false;
  }
}

/**
 * 判断当前窗口自身是否为 ACT 悬浮窗（有 OverlayPluginApi 且非独立程序）。
 */
export function isActOverlaySelf(): boolean {
  const api = (window as any).OverlayPluginApi;
  return !!api && !api.desktopApp;
}

/**
 * 子窗口侧：将保存请求通过 postMessage 交给 opener（悬浮窗）处理。
 */
export function saveViaOpener(suggestedName: string, content: string): void {
  const opener = window.opener;
  if (!opener) return;
  const message: SaveFileMessage = { type: MSG_SAVE, suggestedName, content };
  try {
    opener.postMessage(message, location.origin);
  } catch (e) {
    console.error("Failed to post message to opener:", e);
  }
}

let initialized = false;

/**
 * opener 侧：监听子窗口的保存请求，使用 overlay-toolkit 的 FileSystem API 写出文件。
 */
export function initFileBridge(): void {
  if (initialized) return;
  initialized = true;
  window.addEventListener("message", onMessage);
}

function onMessage(e: MessageEvent) {
  if (e.origin !== location.origin) return;
  if (!overlayToolkit.IsOverlayPluginCEF()) return;
  const data = e.data as SaveFileMessage | undefined;
  if (!data || data.type !== MSG_SAVE) return;
  void saveFile(data.suggestedName, data.content);
}

async function saveFile(suggestedName: string, content: string): Promise<void> {
  try {
    const handle = await overlayToolkit.fs.showSaveFilePicker({
      suggestedName,
      types: CSV_FILE_TYPES,
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    alert("保存文件失败: " + e);
    console.error(e);
  }
}