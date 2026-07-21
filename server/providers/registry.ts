import { type ProviderId } from "../../shared/models.config";
import { env } from "../env";
import { AnthropicAdapter } from "./anthropic";
import { OpenAICompatibleAdapter } from "./openai-compatible";
import { ProviderAdapter, ProviderError } from "./types";

/**
 * Provider registry. Adding a provider = one adapter file + one entry here +
 * config entries in shared/models.config.ts. Nothing else changes.
 */
const adapters = new Map<ProviderId, ProviderAdapter>();

function build(provider: ProviderId): ProviderAdapter {
  switch (provider) {
    case "anthropic":
      if (!env.anthropicApiKey) throw missingKey("Anthropic", "ANTHROPIC_API_KEY");
      return new AnthropicAdapter(env.anthropicApiKey);
    case "openai":
      if (!env.openaiApiKey) throw missingKey("OpenAI", "OPENAI_API_KEY");
      return new OpenAICompatibleAdapter(env.openaiApiKey, "OpenAI");
  }
}

function missingKey(label: string, envVar: string): ProviderError {
  return new ProviderError(
    `${label} isn't configured on this server (missing ${envVar}).`,
    false
  );
}

export function getAdapter(provider: ProviderId): ProviderAdapter {
  let adapter = adapters.get(provider);
  if (!adapter) {
    adapter = build(provider);
    adapters.set(provider, adapter);
  }
  return adapter;
}
