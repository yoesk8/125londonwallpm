"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, Btn, inputStyle } from "@/lib/ui";

export default function TodoView({ todos, setTodos, canEdit }) {
  const [text, setText] = useState("");

  const add = async () => {
    if (!text.trim()) return;
    const { data, error } = await supabase.from("todos").insert({ text: text.trim() }).select().single();
    if (error) return alert("Couldn't add that. Try again.");
    setTodos((ts) => [data, ...ts]);
    setText("");
  };

  const toggle = async (t) => {
    if (!canEdit) return;
    setTodos((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    const { error } = await supabase.from("todos").update({ done: !t.done }).eq("id", t.id);
    if (error) {
      setTodos((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: t.done } : x)));
      alert("Couldn't save that change. Try again.");
    }
  };

  const remove = async (id) => {
    const prev = todos;
    setTodos((ts) => ts.filter((x) => x.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) { setTodos(prev); alert("Couldn't delete that. Try again."); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a to-do…" style={inputStyle} />
          <Btn onClick={add}>Add</Btn>
        </div>
      )}
      {todos.length === 0 && <div style={{ color: C.dim, fontSize: 14 }}>Nothing on the list. Add the first to-do above.</div>}
      {todos.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 14px", marginBottom: 8 }}>
          <input type="checkbox" checked={t.done} disabled={!canEdit} onChange={() => toggle(t)}
            style={{ width: 18, height: 18, accentColor: C.hivis }} />
          <span style={{ fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.dim : C.text, flex: 1 }}>
            {t.text}
          </span>
          {canEdit && <Btn kind="danger" small onClick={() => remove(t.id)}>✕</Btn>}
        </div>
      ))}
    </div>
  );
}
