"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, TRADES, FACES, Btn, inputStyle } from "@/lib/ui";
import BuildingView from "@/components/BuildingView";
import TasksView from "@/components/TasksView";
import InventoryView from "@/components/InventoryView";
import TodoView from "@/components/TodoView";
import TeamView from "@/components/TeamView";

// ---------------- Login screen ----------------
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Wrong email or password. Ask the site manager for access.");
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 380, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-block", background: C.hivis, color: "#16100B", fontWeight: 800, fontSize: 11, letterSpacing: 2, padding: "4px 10px", borderRadius: 4, textTransform: "uppercase" }}>
            Rope access · facade works
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 700, margin: "12px 0 2px", letterSpacing: 1 }}>
            125 LONDON WALL
          </h1>
          <div style={{ color: C.dim, fontSize: 13 }}>Cladding · Windows · Mastic · Granite</div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22 }}>
          <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} autoCapitalize="none" inputMode="email" />
          <label style={{ fontSize: 12, color: C.dim, display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} style={{ ...inputStyle, marginBottom: 16 }} />
          {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <Btn onClick={go} disabled={busy} style={{ width: "100%" }}>{busy ? "Signing in…" : "Sign in"}</Btn>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: C.dim, textAlign: "center" }}>
          Accounts are created by the site manager. No public sign-up.
        </div>
      </div>
    </div>
  );
}

// ---------------- Authenticated app ----------------
function Dashboard({ session, profile }) {
  const [tab, setTab] = useState("Building");
  const [floors, setFloors] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inv, setInv] = useState([]);
  const [todos, setTodos] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const canEdit = profile.role === "admin" || profile.role === "manager";
  const isAdmin = profile.role === "admin";

  const loadAll = useCallback(async () => {
    setLoadErr("");
    const [fl, fs, tk, iv, td, tm] = await Promise.all([
      supabase.from("floors").select("*").order("id"),
      supabase.from("floor_status").select("*"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("inventory").select("*").order("id"),
      supabase.from("todos").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, role, created_at").order("created_at"),
    ]);
    const anyError = fl.error || fs.error || tk.error || iv.error || td.error || tm.error;
    if (anyError) {
      setLoadErr("Couldn't load project data. Check your connection and refresh.");
      setLoading(false);
      return;
    }
    // Nest statuses: floor -> face -> trade
    const byFloor = {};
    (fs.data || []).forEach((r) => {
      byFloor[r.floor_id] = byFloor[r.floor_id] || {};
      byFloor[r.floor_id][r.face] = byFloor[r.floor_id][r.face] || {};
      byFloor[r.floor_id][r.face][r.trade] = r.status;
    });
    setFloors((fl.data || []).map((f) => ({
      ...f,
      status: FACES.reduce((acc, face) => ({
        ...acc,
        [face]: TRADES.reduce((a2, t) => ({ ...a2, [t]: byFloor[f.id]?.[face]?.[t] || "pending" }), {}),
      }), {}),
    })));
    setTasks(tk.data || []);
    setInv(iv.data || []);
    setTodos(td.data || []);
    setTeam(tm.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const NAV = ["Building", "Tasks", "Inventory", "To-do", ...(isAdmin ? ["Team"] : [])];
  const lowCount = inv.filter((x) => x.qty < x.min).length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
          125 LONDON WALL <span style={{ color: C.hivis }}>/</span>{" "}
          <span style={{ color: C.dim, fontSize: 15 }}>Facade works</span>
        </div>
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
          {NAV.map((n) => (
            <button key={n} onClick={() => setTab(n)} style={{
              background: tab === n ? C.panel2 : "transparent",
              color: tab === n ? C.text : C.dim,
              border: "none",
              borderBottom: tab === n ? `2px solid ${C.hivis}` : "2px solid transparent",
              padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", borderRadius: "6px 6px 0 0",
            }}>
              {n}{n === "Inventory" && lowCount ? ` (${lowCount}!)` : ""}
            </button>
          ))}
        </nav>
        <div style={{ fontSize: 12, color: C.dim }}>
          {profile.name} · <span style={{ color: C.hivis, textTransform: "capitalize" }}>{profile.role}</span>
        </div>
        <Btn small kind="outline" onClick={() => supabase.auth.signOut()}>Sign out</Btn>
      </header>

      <main style={{ flex: 1, padding: 18, overflow: "auto" }}>
        {loading ? (
          <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading project data…</div>
        ) : loadErr ? (
          <div style={{ color: C.danger, padding: 40, textAlign: "center" }}>
            {loadErr} <div style={{ marginTop: 12 }}><Btn small kind="outline" onClick={() => { setLoading(true); loadAll(); }}>Retry</Btn></div>
          </div>
        ) : (
          <>
            {tab === "Building" && <BuildingView floors={floors} setFloors={setFloors} canEdit={canEdit} />}
            {tab === "Tasks" && <TasksView tasks={tasks} setTasks={setTasks} canEdit={canEdit} />}
            {tab === "Inventory" && <InventoryView inv={inv} setInv={setInv} canEdit={canEdit} />}
            {tab === "To-do" && <TodoView todos={todos} setTodos={setTodos} canEdit={canEdit} />}
            {tab === "Team" && isAdmin && (
              <TeamView team={team} refresh={loadAll} session={session} meId={profile.id} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------- Auth gate ----------------
export default function Page() {
  const [session, setSession] = useState(undefined); // undefined = checking
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.dim }}>Checking session…</div>;
  }
  if (!session) return <Login />;
  if (!profile) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.dim }}>Loading your profile…</div>;
  }
  return <Dashboard session={session} profile={profile} />;
}
