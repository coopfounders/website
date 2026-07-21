import type {
  ChatStreamEvent,
  ContextDocMeta,
  ConversationSummary,
  Message,
  UsageSummary,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message);
  }
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let retryAfter: number | undefined;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
      if (typeof body?.retryAfter === "number") retryAfter = body.retryAfter;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status, retryAfter);
  }
  return res.json() as Promise<T>;
}

export const api = {
  authCheck: () => jsonFetch<{ ok: true }>("/api/gpt/auth/check"),
  login: (password: string) =>
    jsonFetch<{ ok: true }>("/api/gpt/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () => jsonFetch<{ ok: true }>("/api/gpt/auth/logout", { method: "POST" }),

  listConversations: () =>
    jsonFetch<{ conversations: ConversationSummary[] }>("/api/gpt/conversations"),
  getConversation: (id: string) =>
    jsonFetch<{ conversation: ConversationSummary; messages: Message[] }>(
      `/api/gpt/conversations/${id}`
    ),
  deleteConversation: (id: string) =>
    jsonFetch<{ ok: true }>(`/api/gpt/conversations/${id}`, { method: "DELETE" }),

  listContextDocs: () =>
    jsonFetch<{ docs: ContextDocMeta[]; maxTotalChars: number }>("/api/gpt/context"),
  getContextDoc: (id: string) =>
    jsonFetch<{ doc: { id: string; title: string; content: string; enabled: boolean } }>(
      `/api/gpt/context/${id}`
    ),
  createContextDoc: (title: string, content: string) =>
    jsonFetch<{ ok: true; id: string }>("/api/gpt/context", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    }),
  updateContextDoc: (
    id: string,
    patch: { title?: string; content?: string; enabled?: boolean }
  ) =>
    jsonFetch<{ ok: true }>(`/api/gpt/context/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteContextDoc: (id: string) =>
    jsonFetch<{ ok: true }>(`/api/gpt/context/${id}`, { method: "DELETE" }),
  contextFromConversation: (conversationId: string) =>
    jsonFetch<{ ok: true; id: string }>(
      `/api/gpt/context/from-conversation/${conversationId}`,
      { method: "POST" }
    ),

  usageSummary: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return jsonFetch<UsageSummary>(`/api/gpt/usage/summary${qs ? `?${qs}` : ""}`);
  },
};

export interface ChatRequest {
  conversationId: string | null;
  message: string;
  modelId: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * POST the chat request and stream SSE events back. Returns when the stream
 * ends. Abort via the passed controller to stop generation.
 */
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  abort: AbortController
): Promise<void> {
  const res = await fetch("/api/gpt/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: abort.signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let retryAfter: number | undefined;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
      if (typeof body?.retryAfter === "number") retryAfter = body.retryAfter;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status, retryAfter);
  }
  if (!res.body) throw new ApiError("No response stream.", 500);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as ChatStreamEvent);
      } catch {
        /* malformed frame — skip */
      }
    }
  }
}
