"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, Btn, inputStyle } from "@/lib/ui";

export default function InventoryView({ inv, setInv, canEdit }) {
  const [item, setItem] = useState("");
  const [unit, setUnit] = useState("units");
  const [min, setMin] = useState(0);

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
      .insert({ item: item.trim(), unit: unit.trim() || "units", min: +min || 0, qty: 0 })
      .select().single();
    if (error) return alert("Couldn't add the item. Try again.");
    setInv((xs) => [...xs, data]);
    setItem(""); setMin(0);
  };

  const remove = async (id) => {
    const prev = inv;
    setInv((xs) => xs.filter((y) => y.id !== id));
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) { setInv(prev); alert("Couldn't remove the item. Try again."); }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="New item, e.g. Chest ascenders" style={{ ...inputStyle, flex: "1 1 200px" }} />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" style={{ ...inputStyle, width: 90 }} />
          <input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" style={{ ...inputStyle, width: 80 }} title="Minimum stock level" />
          <Btn onClick={add}>Add item</Btn>
        </div>
      )}
      {inv.map((x) => {
        const low = x.qty < x.min;
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
            {canEdit && <Btn small kind="danger" onClick={() => remove(x.id)}>✕</Btn>}
          </div>
        );
      })}
    </div>
  );
}
