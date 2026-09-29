/**
 * 更新日志：版本解析 + markdown 获取 + 极简 markdown 渲染。
 *
 * 维护方式：直接编辑 `public/changelog.md`，在顶部新增一个 `## <版本号>`
 * 小节即可（版本号推荐日期，如 `## 2026.09.29`）。打开悬浮窗 / 网页时
 * 会解析出该版本号，与 localStorage 中的已读版本对比，不同则弹窗一次。
 * 无需维护任何代码常量。
 */

/** 从 markdown 中解析版本号：取第一个 `## xxx` 标题 */
export function parseChangelogVersion(md: string): string | null {
  const m = md.replace(/\r\n/g, "\n").match(/^##(?!#)\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * 截取最新版本小节：从第一个 `##` 到下一个 `##`（或文末）。
 * 弹窗只展示这部分，完整历史去独立页面看。
 */
export function extractLatestSection(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const isSection = (l: string) => /^##(?!#)\s+.+?\s*$/.test(l);
  const start = lines.findIndex(isSection);
  if (start === -1) return md;
  let end = lines.findIndex((l, i) => i > start && isSection(l));
  if (end === -1) end = lines.length;
  return lines.slice(start, end).join("\n").trim();
}

const SEEN_KEY = "fishing_float_changelog_seen";

export function getSeenChangelogVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function markChangelogSeen(version: string): void {
  try {
    localStorage.setItem(SEEN_KEY, version);
  } catch {
    // localStorage 不可用时忽略，下次再弹
  }
}

function changelogUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return (base.endsWith("/") ? base : base + "/") + "changelog.md";
}

export async function fetchChangelogMarkdown(): Promise<string | null> {
  try {
    // changelog 更新后需要立刻生效，不走浏览器 HTTP 缓存
    const res = await fetch(changelogUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 行内格式：`code`、**bold**、[text](url) */
function renderInline(s: string): string {
  let e = escapeHtml(s);
  e = e.replace(/`([^`]+)`/g, "<code>$1</code>");
  e = e.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  e = e.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  return e;
}

/**
 * 极简 markdown 渲染（只支持更新日志需要的子集）：
 * `#`~`####` 标题、`-`/`*` 无序列表、分隔线、段落。
 */
export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const raw of lines) {
    const t = raw.trim();
    if (t === "") {
      closeList();
      continue;
    }
    if (/^---+$/.test(t)) {
      closeList();
      html += "<hr>";
      continue;
    }
    const heading = t.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html += `<h${level}>${renderInline(heading[2])}</h${level}>`;
      continue;
    }
    const item = t.match(/^[-*]\s+(.*)$/);
    if (item) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${renderInline(item[1])}</li>`;
      continue;
    }
    closeList();
    html += `<p>${renderInline(t)}</p>`;
  }
  closeList();
  return html;
}

/**
 * 拉取更新日志；若无更新（已读 / 拉取失败 / 解析不出版本）返回 null。
 * 返回的 html 只包含最新版本小节（弹窗用），全文渲染请用
 * fetchChangelogMarkdown + renderMarkdown（独立页面用）。
 *
 * 首次运行（本地无已读记录）时静默记为已读、不弹窗，
 * 只在后续 changelog 新增版本小节时才弹出打扰用户。
 */
export async function fetchUnreadChangelog(): Promise<{
  version: string;
  html: string;
} | null> {
  const md = await fetchChangelogMarkdown();
  if (md === null) return null;
  const version = parseChangelogVersion(md);
  if (version === null) return null;
  const seen = getSeenChangelogVersion();
  if (seen === null) {
    markChangelogSeen(version);
    return null;
  }
  if (seen === version) return null;
  return { version, html: renderMarkdown(extractLatestSection(md)) };
}
