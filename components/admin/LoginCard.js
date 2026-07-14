"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function LoginCard({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await onLogin(password);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <form
        onSubmit={handleSubmit}
        className="grid w-[min(380px,calc(100%-32px))] gap-3.5 rounded-2xl border border-ink/10 bg-white p-8 shadow-panel"
      >
        <h1 className="text-xl font-bold text-ink">MPL Admin Login</h1>
        <p className="text-muted">Enter the admin password to view registrations.</p>
        <label className="grid gap-1.5 font-semibold text-ink">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-ink/10 bg-paper px-[13px] py-3 text-ink outline-none transition focus:border-green focus:shadow-[0_0_0_4px_rgba(11,107,58,0.12)]"
          />
        </label>
        <div className="mt-1.5 flex items-center gap-3.5">
          <Button type="submit" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign In"}
          </Button>
        </div>
        {loginError ? (
          <p className="rounded-lg bg-brand-red/10 px-3.5 py-3 font-semibold text-brand-red">{loginError}</p>
        ) : null}
      </form>
    </div>
  );
}
