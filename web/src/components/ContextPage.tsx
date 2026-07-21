import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { ContextDocMeta } from "../types";

function fmtChars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Shared context manager. Docs saved here (pasted transcripts from previous
 * chats — including from other AI apps — or plain notes) are injected into
 * the system prompt of every conversation while enabled.
 */
export function ContextPage() {
  const [docs, setDocs] = useState<ContextDocMeta[]>([]);
  const [maxTotalChars, setMaxTotalChars] = useState(0);
  const [error, setError] = useState("");
  // New-doc form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const refresh = useCallback(() => {
    api
      .listContextDocs()
      .then((r) => {
        setDocs(r.docs);
        setMaxTotalChars(r.maxTotalChars);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, []);

  useEffect(refresh, [refresh]);

  async function addDoc() {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.createContextDoc(title.trim(), content);
      setTitle("");
      setContent("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function startEdit(id: string) {
    const { doc } = await api.getContextDoc(id);
    setEditingId(id);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      await api.updateContextDoc(editingId, { title: editTitle, content: editContent });
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    }
  }

  const enabledChars = docs.filter((d) => d.enabled).reduce((sum, d) => sum + d.chars, 0);
  const overBudget = enabledChars > maxTotalChars;

  return (
    <div className="usage-page">
      <div className="usage-inner">
        <h1>Shared context</h1>
        <p style={{ color: "var(--muted)", maxWidth: "44rem" }}>
          Documents here are added to the system prompt of <strong>every</strong>{" "}
          conversation while enabled — this is how context carries across chats. Paste
          transcripts of previous conversations (from here, ChatGPT, Claude, anywhere) or
          project notes. In a chat you can also press <em>Save to context</em> to snapshot
          that conversation for future ones.
        </p>
        {error && <div className="banner">{error}</div>}
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: overBudget ? "#b3402a" : "var(--muted)" }}>
          Enabled: {fmtChars(enabledChars)} / {fmtChars(maxTotalChars)} chars
          {overBudget ? " — oldest docs get truncated to fit" : ""}
        </p>

        <h2>Documents</h2>
        {docs.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Nothing saved yet.</p>
        )}
        <table className="usage-table" style={{ marginBottom: "1.5rem" }}>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td style={{ width: "1%" }}>
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    title={d.enabled ? "Included in every chat" : "Excluded"}
                    onChange={(e) =>
                      api.updateContextDoc(d.id, { enabled: e.target.checked }).then(refresh)
                    }
                  />
                </td>
                <td>{d.title}</td>
                <td className="num">{fmtChars(d.chars)} chars</td>
                <td className="num">{new Date(Number(d.updatedAt)).toLocaleDateString()}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="advanced-toggle" onClick={() => startEdit(d.id)}>
                    Edit
                  </button>{" "}
                  <button
                    type="button"
                    className="advanced-toggle"
                    onClick={() => {
                      if (window.confirm(`Delete "${d.title}"?`)) {
                        api.deleteContextDoc(d.id).then(refresh);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingId && (
          <div className="chart" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ marginTop: 0 }}>Edit document</h2>
            <input
              style={{ width: "100%", marginBottom: "0.5rem", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "0.45rem 0.6rem", fontFamily: "var(--font-body)" }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              style={{ width: "100%", minHeight: 220, border: "1px solid var(--line-strong)", borderRadius: 7, padding: "0.6rem", fontFamily: "var(--mono)", fontSize: "0.8rem" }}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
              <button type="button" className="send-btn" onClick={saveEdit}>Save</button>
              <button type="button" className="advanced-toggle" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <h2>Add a document</h2>
        <div className="chart">
          <input
            placeholder="Title (e.g. “ChatGPT: thesis project planning”)"
            style={{ width: "100%", marginBottom: "0.5rem", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "0.45rem 0.6rem", fontFamily: "var(--font-body)" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Paste the transcript or notes here…"
            style={{ width: "100%", minHeight: 180, border: "1px solid var(--line-strong)", borderRadius: 7, padding: "0.6rem", fontFamily: "var(--mono)", fontSize: "0.8rem" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="send-btn"
              disabled={!title.trim() || !content.trim() || saving}
              onClick={addDoc}
            >
              {saving ? "Saving…" : "Save document"}
            </button>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--muted)" }}>
              {fmtChars(content.length)} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
