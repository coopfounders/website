import type { ModelConfig } from "../../shared/models.config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  signal: AbortSignal;
}

export interface NormalizedUsage {
  /** Uncached input tokens billed at the full input rate. */
  inputTokens: number;
  outputTokens: number;
  /** Cached input tokens (cache reads) if the provider reports them. */
  cachedTokens: number;
}

export type StreamEvent =
  | { type: "text"; text: string }
  | {
      type: "done";
      usage: NormalizedUsage;
      /** The model that actually served the response (may differ under fallback). */
      servedBy: string;
      stopReason: string | null;
    };

/**
 * One adapter per provider. Every adapter normalizes streaming chunks and
 * usage into the same StreamEvent shape — the rest of the app never knows
 * which provider it is talking to. Adding a fourth provider means writing one
 * adapter and registering it in registry.ts.
 */
export interface ProviderAdapter {
  sendMessage(
    model: ModelConfig,
    messages: ChatMessage[],
    options: SendOptions
  ): AsyncGenerator<StreamEvent>;
}

/** Error with a user-safe message; never carries a stack to the client. */
export class ProviderError extends Error {
  constructor(
    /** Friendly message safe to show in the UI. */
    public friendlyMessage: string,
    /** Whether a retry is likely to succeed. */
    public retryable: boolean,
    /** Internal detail for server logs only. */
    detail?: string
  ) {
    super(detail || friendlyMessage);
    this.name = "ProviderError";
  }
}

/** Map an unknown provider/SDK error to a ProviderError with a friendly message. */
export function toProviderError(err: unknown, providerName: string): ProviderError {
  if (err instanceof ProviderError) return err;
  const status: number | undefined =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status: unknown }).status)
      : undefined;
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);

  if (status === 401 || status === 403) {
    return new ProviderError(
      `${providerName} rejected the server's API key. Check the server configuration.`,
      false,
      detail
    );
  }
  if (status === 429) {
    return new ProviderError(
      `${providerName} is rate-limiting us right now. Wait a moment and try again.`,
      true,
      detail
    );
  }
  if (status === 529 || status === 503) {
    return new ProviderError(
      `${providerName} is overloaded right now. Try again shortly, or switch models.`,
      true,
      detail
    );
  }
  if (status !== undefined && status >= 500) {
    return new ProviderError(
      `${providerName} had a server error. Try again shortly.`,
      true,
      detail
    );
  }
  if (status !== undefined && status >= 400) {
    return new ProviderError(
      `${providerName} rejected the request. Try a different model or a shorter message.`,
      false,
      detail
    );
  }
  return new ProviderError(
    `Couldn't reach ${providerName}. Check your connection and try again.`,
    true,
    detail
  );
}
