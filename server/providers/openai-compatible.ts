import OpenAI from "openai";
import type { ModelConfig } from "../../shared/models.config";
import {
  ChatMessage,
  ProviderAdapter,
  SendOptions,
  StreamEvent,
  toProviderError,
} from "./types";

const DEFAULT_MAX_TOKENS = 8192;

/**
 * Adapter for OpenAI and any OpenAI-compatible API (pass a custom baseURL to
 * point it at another provider). Uses Chat Completions streaming with
 * `stream_options.include_usage` so the final chunk carries real usage.
 */
export class OpenAICompatibleAdapter implements ProviderAdapter {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private providerLabel: string,
    baseURL?: string
  ) {
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  }

  async *sendMessage(
    model: ModelConfig,
    messages: ChatMessage[],
    options: SendOptions
  ): AsyncGenerator<StreamEvent> {
    const maxTokens = Math.min(options.maxTokens ?? DEFAULT_MAX_TOKENS, model.maxOutputTokens);
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
      model: model.id,
      messages: chatMessages,
      stream: true,
      stream_options: { include_usage: true },
      max_completion_tokens: maxTokens,
      ...(model.supportsTemperature && options.temperature !== undefined
        ? { temperature: options.temperature }
        : {}),
    };

    try {
      let stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
      try {
        stream = await this.client.chat.completions.create(params, {
          signal: options.signal,
        });
      } catch (err) {
        // Some OpenAI-compatible servers reject stream_options / max_completion_tokens.
        // Retry once with the legacy parameter shape before giving up.
        const msg = err instanceof Error ? err.message : "";
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? Number((err as { status: unknown }).status)
            : undefined;
        if (status === 400 && /stream_options|max_completion_tokens/i.test(msg)) {
          const { stream_options: _so, max_completion_tokens: _mct, ...rest } = params;
          stream = await this.client.chat.completions.create(
            { ...rest, max_tokens: maxTokens, stream: true },
            { signal: options.signal }
          );
        } else {
          throw err;
        }
      }

      let usage: OpenAI.CompletionUsage | null = null;
      let servedBy = model.id;
      for await (const chunk of stream) {
        if (chunk.model) servedBy = chunk.model;
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield { type: "text", text: delta };
        if (chunk.usage) usage = chunk.usage;
      }

      const cached = usage?.prompt_tokens_details?.cached_tokens ?? 0;
      const promptTokens = usage?.prompt_tokens ?? 0;
      yield {
        type: "done",
        usage: {
          // prompt_tokens includes the cached portion — split it out.
          inputTokens: Math.max(0, promptTokens - cached),
          outputTokens: usage?.completion_tokens ?? 0,
          cachedTokens: cached,
        },
        servedBy,
        stopReason: null,
      };
    } catch (err) {
      throw toProviderError(err, this.providerLabel);
    }
  }
}
