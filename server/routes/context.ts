import { Router } from "express";
import { newId, query } from "../db/db";

/**
 * Shared context documents: text blobs (pasted transcripts of previous chats,
 * project notes, anything) that are injected into the system prompt of every
 * chat request while enabled. This is how context is shared across
 * conversations and imported from chats that happened elsewhere.
 */
export const contextRouter = Router();

/** Total budget for injected context, in characters (~45k tokens). */
export const MAX_CONTEXT_CHARS = 180_000;
/** Max size of a single document. */
const MAX_DOC_CHARS = 400_000;

export interface ContextDoc {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
}

export async function enabledContextDocs(): Promise<ContextDoc[]> {
  return query<ContextDoc>(
    "SELECT id, title, content, enabled FROM context_docs WHERE enabled = TRUE ORDER BY created_at ASC"
  );
}

/**
 * Build the shared-context system block from enabled docs, budgeted to
 * MAX_CONTEXT_CHARS (oldest docs first; the doc that crosses the budget is
 * truncated with a marker).
 */
export function buildContextBlock(docs: ContextDoc[]): string {
  if (docs.length === 0) return "";
  const parts: string[] = [
    "The user maintains shared context documents (notes and transcripts of previous conversations, possibly from other assistants). Treat them as background knowledge from the user:",
  ];
  let remaining = MAX_CONTEXT_CHARS;
  for (const doc of docs) {
    if (remaining <= 0) break;
    let body = doc.content;
    if (body.length > remaining) {
      body = body.slice(0, remaining) + "\n[…truncated to fit the context budget]";
    }
    remaining -= body.length;
    parts.push(`<context_doc title=${JSON.stringify(doc.title)}>\n${body}\n</context_doc>`);
  }
  return parts.join("\n\n");
}

contextRouter.get("/", async (_req, res, next) => {
  try {
    const docs = await query(
      `SELECT id, title, enabled, LENGTH(content) AS chars,
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM context_docs ORDER BY created_at ASC`
    );
    res.json({ docs, maxTotalChars: MAX_CONTEXT_CHARS });
  } catch (err) {
    next(err);
  }
});

contextRouter.get("/:id", async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, title, content, enabled FROM context_docs WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Context document not found." });
      return;
    }
    res.json({ doc: rows[0] });
  } catch (err) {
    next(err);
  }
});

contextRouter.post("/", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 200) : "";
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!title || !content.trim()) {
      res.status(400).json({ error: "Title and content are required." });
      return;
    }
    if (content.length > MAX_DOC_CHARS) {
      res.status(400).json({
        error: `Document too large (max ${MAX_DOC_CHARS.toLocaleString()} characters). Split it up.`,
      });
      return;
    }
    const id = newId();
    const now = Date.now();
    await query(
      `INSERT INTO context_docs (id, title, content, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, TRUE, $4, $4)`,
      [id, title, content, now]
    );
    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

contextRouter.patch("/:id", async (req, res, next) => {
  try {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (typeof req.body?.title === "string" && req.body.title.trim()) {
      params.push(req.body.title.trim().slice(0, 200));
      sets.push(`title = $${params.length}`);
    }
    if (typeof req.body?.content === "string") {
      if (req.body.content.length > MAX_DOC_CHARS) {
        res.status(400).json({ error: "Document too large." });
        return;
      }
      params.push(req.body.content);
      sets.push(`content = $${params.length}`);
    }
    if (typeof req.body?.enabled === "boolean") {
      params.push(req.body.enabled);
      sets.push(`enabled = $${params.length}`);
    }
    if (sets.length === 0) {
      res.status(400).json({ error: "Nothing to update." });
      return;
    }
    params.push(Date.now());
    sets.push(`updated_at = $${params.length}`);
    params.push(req.params.id);
    const rows = await query(
      `UPDATE context_docs SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`,
      params
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Context document not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

contextRouter.delete("/:id", async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM context_docs WHERE id = $1 RETURNING id", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Context document not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Snapshot a conversation's transcript into a context doc. */
contextRouter.post("/from-conversation/:id", async (req, res, next) => {
  try {
    const convs = await query<{ title: string }>(
      "SELECT title FROM conversations WHERE id = $1",
      [req.params.id]
    );
    if (convs.length === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    const messages = await query<{ role: string; content: string; model: string | null }>(
      `SELECT role, content, model FROM messages
        WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC`,
      [req.params.id]
    );
    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : `Assistant (${m.model ?? "model"})`}:\n${m.content}`)
      .join("\n\n---\n\n");
    const content = transcript.slice(0, MAX_DOC_CHARS);
    const id = newId();
    const now = Date.now();
    await query(
      `INSERT INTO context_docs (id, title, content, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, TRUE, $4, $4)`,
      [id, `Chat: ${convs[0].title}`.slice(0, 200), content, now]
    );
    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});
