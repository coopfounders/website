import Anthropic from "@anthropic-ai/sdk";
import type { ModelConfig } from "../../shared/models.config";
import {
  ChatMessage,
  ProviderAdapter,
  ProviderError,
  SendOptions,
  StreamEvent,
  toProviderError,
} from "./types";

const DEFAULT_MAX_TOKENS = 8192;

/**
 * Anthropic adapter (official SDK, streaming).
 *
 * Model-specific handling:
 * - claude-fable-5: thinking is always on (no `thinking` param may be sent),
 *   safety classifiers can return stop_reason "refusal", and we opt into the
 *   server-side fallback to claude-opus-4-8 (beta `server-side-fallback-2026-06-01`)
 *   so a policy decline is re-served by Opus in the same call. The model that
 *   actually served the response is reported in the `done` event.
 * - claude-fable-5 / claude-opus-4-8 reject `temperature` — the config flag
 *   `supportsTemperature` gates it.
 */
export class AnthropicAdapter implements ProviderAdapter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *sendMessage(
    model: ModelConfig,
    messages: ChatMessage[],
    options: SendOptions
  ): AsyncGenerator<StreamEvent> {
    const maxTokens = Math.min(options.maxTokens ?? DEFAULT_MAX_TOKENS, model.maxOutputTokens);
    const base = {
      model: model.id,
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(options.system ? { system: options.system } : {}),
      ...(model.supportsTemperature && options.temperature !== undefined
        ? { temperature: options.temperature }
        : {}),
    };

    try {
      const stream =
        model.id === "claude-fable-5"
          ? this.client.beta.messages.stream(
              {
                ...base,
                betas: ["server-side-fallback-2026-06-01"],
                fallbacks: [{ model: "claude-opus-4-8" }],
              },
              { signal: options.signal }
            )
          : this.client.messages.stream(base, { signal: options.signal });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta" &&
          event.delta.text
        ) {
          yield { type: "text", text: event.delta.text };
        }
      }

      const final = await stream.finalMessage();

      if (final.stop_reason === "refusal") {
        throw new ProviderError(
          "The model declined this request for safety reasons. Rephrase it or try another model.",
          false,
          `anthropic refusal (${JSON.stringify(final.stop_details ?? null)})`
        );
      }

      const usage = final.usage;
      yield {
        type: "done",
        usage: {
          // input_tokens is the uncached portion; cache writes are billed near
          // the input rate, so we fold them into inputTokens.
          inputTokens:
            (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0),
          outputTokens: usage.output_tokens ?? 0,
          cachedTokens: usage.cache_read_input_tokens ?? 0,
        },
        servedBy: final.model ?? model.id,
        stopReason: final.stop_reason ?? null,
      };
    } catch (err) {
      throw toProviderError(err, "Anthropic");
    }
  }
}
