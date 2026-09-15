"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/admin/icons";

export default function LoginCard({ onLogin }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f3f5f4] px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-green/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-gold/20 blur-3xl"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[400px] rounded-3xl border border-ink/10 bg-white p-7 shadow-[0_24px_60px_rgba(16,32,24,0.10)] sm:p-9"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="MPL logo"
            width={64}
            height={64}
            className="mb-4 drop-shadow-[0_8px_18px_rgba(244,182,61,0.45)]"
          />
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-green">Maneri Premier League</p>
          <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-ink">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Enter the admin password to view registrations and manage the site.</p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Password</span>
          <span className="relative block">
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-ink/15 bg-[#fafbfa] py-3 pl-10 pr-11 text-ink outline-none transition focus:border-green focus:bg-white focus:ring-4 focus:ring-green/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink"
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <Button type="submit" disabled={loggingIn} className="mt-5 w-full">
          {loggingIn ? "Signing in..." : "Sign In"}
        </Button>

        {loginError ? (
          <Notice tone="error" className="mt-4">
            {loginError}
          </Notice>
        ) : null}

        <p className="mt-6 text-center text-xs text-muted">
          <a href="/" className="font-bold text-green-dark hover:underline">
            &larr; Back to the website
          </a>
        </p>
      </form>
    </div>
  );
}
