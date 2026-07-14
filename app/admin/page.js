"use client";

import { useEffect, useState } from "react";
import LoginCard from "@/components/admin/LoginCard";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogin(password) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");
    setAuthenticated(true);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginCard onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
