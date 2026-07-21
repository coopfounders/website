/** Client-side file downloads — models return text; files are made here. */

const LANG_EXT: Record<string, string> = {
  markdown: "md", md: "md",
  csv: "csv", tsv: "tsv",
  html: "html", xml: "xml", svg: "svg",
  json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
  javascript: "js", js: "js", jsx: "jsx",
  typescript: "ts", ts: "ts", tsx: "tsx",
  python: "py", py: "py",
  java: "java", kotlin: "kt", swift: "swift",
  c: "c", cpp: "cpp", h: "h", rust: "rs", go: "go",
  ruby: "rb", php: "php",
  sql: "sql",
  bash: "sh", sh: "sh", shell: "sh", zsh: "sh",
  css: "css", scss: "scss",
  latex: "tex", tex: "tex",
  text: "txt", txt: "txt", plaintext: "txt",
};

const MIME: Record<string, string> = {
  md: "text/markdown",
  csv: "text/csv",
  html: "text/html",
  json: "application/json",
  svg: "image/svg+xml",
};

export function extensionFor(lang: string): string {
  return LANG_EXT[lang.toLowerCase()] ?? "txt";
}

/** Filename base from the first markdown heading (or a fallback). */
export function slugFor(text: string, fallback: string): string {
  const heading = /^#{1,6}\s+(.{3,80})$/m.exec(text)?.[1] ?? "";
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}

export function downloadText(filename: string, text: string): void {
  const ext = filename.split(".").pop() ?? "txt";
  const blob = new Blob([text], { type: `${MIME[ext] ?? "text/plain"};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
