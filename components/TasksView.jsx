"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, TRADES, STATUS_ORDER, Btn, Tag, inputStyle } from "@/lib/ui";

export default function TasksView({ tasks, setTasks, canEdit }) {
  const [title, setTitle] = useState("");
  const [floor, setFloor] = useState(1);
  const [trade, setTrade] = useState(TRADES[0]);

  const add = async () => {
    if (!title.trim()) return;
    const { data, error } = await supabase.from("tasks")
      .insert({ title: title.trim(), floor: +floor, trade })
      .select().single();
    if (error) return alert("Couldn't add the task. Try again.");
    setTasks((ts) => [data, ...ts]);
    setTitle("");
  };

  const cycle = async (t) => {
    if (!canEdit) return;
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(t.status) + 1) % 3];
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", t.id);
    if (error) {
      setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, status: t.status } : x)));
      alert("Couldn't save that change. Try again.");
    }
  };

  const remove = async (id) => {
    const prev = tasks;
    setTasks((ts) => ts.filter((x) => x.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { setTasks(prev); alert("Couldn't delete the task. Try again."); }
  };

  return (
    <div>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New task, e.g. Mastic joints floor 6, east drops" style={{ ...inputStyle, flex: "1 1 240px" }} />
          <select value={floor} onChange={(e) => setFloor(e.target.value)} style={{ ...inputStyle, width: 90 }}>
            {Array.from({ length: 18 }, (_, i) => <option key={i + 1} value={i + 1}>Fl {i + 1}</option>)}
          </select>
          <select value={trade} onChange={(e) => setTrade(e.target.value)} style={{ ...inputStyle, width: 130 }}>
            {TRADES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <Btn onClick={add}>Add task</Btn>
        </div>
      )}
      {tasks.length === 0 && <div style={{ color: C.dim, fontSize: 14 }}>No tasks yet. Add the first one above.</div>}
      {tasks.map((t) => (
        <div key={t.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: C.dim }}>
              Floor {t.floor} · {t.trade} · {t.assignee}{t.due ? ` · due ${t.due}` : ""}
            </div>
          </div>
          <button onClick={() => cycle(t)} style={{ background: "none", border: "none", cursor: canEdit ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}>
            <Tag status={t.status} />
          </button>
          {canEdit && <Btn kind="danger" small onClick={() => remove(t.id)}>Delete</Btn>}
        </div>
      ))}
    </div>
  );
}
