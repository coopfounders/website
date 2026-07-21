import { query } from "../db/db";
import { env } from "../env";
import { PROVIDERS, type ProviderId } from "../../shared/models.config";

export interface BudgetStatus {
  provider: ProviderId;
  capUsd: number | null;
  spentUsd: number;
  blocked: boolean;
}

function monthStartMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

export async function monthlySpend(provider: ProviderId): Promise<number> {
  const rows = await query<{ total: string | null }>(
    "SELECT COALESCE(SUM(cost_usd), 0) AS total FROM usage WHERE provider = $1 AND ts >= $2",
    [provider, monthStartMs()]
  );
  return Number(rows[0]?.total ?? 0);
}

export async function budgetStatus(provider: ProviderId): Promise<BudgetStatus> {
  const capUsd = env.monthlyCaps[provider] ?? null;
  const spentUsd = await monthlySpend(provider);
  return { provider, capUsd, spentUsd, blocked: capUsd !== null && spentUsd >= capUsd };
}

export async function allBudgetStatuses(): Promise<BudgetStatus[]> {
  return Promise.all((Object.keys(PROVIDERS) as ProviderId[]).map(budgetStatus));
}

/** Friendly blocking message if the provider's monthly cap is hit, else null. */
export async function budgetBlockMessage(provider: ProviderId): Promise<string | null> {
  const status = await budgetStatus(provider);
  if (!status.blocked) return null;
  const label = PROVIDERS[provider].displayName;
  return `${label} is paused: this month's budget cap ($${status.capUsd?.toFixed(
    2
  )}) has been reached ($${status.spentUsd.toFixed(2)} spent). It resets on the 1st.`;
}
