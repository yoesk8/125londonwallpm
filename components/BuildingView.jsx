"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, TRADES, STATUS_ORDER, STATUS_LABEL, STATUS_COLOR, Tag } from "@/lib/ui";
import Building3D from "./Building3D";

export default function BuildingView({ floors, setFloors, canEdit }) {
  const [mode, setMode] = useState("Overall");
  const [selected, setSelected] = useState(null);
  const sel = floors.find((f) => f.id === selected);

  const totalCells = floors.length * TRADES.length || 1;
  const doneCells = floors.reduce((a, f) => a + TRADES.filter((t) => f.status[t] === "done").length, 0);
  const pct = Math.round((doneCells / totalCells) * 100);
  const tradePct = (t) =>
    floors.length ? Math.round((floors.filter((f) => f.status[t] === "done").length / floors.length) * 100) : 0;

  const cycle = async (floorId, trade) => {
    if (!canEdit) return;
    const floor = floors.find((f) => f.id === floorId);
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(floor.status[trade]) + 1) % 3];
    // Optimistic update, revert on failure
    setFloors((fs) => fs.map((f) => f.id === floorId ? { ...f, status: { ...f.status, [trade]: next } } : f));
    const { error } = await supabase.from("floor_status").upsert(
      { floor_id: floorId, trade, status: next, updated_at: new Date().toISOString() },
      { onConflict: "floor_id,trade" }
    );
    if (error) {
      setFloors((fs) => fs.map((f) => f.id === floorId ? { ...f, status: { ...f.status, [trade]: floor.status[trade] } } : f));
      alert("Couldn't save that change. Try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, minHeight: "100%" }}>
      <div style={{ flex: "1 1 340px", minHeight: 440, background: C.panel, borderRadius: 10, border: `1px solid ${C.line}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Overall", ...TRADES].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? C.hivis : "rgba(18,22,29,0.85)",
              color: mode === m ? "#16100B" : C.text,
              border: `1px solid ${mode === m ? C.hivis : C.line}`,
              borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>{m}{m !== "Overall" ? ` · ${tradePct(m)}%` : ""}</button>
          ))}
        </div>
        <Building3D floors={floors} mode={mode} selected={selected} onSelectFloor={setSelected} />
        <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 12, fontSize: 11, color: C.dim, background: "rgba(18,22,29,0.85)", padding: "6px 10px", borderRadius: 6 }}>
          {STATUS_ORDER.map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 11, color: C.dim }}>drag to rotate · tap a floor</div>
      </div>

      <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 12, minWidth: 280 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>Overall completion</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 700 }}>{pct}%</div>
          <div style={{ height: 8, background: C.bg, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.hivis }} />
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TRADES.map((t) => (
              <div key={t} style={{ fontSize: 12, color: C.dim }}>
                {t} <span style={{ color: C.text, fontWeight: 700 }}>{tradePct(t)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, flex: 1, overflow: "auto" }}>
          {!sel ? (
            <div style={{ color: C.dim, fontSize: 14 }}>
              Tap a floor on the model to see its managing agent and update each trade&apos;s status.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700 }}>Floor {sel.id}</div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>close ✕</button>
              </div>
              <div style={{ fontSize: 13, color: C.dim, marginBottom: 12 }}>
                Managed by <span style={{ color: C.text }}>{sel.owner}</span>
              </div>
              {TRADES.map((t) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 14 }}>{t}</span>
                  <button onClick={() => cycle(sel.id, t)} disabled={!canEdit} title={canEdit ? "Tap to change status" : "Read-only"}
                    style={{ background: "none", border: "none", cursor: canEdit ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}>
                    <Tag status={sel.status[t]} />
                  </button>
                </div>
              ))}
              {canEdit && (
                <div style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>
                  Tap a status to cycle: not started → in progress → complete. Changes save for everyone instantly.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
