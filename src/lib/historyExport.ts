import overlayToolkit from "overlay-toolkit";
import type { GameDatabase } from "@/model/GameDB";
import type { HistoryItem } from "@/model/HistoryStorage";
import { HookType, LureType, TugType } from "@/model/InnerEnums";
import { formatEorzeaTime, formatTime } from "@/components/spot/data_helper";
import { CSV_FILE_TYPES, isActOverlayOpener, isActOverlaySelf, saveViaOpener } from "./fileBridge";

interface FilePickerOptions {
  suggestedName?: string;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields.map(escapeCSV).join(",") + "\r\n";
}

function fishName(item: HistoryItem, db: GameDatabase): string {
  if (item.fish !== undefined) return db.getItemName(item.fish);
  return "(脱钩)";
}

function tugLabel(tugType: TugType): string {
  switch (tugType) {
    case TugType.Light:
      return "轻竿";
    case TugType.Medium:
      return "中竿";
    case TugType.Heavy:
      return "重竿";
  }
  return "";
}

function hookLabel(hookType: number | undefined): string {
  switch (hookType) {
    case HookType.Normal:
      return "普通";
    case HookType.Powerful:
      return "强力";
    case HookType.Precise:
      return "精准";
    case HookType.Double:
      return "双重";
    case HookType.Triple:
      return "三重";
    case HookType.Stellar:
      return "华丽";
  }
  return "";
}

function lureText(item: HistoryItem): string {
  if (item.lureType === null || item.lureType === undefined || item.lureStacks === 0)
    return "-";
  var prefix = "";
  switch (item.lureType) {
    case LureType.Ambitious:
      prefix = "雄心";
      break;
    case LureType.Modest:
      prefix = "谦逊";
      break;
  }
  return `${prefix} (x${item.lureStacks} @ ${((item.lureAt - item.date) / 1000).toFixed(1)}s)`;
}

const COLUMNS = [
  "时间",
  "ET",
  "区域",
  "鱼饵",
  "渔获",
  "竿时(s)",
  "撒饵",
  "咬钩类型",
  "提竿",
  "大尺寸",
  "大小",
  "诱饵",
  "鱼词",
];

function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return "-";
  return value ? "是" : "否";
}

export function historyToCSV(records: HistoryItem[], db: GameDatabase): string {
  const lines: string[] = [csvRow(COLUMNS)];
  for (const r of records) {
    lines.push(
      csvRow([
        formatTime(r.date),
        formatEorzeaTime(r.lureAt || r.date),
        db.getZoneName(r.zone),
        db.getItemName(r.bait),
        fishName(r, db),
        r.biteTime.toFixed(1),
        r.chum ? "撒饵" : "-",
        tugLabel(r.tugType),
        hookLabel(r.hookType),
        formatBoolean(r.isHQ),
        r.size !== undefined ? (r.size / 10).toFixed(1) : "-",
        lureText(r),
        r.lureHidden ? db.getItemName(r.lureHidden) : "",
      ]),
    );
  }
  return "\ufeff" + lines.join("");
}

async function saveWithHandle(
  getHandle: () => Promise<FileSystemFileHandle>,
  content: string,
): Promise<boolean> {
  try {
    const handle = await getHandle();
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return true;
    alert("保存文件失败: " + e);
    return false;
  }
}

function downloadBlob(suggestedName: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveCSV(suggestedName: string, content: string): Promise<void> {
  if (isActOverlayOpener()) {
    saveViaOpener(suggestedName, content);
    return;
  }

  const methods: Array<() => Promise<boolean>> = [];
  if (isActOverlaySelf()) {
    methods.push(() =>
      saveWithHandle(
        () => overlayToolkit.fs.showSaveFilePicker({ suggestedName, types: CSV_FILE_TYPES }),
        content,
      ),
    );
  } else if (window.showSaveFilePicker) {
    methods.push(() =>
      saveWithHandle(
        () => window.showSaveFilePicker!({ suggestedName, types: CSV_FILE_TYPES }),
        content,
      ),
    );
  }

  for (const method of methods) {
    if (await method()) return;
  }

  downloadBlob(suggestedName, content);
}

export function exportFileName(zoneName: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `鱼漂-${zoneName}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.csv`;
}