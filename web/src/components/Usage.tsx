import { useEffect, useMemo, useState } from "react";
import { PROVIDERS, type ProviderId } from "@shared/models.config";
import { api } from "../api";
import type { UsageSummary } from "../types";

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#1f8a8a",
  openai: "#0f2744",
};

function providerName(id: string): string {
  return PROVIDERS[id as ProviderId]?.displayName ?? id;
}

function fmtUsd(v: number): string {
  return v < 0.01 && v > 0 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

function fmtTokens(v: number | null | undefined): string {
  const n = v ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function DailyChart({ daily }: { daily: UsageSummary["daily"] }) {
  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = 29; i >= 0; i--) {
      out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
    }
    return out;
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { total: number; parts: { provider: string; v: number }[] }>();
    for (const d of days) map.set(d, { total: 0, parts: [] });
    for (const row of daily) {
      const entry = map.get(row.day);
      if (!entry) continue;
      entry.total += row.costUsd;
      entry.parts.push({ provider: row.provider, v: row.costUsd });
    }
    return map;
  }, [daily, days]);

  const max = Math.max(0.01, ...days.map((d) => byDay.get(d)?.total ?? 0));
  const W = 940;
  const H = 180;
  const pad = 4;
  const bw = (W - pad * 2) / days.length;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" role="img" aria-label="Daily spend, last 30 days">
        {days.map((d, i) => {
          const entry = byDay.get(d)!;
          let y = H;
          return (
            <g key={d}>
              {entry.parts.map((p) => {
                const h = (p.v / max) * (H - 10);
                y -= h;
                return (
                  <rect
                    key={p.provider}
                    x={pad + i * bw + 1.5}
                    y={y}
                    width={Math.max(1, bw - 3)}
                    height={h}
                    rx={1.5}
                    fill={PROVIDER_COLORS[p.provider] ?? "#999"}
                  >
                    <title>{`${d} · ${providerName(p.provider)} · ${fmtUsd(p.v)}`}</title>
                  </rect>
                );
              })}
              {(i === 0 || i === days.length - 1 || i % 7 === 0) && (
                <text
                  x={pad + i * bw + bw / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(47,59,69,0.55)"
                  fontFamily="var(--mono)"
                >
                  {d.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem", color: "var(--muted)" }}>
        {Object.entries(PROVIDER_COLORS).map(([p, c]) => (
          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: c, display: "inline-block" }} />
            {providerName(p)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Usage() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    api
      .usageSummary(from, to)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load usage."));
  }, [from, to]);

  if (error) return <div className="usage-page"><div className="usage-inner"><p>{error}</p></div></div>;
  if (!data) return <div className="usage-page" />;

  return (
    <div className="usage-page">
      <div className="usage-inner">
        <h1>Usage &amp; spend</h1>
        <div className="range-row">
          <label>
            From{" "}
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <h2>Totals by provider (selected range)</h2>
        <div className="stat-cards">
          {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => {
            const row = data.byProvider.find((r) => r.provider === p);
            const budget = data.budgets.find((b) => b.provider === p);
            return (
              <div key={p} className="stat-card">
                <div className="provider">{providerName(p)}</div>
                <div className="spend">{fmtUsd(row?.costUsd ?? 0)}</div>
                <div className="tokens">
                  {fmtTokens(row?.inputTokens)} in · {fmtTokens(row?.outputTokens)} out
                  {row?.cachedTokens ? ` · ${fmtTokens(row.cachedTokens)} cached` : ""} ·{" "}
                  {row?.requests ?? 0} req
                </div>
                {budget && budget.capUsd !== null && (
                  <div className={`cap${budget.blocked ? " blocked" : ""}`}>
                    Month: {fmtUsd(budget.spentUsd)} / {fmtUsd(budget.capUsd)}
                    {budget.blocked ? " — BLOCKED" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <h2>Daily spend — last 30 days</h2>
        <DailyChart daily={data.daily} />

        <h2>By model (selected range)</h2>
        <table className="usage-table">
          <thead>
            <tr>
              <th>Model</th><th>Provider</th><th>Requests</th>
              <th>Input</th><th>Output</th><th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.byModel.map((r) => (
              <tr key={`${r.provider}-${r.model}`}>
                <td>{r.model}</td>
                <td>{providerName(r.provider)}</td>
                <td className="num">{r.requests}</td>
                <td className="num">{fmtTokens(r.inputTokens)}</td>
                <td className="num">{fmtTokens(r.outputTokens)}</td>
                <td className="num">{fmtUsd(r.costUsd)}</td>
              </tr>
            ))}
            {data.byModel.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No usage in this range.</td></tr>
            )}
          </tbody>
        </table>

        <h2>Most recent requests (up to 50)</h2>
        <table className="usage-table">
          <thead>
            <tr>
              <th>Time</th><th>Model</th><th>Input</th>
              <th>Output</th><th>Cached</th><th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={i}>
                <td className="num">{new Date(r.ts).toLocaleString()}</td>
                <td>{r.model}</td>
                <td className="num">{fmtTokens(r.inputTokens)}</td>
                <td className="num">{fmtTokens(r.outputTokens)}</td>
                <td className="num">{fmtTokens(r.cachedTokens)}</td>
                <td className="num">{fmtUsd(r.costUsd)}</td>
              </tr>
            ))}
            {data.recent.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No requests in this range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
