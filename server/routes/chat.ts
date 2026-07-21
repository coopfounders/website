import { Router, type Response } from "express";
import { computeCostUsd, getModel } from "../../shared/models.config";
import { newId, query } from "../db/db";
import { env } from "../env";
import { budgetBlockMessage } from "../middleware/budget-caps";
import { getAdapter } from "../providers/registry";
import { ChatMessage, ProviderError } from "../providers/types";
import { buildContextBlock, enabledContextDocs } from "./context";

export const chatRouter = Router();

/** Rough token estimate for context-budget truncation (chars/4). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Trim oldest messages so the history fits the model's context budget,
 * always keeping the most recent user message.
 */
function fitToContext(
  history: ChatMessage[],
  system: string,
  contextWindow: number,
  maxOutputTokens: number
): ChatMessage[] {
  const budget = contextWindow - maxOutputTokens - 2000; // safety margin
  let total = estimateTokens(system);
  const kept: ChatMessage[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estimateTokens(history[i].content);
    if (kept.length > 0 && total + t > budget) break;
    kept.unshift(history[i]);
    total += t;
  }
  // The API requires the first message to be from the user.
  while (kept.length > 0 && kept[0].role !== "user") kept.shift();
  return kept;
}

function sseWrite(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

chatRouter.post("/", async (req, res, next) => {
  try {
    // ---- Validate input ----
    const body = req.body ?? {};
    const message = typeof body.message === "string" ? body.message : "";
    const modelId = typeof body.modelId === "string" ? body.modelId : "";
    const conversationId =
      typeof body.conversationId === "string" && /^[a-f0-9]{24}$/.test(body.conversationId)
        ? body.conversationId
        : null;
    const presetSystem = typeof body.system === "string" ? body.system.slice(0, 8000) : "";
    const useSharedContext = body.useSharedContext !== false;
    const temperature =
      typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1
        ? body.temperature
        : undefined;
    const maxTokens =
      typeof body.maxTokens === "number" && Number.isInteger(body.maxTokens) && body.maxTokens > 0
        ? body.maxTokens
        : undefined;

    if (!message.trim()) {
      res.status(400).json({ error: "Message is empty." });
      return;
    }
    if (message.length > env.maxInputChars) {
      res.status(400).json({
        error: `Message too long (max ${env.maxInputChars.toLocaleString()} characters).`,
      });
      return;
    }
    const model = getModel(modelId);
    if (!model) {
      res.status(400).json({ error: "Unknown model." });
      return;
    }

    // ---- Budget cap for this provider ----
    const blocked = await budgetBlockMessage(model.provider);
    if (blocked) {
      res.status(429).json({ error: blocked });
      return;
    }

    // ---- Shared context ----
    const contextBlock = useSharedContext
      ? buildContextBlock(await enabledContextDocs())
      : "";
    // Tell every model what the UI can render, so "make me a diagram" yields
    // something the artifact panel can actually draw.
    const uiNote =
      "Rendering note: this chat UI renders fenced ```html code blocks as a live sandboxed preview " +
      "(an iframe with no network access — inline <style>/<script> and inline SVG only; external " +
      "scripts, stylesheets, images, and fonts will not load). When the user asks for a design, " +
      "diagram, mockup, chart, or interactive demo, respond with ONE self-contained ```html block " +
      "that looks good in a light, ~800px-wide frame. Other code blocks render as syntax-highlighted text. " +
      "Every fenced code block also gets a Download button whose file extension comes from the language tag — " +
      "so when the user asks you to create a document or file (report, README, CSV, config, script, etc.), " +
      "put its complete contents in ONE fenced block with the right language tag (```markdown, ```csv, ```json, …). " +
      "PDFs: never emit raw PDF source or LaTeX — the UI cannot render those. When asked for a PDF, produce a " +
      "print-ready ```html document (A4/letter proportions, print-friendly margins and fonts, no interactive " +
      "elements); the preview's Save PDF button opens the print dialog, which saves it as a real PDF.";
    const system = [presetSystem, contextBlock, uiNote].filter(Boolean).join("\n\n");

    // ---- Load or create the conversation ----
    const now = Date.now();
    let convId = conversationId;
    if (convId) {
      const exists = await query("SELECT id FROM conversations WHERE id = $1", [convId]);
      if (exists.length === 0) {
        res.status(404).json({ error: "Conversation not found." });
        return;
      }
    } else {
      convId = newId();
      const title = message.trim().slice(0, 60) || "New chat";
      await query(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES ($1, $2, $3, $3)",
        [convId, title, now]
      );
    }

    const userMessageId = newId();
    await query(
      "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, 'user', $3, $4)",
      [userMessageId, convId, message, now]
    );

    const historyRows = await query<ChatMessage>(
      "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC",
      [convId]
    );
    const history = fitToContext(historyRows, system, model.contextWindow, model.maxOutputTokens);

    // ---- Stream via SSE ----
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const abort = new AbortController();
    res.on("close", () => abort.abort());

    sseWrite(res, { type: "meta", conversationId: convId, userMessageId });

    const assistantMessageId = newId();
    let assistantText = "";
    let finished = false;

    const saveAssistant = async (
      tokens: { input: number; output: number; cost: number } | null,
      servedBy: string | null
    ) => {
      await query(
        `INSERT INTO messages
           (id, conversation_id, role, content, model, provider, input_tokens, output_tokens, cost_usd, created_at)
         VALUES ($1, $2, 'assistant', $3, $4, $5, $6, $7, $8, $9)`,
        [
          assistantMessageId,
          convId,
          assistantText,
          servedBy ?? model.id,
          model.provider,
          tokens?.input ?? null,
          tokens?.output ?? null,
          tokens?.cost ?? null,
          Date.now(),
        ]
      );
      await query("UPDATE conversations SET updated_at = $1 WHERE id = $2", [Date.now(), convId]);
    };

    try {
      const adapter = getAdapter(model.provider);
      const stream = adapter.sendMessage(model, history, {
        system: system || undefined,
        temperature,
        maxTokens,
        signal: abort.signal,
      });

      for await (const event of stream) {
        if (event.type === "text") {
          assistantText += event.text;
          sseWrite(res, { type: "text", text: event.text });
        } else if (event.type === "done") {
          const { inputTokens, outputTokens, cachedTokens } = event.usage;
          const cost = computeCostUsd(model, inputTokens, outputTokens, cachedTokens);
          // Record real provider-reported usage.
          await query(
            `INSERT INTO usage (ts, conversation_id, provider, model, input_tokens, output_tokens, cached_tokens, cost_usd)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [Date.now(), convId, model.provider, event.servedBy, inputTokens, outputTokens, cachedTokens, cost]
          );
          await saveAssistant(
            { input: inputTokens + cachedTokens, output: outputTokens, cost },
            event.servedBy
          );
          finished = true;
          sseWrite(res, {
            type: "usage",
            messageId: assistantMessageId,
            model: event.servedBy,
            inputTokens: inputTokens + cachedTokens,
            outputTokens,
            costUsd: cost,
          });
        }
      }
      sseWrite(res, { type: "done" });
    } catch (err) {
      if (abort.signal.aborted) {
        // Client hit Stop (or disconnected). Keep whatever streamed so far.
        if (assistantText.length > 0 && !finished) await saveAssistant(null, null);
        res.end();
        return;
      }
      const pErr =
        err instanceof ProviderError
          ? err
          : new ProviderError("Something went wrong. Try again.", true, String(err));
      console.error(`[chat] provider error (${model.provider}/${model.id}):`, pErr.message);
      if (assistantText.length > 0 && !finished) await saveAssistant(null, null);
      sseWrite(res, {
        type: "error",
        message: pErr.friendlyMessage,
        retryable: pErr.retryable,
      });
    }
    res.end();
  } catch (err) {
    next(err);
  }
});
