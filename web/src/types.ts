export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string | null;
  provider?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costUsd?: number | null;
  createdAt?: number;
  /** True while this assistant message is still streaming. */
  streaming?: boolean;
  /** Populated when the request for this message failed. */
  error?: string;
}

export type ChatStreamEvent =
  | { type: "meta"; conversationId: string; userMessageId: string }
  | { type: "text"; text: string }
  | {
      type: "usage";
      messageId: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    }
  | { type: "done" }
  | { type: "error"; message: string; retryable: boolean };

export interface ContextDocMeta {
  id: string;
  title: string;
  enabled: boolean;
  chars: number;
  createdAt: number;
  updatedAt: number;
}

export interface UsageSummary {
  range: { from: number; to: number };
  byProvider: {
    provider: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    costUsd: number;
  }[];
  byModel: {
    provider: string;
    model: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }[];
  daily: { day: string; provider: string; costUsd: number }[];
  recent: {
    ts: number;
    conversationId: string | null;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    costUsd: number;
  }[];
  budgets: { provider: string; capUsd: number | null; spentUsd: number; blocked: boolean }[];
}
