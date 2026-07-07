"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [registrations, setRegistrations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (authenticated) loadRegistrations();
  }, [authenticated]);

  async function loadRegistrations() {
    setLoadingData(true);
    setDataError("");
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load registrations.");
      setRegistrations(data.registrations);
    } catch (error) {
      setDataError(error.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      setAuthenticated(true);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setRegistrations([]);
    setPassword("");
  }

  async function handleDelete(id) {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete registration.");
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      alert(error.message);
    }
  }

  if (checkingSession) {
    return (
      <div className="login-wrap">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>MPL Admin Login</h1>
          <p className="muted">Enter the admin password to view registrations.</p>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className="actions">
            <button className="button" type="submit" disabled={loggingIn}>
              {loggingIn ? "Signing in..." : "Sign In"}
            </button>
          </div>
          {loginError ? <p className="message show error">{loginError}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <main className="wrap">
      <div className="dashboard-header">
        <h2>MPL Admin Dashboard</h2>
        <div className="actions" style={{ margin: 0 }}>
          <a className="button" href="/api/admin/export">
            Export Excel
          </a>
          <button className="button secondary" onClick={loadRegistrations}>
            Refresh
          </button>
          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <strong>{registrations.length}</strong>
          <span>Total Registrations</span>
        </div>
      </div>

      {dataError ? <p className="message show error">{dataError}</p> : null}
      {loadingData ? <p className="muted">Loading registrations...</p> : null}

      {!loadingData && registrations.length === 0 && !dataError ? (
        <p className="muted">No registrations yet.</p>
      ) : null}

      {registrations.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Submitted</th>
                <th>Player Name</th>
                <th>Father Name</th>
                <th>Age</th>
                <th>Phone</th>
                <th>CNIC</th>
                <th>Village</th>
                <th>Team</th>
                <th>Role</th>
                <th>Batting</th>
                <th>Bowling</th>
                <th>Experience</th>
                <th>Notes</th>
                <th>CNIC Image</th>
                <th>Fee Receipt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.profilePicture ? (
                      <img className="thumb" src={r.profilePicture} alt={r.playerName} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                  <td>{r.playerName}</td>
                  <td>{r.fatherName}</td>
                  <td>{r.age}</td>
                  <td>{r.phone}</td>
                  <td>{r.cnicNumber}</td>
                  <td>{r.area}</td>
                  <td>{r.preferredTeam}</td>
                  <td>{r.playingRole}</td>
                  <td>{r.battingStyle}</td>
                  <td>{r.bowlingStyle}</td>
                  <td>{r.experience}</td>
                  <td>{r.notes}</td>
                  <td>
                    {r.cnicImage ? (
                      <a href={r.cnicImage} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {r.feeReceipt ? (
                      <a href={r.feeReceipt} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => handleDelete(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
