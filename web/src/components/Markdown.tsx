import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { downloadText, extensionFor, slugFor } from "../download";

/** True while the containing assistant message is still streaming. */
const StreamingContext = createContext(false);

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function extractLanguage(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(extractLanguage).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props: { className?: string; children?: ReactNode } }).props;
    const match = /language-([\w-]+)/.exec(props.className ?? "");
    if (match) return match[1];
    return extractLanguage(props.children);
  }
  return "";
}

/**
 * Locked-down document for the preview iframe: the sandbox attribute blocks
 * same-origin access (no cookies/storage), and the injected CSP blocks all
 * network fetches — the snippet must be fully self-contained.
 */
const FRAME_CSP =
  `<meta http-equiv="Content-Security-Policy" content="` +
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; ` +
  `img-src data: blob:; font-src data:; media-src data: blob:;">`;

/** Lets the parent trigger the print dialog (→ "Save as PDF") in the frame. */
const PRINT_HELPER =
  `<script>window.addEventListener("message",function(e){` +
  `if(e.data==="coop-print")window.print()});</script>`;

const FRAME_HEAD = FRAME_CSP + PRINT_HELPER;

function buildSrcDoc(code: string): string {
  if (/<head[^>]*>/i.test(code)) {
    return code.replace(/<head[^>]*>/i, (m) => `${m}\n${FRAME_HEAD}`);
  }
  if (/<html[^>]*>/i.test(code)) {
    return code.replace(/<html[^>]*>/i, (m) => `${m}<head>${FRAME_HEAD}</head>`);
  }
  return (
    `<!doctype html><html><head>${FRAME_HEAD}<style>` +
    `body{margin:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2f3b45}` +
    `</style></head><body>${code}</body></html>`
  );
}

/**
 * The snippet travels to /gpt/preview.html as base64 in the URL fragment —
 * fragments never leave the browser, and the sandboxed frame (no
 * allow-same-origin) can't touch cookies or storage. srcdoc is deliberately
 * NOT used: srcdoc documents inherit the app's strict CSP, which would block
 * the snippet's inline scripts.
 */
function previewUrl(code: string): string {
  const b64 = btoa(unescape(encodeURIComponent(buildSrcDoc(code))));
  return `/gpt/preview.html#${b64}`;
}

function ArtifactBlock({ code, pre }: { code: string; pre: ReactNode }) {
  const streaming = useContext(StreamingContext);
  const [view, setView] = useState<"code" | "preview">(streaming ? "code" : "preview");
  const userChose = useRef(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [copied, setCopied] = useState(false);

  /** Opens the frame's print dialog, where "Save as PDF" is built in. */
  function savePdf() {
    frameRef.current?.contentWindow?.postMessage("coop-print", "*");
  }

  // Auto-open the preview once streaming finishes (unless the user picked a tab).
  useEffect(() => {
    if (!streaming && !userChose.current) setView("preview");
  }, [streaming]);

  function choose(v: "code" | "preview") {
    userChose.current = true;
    setView(v);
  }

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="artifact">
      <div className="artifact-bar">
        <button
          type="button"
          className={view === "preview" ? "active" : ""}
          onClick={() => choose("preview")}
          disabled={streaming}
          title={streaming ? "Available when the response finishes" : undefined}
        >
          Preview
        </button>
        <button
          type="button"
          className={view === "code" ? "active" : ""}
          onClick={() => choose("code")}
        >
          Code
        </button>
        <span className="artifact-spacer" />
        {view === "preview" && (
          <>
            <button type="button" onClick={() => setFrameKey((k) => k + 1)} title="Restart the preview">
              Reload
            </button>
            <button
              type="button"
              onClick={savePdf}
              title="Open the print dialog — choose “Save as PDF” there"
            >
              Save PDF
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => downloadText(`${slugFor(code, "design")}.html`, code)}
          title="Download as an .html file"
        >
          Download
        </button>
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {view === "preview" ? (
        <div className="artifact-frame">
          <iframe
            key={frameKey}
            ref={frameRef}
            sandbox="allow-scripts allow-modals"
            src={previewUrl(code)}
            title="HTML preview (sandboxed)"
          />
        </div>
      ) : (
        <div className="artifact-code">{pre}</div>
      )}
    </div>
  );
}

function Pre(props: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);
  const lang = extractLanguage(props.children);
  const text = extractText(props.children);

  // ```html blocks (or bare full documents) get the artifact treatment.
  if (lang === "html" || /^\s*(<!doctype html|<html[\s>])/i.test(text)) {
    return <ArtifactBlock code={text} pre={<pre {...props} />} />;
  }

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const ext = extensionFor(lang);

  return (
    <div className="codeblock">
      <div className="code-actions">
        <button
          type="button"
          onClick={() => downloadText(`${slugFor(text, "document")}.${ext}`, text)}
          title={`Download as .${ext}`}
        >
          Download
        </button>
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre {...props} />
    </div>
  );
}

export const Markdown = memo(function Markdown({
  text,
  streaming = false,
}: {
  text: string;
  streaming?: boolean;
}) {
  return (
    <StreamingContext.Provider value={streaming}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
        components={{ pre: Pre }}
      >
        {text}
      </ReactMarkdown>
    </StreamingContext.Provider>
  );
});
