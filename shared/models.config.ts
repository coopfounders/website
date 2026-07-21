/**
 * Single source of truth for every model the /gpt app can use.
 * Add or remove models here — nothing else needs to change.
 *
 * Sources (verified 2026-07-20):
 * - Anthropic model IDs & pricing: https://platform.claude.com/docs/en/about-claude/models/overview
 *   (Fable 5 $10/$50 · Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 — all 1M ctx / 128K out;
 *    Haiku 4.5 $1/$5 — 200K ctx / 64K out. Fable 5 and Opus 4.8 reject the
 *    `temperature` parameter, hence supportsTemperature: false.)
 * - OpenAI model IDs & pricing: https://developers.openai.com/api/docs/pricing and
 *   https://developers.openai.com/api/docs/models — GPT-5.6 family (GA 2026-07-09):
 *   gpt-5.6-sol $5/$30 · gpt-5.6-terra $2.50/$15 · gpt-5.6-luna $1/$6, all ~1.05M ctx /
 *   128K out. The GPT-5 reasoning family only accepts default sampling, hence
 *   supportsTemperature: false.
 */

export type ProviderId = "anthropic" | "openai";

export interface ModelConfig {
  /** Exact model string sent to the provider API. */
  id: string;
  provider: ProviderId;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  /** USD per 1M input tokens. */
  inputPerMTok: number;
  /** USD per 1M output tokens. */
  outputPerMTok: number;
  /** Whether the model accepts a non-default `temperature`. */
  supportsTemperature: boolean;
}

export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  /**
   * Multiplier applied to the input rate for cached tokens when computing cost.
   * Anthropic and OpenAI bill cached input at ~10% of the input rate.
   */
  cachedInputFactor: number;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  anthropic: { id: "anthropic", displayName: "Anthropic", cachedInputFactor: 0.1 },
  openai: { id: "openai", displayName: "OpenAI", cachedInputFactor: 0.1 },
};

export const MODELS: ModelConfig[] = [
  // --- Anthropic ---
  {
    id: "claude-fable-5",
    provider: "anthropic",
    displayName: "Claude Fable 5",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 10.0,
    outputPerMTok: 50.0,
    supportsTemperature: false,
  },
  {
    id: "claude-opus-4-8",
    provider: "anthropic",
    displayName: "Claude Opus 4.8",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 5.0,
    outputPerMTok: 25.0,
    supportsTemperature: false,
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    displayName: "Claude Sonnet 4.6",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    supportsTemperature: true,
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    displayName: "Claude Haiku 4.5",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputPerMTok: 1.0,
    outputPerMTok: 5.0,
    supportsTemperature: true,
  },
  // --- OpenAI ---
  {
    id: "gpt-5.6-sol",
    provider: "openai",
    displayName: "GPT-5.6 Sol",
    contextWindow: 1_050_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 5.0,
    outputPerMTok: 30.0,
    supportsTemperature: false,
  },
  {
    id: "gpt-5.6-terra",
    provider: "openai",
    displayName: "GPT-5.6 Terra",
    contextWindow: 1_050_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 2.5,
    outputPerMTok: 15.0,
    supportsTemperature: false,
  },
  {
    id: "gpt-5.6-luna",
    provider: "openai",
    displayName: "GPT-5.6 Luna",
    contextWindow: 1_050_000,
    maxOutputTokens: 128_000,
    inputPerMTok: 1.0,
    outputPerMTok: 6.0,
    supportsTemperature: false,
  },
];

export const DEFAULT_MODEL_ID = "claude-opus-4-8";

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

/**
 * Compute the USD cost of one completion from provider-reported usage.
 * `inputTokens` must be the UNCACHED input portion; `cachedTokens` the
 * cached-read portion (0 when the provider reports none).
 */
export function computeCostUsd(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number
): number {
  const factor = PROVIDERS[model.provider].cachedInputFactor;
  return (
    (inputTokens * model.inputPerMTok) / 1_000_000 +
    (cachedTokens * model.inputPerMTok * factor) / 1_000_000 +
    (outputTokens * model.outputPerMTok) / 1_000_000
  );
}

/** System-prompt presets selectable in the UI. */
export interface SystemPreset {
  id: string;
  name: string;
  prompt: string;
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  { id: "none", name: "No system prompt", prompt: "" },
  {
    id: "concise",
    name: "Concise assistant",
    prompt:
      "Be direct and concise. Answer the question first, then add only detail that changes what the reader would do next. No filler, no restating the question.",
  },
  {
    id: "code-reviewer",
    name: "Code reviewer",
    prompt:
      "You are a rigorous senior engineer reviewing code. Point out correctness bugs first, then security issues, then meaningful simplifications. Quote the exact lines you are commenting on. Do not pad the review with praise or style nits.",
  },
  {
    id: "writing-editor",
    name: "Writing editor",
    prompt:
      "You are a sharp prose editor. Tighten the writing, cut hedging and redundancy, and preserve the author's voice. Show the edited text first, then a short list of the most important changes and why.",
  },
];
