"use client";

import { useEffect, useState } from "react";
import LoginCard from "@/components/admin/LoginCard";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  // While signed in, re-check the account every 30 seconds and when the tab
  // comes back: if the owner has switched it off (or removed it), return to
  // the login screen. Network errors are ignored (the next check retries).
  useEffect(() => {
    if (!authenticated) return undefined;
    let stopped = false;
    async function check() {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await res.json();
        if (stopped) return;
        if (!data.authenticated) {
          setNotice("You have been signed out. Your access may have been turned off by the league owner.");
          setAuthenticated(false);
          setUser(null);
        } else {
          setUser((prev) => (prev && prev.role === data.role && prev.name === data.name ? prev : { id: data.id, name: data.name, email: data.email, role: data.role }));
        }
      } catch {
        // Offline for a moment: try again on the next check.
      }
    }
    const timer = setInterval(check, 30000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [authenticated]);

  async function handleLogin(email, password) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");
    setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
    setNotice("");
    setAuthenticated(true);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setUser(null);
  }

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f5f4]">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-green/20 border-t-green"
          />
          <p className="text-sm font-semibold text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginCard key={notice} onLogin={handleLogin} notice={notice} />;
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />;
}
