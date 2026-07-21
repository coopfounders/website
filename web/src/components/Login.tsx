import { FormEvent, useState } from "react";
import { api } from "../api";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img
          src="/assets/coop-logo.png"
          alt=""
          width="44"
          height="44"
          style={{ margin: "0 auto 0.75rem", display: "block" }}
        />
        <h1>Coop GPT</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Enter"}
        </button>
        {error && <div className="err">{error}</div>}
      </form>
    </div>
  );
}
