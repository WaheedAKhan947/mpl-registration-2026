"use client";

import { useEffect, useState } from "react";
import LoginCard from "@/components/admin/LoginCard";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogin(email, password) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");
    setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
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
    return <LoginCard onLogin={handleLogin} />;
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />;
}
