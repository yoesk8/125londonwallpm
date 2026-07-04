"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, Btn, inputStyle } from "@/lib/ui";

export default function InventoryView({ inv, setInv, canEdit }) {
  // Add-item form
  const [item, setItem] = useState("");
  const [unit, setUnit] = useState("units");
  const [min, setMin] = useState(0);
  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ item: "", unit: "", qty: 0, min: 0 });
  const [busy, setBusy] = useState(false);

  const adjust = async (x, d) => {
    if (!canEdit) return;
    const qty = Math.max(0, x.qty + d);
    setInv((xs) => xs.map((y) => (y.id === x.id ? { ...y, qty } : y)));
    const { error } = await supabase.from("inventory").update({ qty }).eq("id", x.id);
    if (error) {
      setInv((xs) => xs.map((y) => (y.id === x.id ? { ...y, qty: x.qty } : y)));
      alert("Couldn't save that change. Try again.");
    }
  };

  const add = async () => {
    if (!item.trim()) return;
    const { data, error } = await supabase.from("inventory")
      .insert({ item: item.trim(), unit: unit.trim() || "units", min: Math.max(0, +min || 0), qty: 0 })
      .select().single();
    if (error) return alert("Couldn't add the item. Try again.");
    setInv((xs) => [...xs, data]);
    setItem(""); setMin(0);
  };

  const startEdit = (x) => {
    setEditingId(x.id);
    setDraft({ item: x.item, unit: x.unit, qty: x.qty, min: x.min });
  };

  const saveEdit = async (x) => {
    const patch = {
      item: draft.item.trim() || x.item,
      unit: draft.unit.trim() || "units",
      qty: Math.max(0, parseInt(draft.qty, 10) || 0),
      min: Math.max(0, parseInt(draft.min, 10) || 0),
    };
    setBusy(true);
    const { error } = await supabase.from("inventory").update(patch).eq("id", x.id);
    setBusy(false);
    if (error) return alert("Couldn't save the item. Try again.");
    setInv((xs) => xs.map((y) => (y.id === x.id ? { ...y, ...patch } : y)));
    setEditingId(null);
  };

  const remove = async (id) => {
    if (!confirm("Remove this item from the inventory?")) return;
    const prev = inv;
    setInv((xs) => xs.filter((y) => y.id !== id));
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) { setInv(prev); alert("Couldn't remove the item. Try again."); }
  };

  const numStyle = { ...inputStyle, padding: "7px 8px", fontSize: 13 };

  return (
    <div style={{ maxWidth: 780 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New item, e.g. Chest ascenders" style={{ ...inputStyle, flex: "1 1 200px" }} />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" style={{ ...inputStyle, width: 90 }} />
          <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" title="Minimum stock level" style={{ ...inputStyle, width: 80 }} />
          <Btn onClick={add}>Add item</Btn>
        </div>
      )}

      {inv.map((x) => {
        const low = x.qty < x.min;
        const editing = editingId === x.id;

        if (editing) {
          return (
            <div key={x.id} style={{ background: C.panel, border: `1px solid ${C.hivis}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 3 }}>Item name</label>
                  <input value={draft.item} onChange={(e) => setDraft((d) => ({ ...d, item: e.target.value }))} style={numStyle} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 90px" }}>
                    <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 3 }}>Unit</label>
                    <input value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))} style={numStyle} />
                  </div>
                  <div style={{ flex: "1 1 90px" }}>
                    <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 3 }}>In stock</label>
                    <input type="number" min="0" value={draft.qty} onChange={(e) => setDraft((d) => ({ ...d, qty: e.target.value }))} style={numStyle} />
                  </div>
                  <div style={{ flex: "1 1 90px" }}>
                    <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 3 }}>Minimum (reorder at)</label>
                    <input type="number" min="0" value={draft.min} onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))} style={numStyle} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small onClick={() => saveEdit(x)} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
                <Btn small kind="outline" onClick={() => setEditingId(null)} disabled={busy}>Cancel</Btn>
              </div>
            </div>
          );
        }

        return (
          <div key={x.id} style={{ background: C.panel, border: `1px solid ${low ? C.danger : C.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{x.item}</div>
              <div style={{ fontSize: 12, color: low ? C.danger : C.dim }}>
                {low ? `Low stock — reorder (min ${x.min})` : `Min level ${x.min} ${x.unit}`}
              </div>
            </div>
            {canEdit && <Btn small kind="outline" onClick={() => adjust(x, -1)}>−</Btn>}
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, minWidth: 60, textAlign: "center" }}>
              {x.qty} <span style={{ fontSize: 12, color: C.dim }}>{x.unit}</span>
            </div>
            {canEdit && <Btn small kind="outline" onClick={() => adjust(x, +1)}>+</Btn>}
            {canEdit && <Btn small kind="outline" onClick={() => startEdit(x)}>Edit</Btn>}
            {canEdit && <Btn small kind="danger" onClick={() => remove(x.id)}>✕</Btn>}
          </div>
        );
      })}
    </div>
  );
}
