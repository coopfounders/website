import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_MODEL_ID,
  MODELS,
  PROVIDERS,
  SYSTEM_PRESETS,
  getModel,
  type ProviderId,
} from "@shared/models.config";
import { api, ApiError, streamChat } from "../api";
import { downloadText, slugFor } from "../download";
import type { ConversationSummary, Message } from "../types";
import { Markdown } from "./Markdown";
import { Sidebar } from "./Sidebar";

function fmtCost(cost: number): string {
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
}

function modelLabel(id: string | null | undefined): string {
  if (!id) return "";
  return getModel(id)?.displayName ?? id;
}

export function Chat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState(() => {
    const stored = localStorage.getItem("gpt.model");
    // Fall back if the stored model has been removed from the config.
    return stored && getModel(stored) ? stored : DEFAULT_MODEL_ID;
  });
  const [presetId, setPresetId] = useState("none");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [contextCount, setContextCount] = useState(0);
  const [savedToContext, setSavedToContext] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const model = getModel(modelId) ?? MODELS[0];

  const refreshConversations = useCallback(() => {
    api.listConversations().then((r) => setConversations(r.conversations)).catch(() => {});
  }, []);

  useEffect(refreshConversations, [refreshConversations]);

  useEffect(() => {
    api
      .listContextDocs()
      .then((r) => setContextCount(r.docs.filter((d) => d.enabled).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("gpt.model", modelId);
  }, [modelId]);

  // Retry-After countdown shown in the banner.
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;
    const t = setTimeout(() => setRetryCountdown((v) => (v !== null ? v - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [retryCountdown]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const selectConversation = useCallback((id: string) => {
    setSidebarOpen(false);
    setActiveId(id);
    api
      .getConversation(id)
      .then((r) => setMessages(r.messages))
      .catch(() => setMessages([]));
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setBanner(null);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      api.deleteConversation(id).then(() => {
        refreshConversations();
        if (id === activeId) newChat();
      });
    },
    [activeId, newChat, refreshConversations]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBanner(null);
    setRetryCountdown(null);
    setBusy(true);
    setInput("");

    const preset = SYSTEM_PRESETS.find((p) => p.id === presetId);
    const userMsg: Message = { id: `local-u-${Date.now()}`, role: "user", content: text };
    const assistantMsg: Message = {
      id: `local-a-${Date.now()}`,
      role: "assistant",
      content: "",
      streaming: true,
      model: modelId,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const abort = new AbortController();
    abortRef.current = abort;

    const patchAssistant = (patch: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, ...patch } : m))
      );
    };

    let acc = "";
    try {
      await streamChat(
        {
          conversationId: activeId,
          message: text,
          modelId,
          system: preset?.prompt || undefined,
          temperature: model.supportsTemperature ? temperature : undefined,
          maxTokens,
        },
        (event) => {
          if (event.type === "meta") {
            setActiveId(event.conversationId);
          } else if (event.type === "text") {
            acc += event.text;
            patchAssistant({ content: acc });
          } else if (event.type === "usage") {
            patchAssistant({
              model: event.model,
              inputTokens: event.inputTokens,
              outputTokens: event.outputTokens,
              costUsd: event.costUsd,
            });
          } else if (event.type === "error") {
            patchAssistant({ streaming: false, error: event.message });
          }
        },
        abort
      );
      patchAssistant({ streaming: false });
    } catch (err) {
      if (abort.signal.aborted) {
        patchAssistant({ streaming: false });
      } else if (err instanceof ApiError) {
        patchAssistant({ streaming: false, error: err.message });
        if (err.status === 429 && err.retryAfter) {
          setBanner(err.message);
          setRetryCountdown(err.retryAfter);
        }
      } else {
        patchAssistant({
          streaming: false,
          error: "Connection lost while streaming. Try again.",
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
      refreshConversations();
    }
  }, [
    activeId, busy, input, maxTokens, model.supportsTemperature,
    modelId, presetId, refreshConversations, temperature,
  ]);

  const exportMarkdown = useCallback(() => {
    if (messages.length === 0) return;
    const title = conversations.find((c) => c.id === activeId)?.title || "conversation";
    const lines = [
      `# ${title}`,
      "",
      ...messages.flatMap((m) => {
        const who =
          m.role === "user" ? "**You**" : `**Assistant** (${modelLabel(m.model)})`;
        return [`${who}:`, "", m.content, "", "---", ""];
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "conversation"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [activeId, conversations, messages]);

  const grouped = (Object.keys(PROVIDERS) as ProviderId[]).map((p) => ({
    provider: PROVIDERS[p],
    models: MODELS.filter((m) => m.provider === p),
  }));

  return (
    <div className="layout">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNew={newChat}
      />
      <main className="chat">
        <div className="messages" ref={scrollRef}>
          <div className="messages-inner">
            {messages.length === 0 && (
              <div className="empty-state">
                <h2>What are we working on?</h2>
                <p>
                  Pick a model below and start typing. Conversations are saved in the
                  sidebar; you can switch models mid-chat.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className={`bubble${m.streaming && !m.content ? " streaming-cursor" : ""}`}>
                  {m.role === "assistant" ? (
                    <span className={m.streaming && m.content ? "streaming-cursor" : ""}>
                      <Markdown text={m.content} streaming={!!m.streaming} />
                    </span>
                  ) : (
                    m.content
                  )}
                </div>
                {m.error && <div className="error-note">{m.error}</div>}
                {m.role === "assistant" && !m.streaming && !m.error && (
                  <div className="meta">
                    {m.costUsd != null ? (
                      <>
                        {modelLabel(m.model)} · {m.inputTokens?.toLocaleString()} in ·{" "}
                        {m.outputTokens?.toLocaleString()} out · {fmtCost(m.costUsd)}
                      </>
                    ) : (
                      modelLabel(m.model)
                    )}
                    {m.content && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="meta-btn"
                          title="Download this reply as a markdown file"
                          onClick={() =>
                            downloadText(`${slugFor(m.content, "reply")}.md`, m.content)
                          }
                        >
                          Download .md
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="composer-wrap">
          <div className="composer">
            {banner && (
              <div className="banner">
                {banner}
                {retryCountdown !== null && retryCountdown > 0 && (
                  <> Retry in {retryCountdown}s.</>
                )}
              </div>
            )}
            <div className="controls-row">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                ☰ Chats
              </button>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                aria-label="Model"
              >
                {grouped.map(({ provider, models }) => (
                  <optgroup key={provider.id} label={provider.displayName}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
                aria-label="System prompt preset"
              >
                {SYSTEM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide advanced" : "Advanced"}
              </button>
              {messages.length > 0 && (
                <button type="button" className="export-btn" onClick={exportMarkdown}>
                  Export .md
                </button>
              )}
              {activeId && messages.length > 0 && (
                <button
                  type="button"
                  className="export-btn"
                  title="Snapshot this conversation into shared context so future chats know about it"
                  onClick={() => {
                    api.contextFromConversation(activeId).then(() => {
                      setSavedToContext(true);
                      setContextCount((n) => n + 1);
                      setTimeout(() => setSavedToContext(false), 2000);
                    });
                  }}
                >
                  {savedToContext ? "Saved ✓" : "Save to context"}
                </button>
              )}
              {contextCount > 0 && (
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.68rem",
                    color: "var(--teal-ink)",
                    marginLeft: "auto",
                  }}
                  title="Enabled shared-context documents are included in every request (manage them on the Context page)"
                >
                  ctx: {contextCount} doc{contextCount === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {showAdvanced && (
              <div className="advanced-panel">
                <label>
                  Temperature
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!model.supportsTemperature}
                    value={temperature ?? 1}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                  />
                  <span style={{ fontFamily: "var(--mono)" }}>
                    {model.supportsTemperature
                      ? (temperature ?? "default")
                      : "n/a for this model"}
                  </span>
                </label>
                <label>
                  Max output tokens
                  <input
                    type="number"
                    min={256}
                    max={model.maxOutputTokens}
                    step={256}
                    placeholder="8192"
                    value={maxTokens ?? ""}
                    onChange={(e) =>
                      setMaxTokens(e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </label>
              </div>
            )}

            <div className="input-row">
              <textarea
                ref={textareaRef}
                value={input}
                placeholder={`Message ${model.displayName}…`}
                rows={2}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              {busy ? (
                <button type="button" className="stop-btn" onClick={stop}>
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  className="send-btn"
                  disabled={!input.trim()}
                  onClick={send}
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
