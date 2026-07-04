"use client";

import { useState } from "react";
import { C, Btn, inputStyle } from "@/lib/ui";

export default function TeamView({ team, refresh, session, meId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const api = async (method, body) => {
    const res = await fetch("/api/admin/users", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  };

  const add = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setMsg("Fill in name and email, and use a password of at least 8 characters.");
      return;
    }
    setBusy(true); setMsg("");
    try {
      await api("POST", { name: name.trim(), email: email.trim(), password, role });
      setName(""); setEmail(""); setPassword("");
      setMsg("User created. Share their email and password with them directly.");
      await refresh();
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const changeRole = async (id, newRole) => {
    setBusy(true); setMsg("");
    try { await api("PATCH", { id, role: newRole }); await refresh(); }
    catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const remove = async (id, name) => {
    if (!confirm(`Remove ${name}? They will lose access immediately.`)) return;
    setBusy(true); setMsg("");
    try { await api("DELETE", { id }); await refresh(); }
    catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>
        Add floor owners as <b style={{ color: C.text }}>viewers</b> so they can follow progress without changing anything.
        Give your crew leads <b style={{ color: C.text }}>manager</b> access.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" autoCapitalize="none" style={inputStyle} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" style={inputStyle} />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          <option value="admin">Admin — full control</option>
          <option value="manager">Manager — edit works</option>
          <option value="viewer">Viewer — read only</option>
        </select>
      </div>
      <Btn onClick={add} disabled={busy} style={{ marginBottom: 10 }}>{busy ? "Working…" : "Add user"}</Btn>
      {msg && <div style={{ fontSize: 13, color: msg.startsWith("User created") ? C.done : C.danger, marginBottom: 12 }}>{msg}</div>}

      {team.map((u) => (
        <div key={u.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name || "Unnamed"}{u.id === meId ? " (you)" : ""}</div>
            <div style={{ fontSize: 12, color: C.dim }}>Joined {new Date(u.created_at).toLocaleDateString("en-GB")}</div>
          </div>
          <select value={u.role} disabled={u.id === meId || busy}
            onChange={(e) => changeRole(u.id, e.target.value)}
            style={{ ...inputStyle, width: 130, padding: "6px 8px", fontSize: 13 }}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
          <Btn kind="danger" small disabled={u.id === meId || busy} onClick={() => remove(u.id, u.name)}>Remove</Btn>
        </div>
      ))}
    </div>
  );
}
