import { Router } from "express";
import { query } from "../db/db";

export const conversationsRouter = Router();

conversationsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM conversations ORDER BY updated_at DESC LIMIT 200`
    );
    res.json({ conversations: rows });
  } catch (err) {
    next(err);
  }
});

conversationsRouter.get("/:id", async (req, res, next) => {
  try {
    const convs = await query(
      `SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM conversations WHERE id = $1`,
      [req.params.id]
    );
    if (convs.length === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    const messages = await query(
      `SELECT id, role, content, model, provider,
              input_tokens AS "inputTokens", output_tokens AS "outputTokens",
              cost_usd AS "costUsd", created_at AS "createdAt"
         FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC`,
      [req.params.id]
    );
    res.json({ conversation: convs[0], messages });
  } catch (err) {
    next(err);
  }
});

conversationsRouter.delete("/:id", async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM conversations WHERE id = $1 RETURNING id", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

conversationsRouter.patch("/:id", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title || title.length > 200) {
      res.status(400).json({ error: "Title must be 1-200 characters." });
      return;
    }
    const rows = await query(
      "UPDATE conversations SET title = $1, updated_at = $2 WHERE id = $3 RETURNING id",
      [title, Date.now(), req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
