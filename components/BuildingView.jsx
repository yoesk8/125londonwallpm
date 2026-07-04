"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, TRADES, FACES, STATUS_ORDER, STATUS_LABEL, STATUS_COLOR, Tag } from "@/lib/ui";
import Building3D from "./Building3D";
import BuildingList from "./BuildingList";
import FloorMeta from "./FloorMeta";

export default function BuildingView({ floors, setFloors, canEdit }) {
  const [view, setView] = useState("3D"); // "3D" | "List"
  const [mode, setMode] = useState("Overall");
  const [selected, setSelected] = useState(null); // { floor, face } | null
  const sel = selected ? floors.find((f) => f.id === selected.floor) : null;

  const cellsPerFloor = FACES.length * TRADES.length;
  const totalCells = floors.length * cellsPerFloor || 1;
  const doneCells = floors.reduce(
    (a, f) => a + FACES.reduce((b, face) => b + TRADES.filter((t) => f.status[face]?.[t] === "done").length, 0),
    0
  );
  const pct = Math.round((doneCells / totalCells) * 100);
  const tradePct = (t) => {
    const total = floors.length * FACES.length || 1;
    const done = floors.reduce((a, f) => a + FACES.filter((face) => f.status[face]?.[t] === "done").length, 0);
    return Math.round((done / total) * 100);
  };

  const cycle = async (floorId, face, trade) => {
    if (!canEdit) return;
    const floor = floors.find((f) => f.id === floorId);
    const current = floor.status[face]?.[trade] || "pending";
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % 3];
    const apply = (fs, value) => fs.map((f) =>
      f.id === floorId
        ? { ...f, status: { ...f.status, [face]: { ...f.status[face], [trade]: value } } }
        : f
    );
    setFloors((fs) => apply(fs, next)); // optimistic
    const { error } = await supabase.from("floor_status").upsert(
      { floor_id: floorId, face, trade, status: next, updated_at: new Date().toISOString() },
      { onConflict: "floor_id,face,trade" }
    );
    if (error) {
      setFloors((fs) => apply(fs, current)); // revert
      alert("Couldn't save that change. Try again.");
    }
  };

  // Called by FloorMeta after a successful save of owner/notes
  const updateMeta = (floorId, patch) =>
    setFloors((fs) => fs.map((f) => (f.id === floorId ? { ...f, ...patch } : f)));

  const Toggle = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {["3D", "List"].map((v) => (
        <button key={v} onClick={() => setView(v)} style={{
          background: view === v ? C.hivis : C.panel,
          color: view === v ? "#16100B" : C.dim,
          border: `1px solid ${view === v ? C.hivis : C.line}`,
          borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>{v === "3D" ? "3D model" : "List"}</button>
      ))}
    </div>
  );

  if (view === "List") {
    return (
      <div style={{ maxWidth: 760 }}>
        <Toggle />
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 12 }}>
          Overall <b style={{ color: C.text }}>{pct}%</b>
          {TRADES.map((t) => <span key={t}> · {t} <b style={{ color: C.text }}>{tradePct(t)}%</b></span>)}
        </div>
        <BuildingList floors={floors} onCycle={cycle} onMeta={updateMeta} canEdit={canEdit} />
      </div>
    );
  }

  return (
    <div>
      <Toggle />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "1 1 340px", minHeight: 440, background: C.panel, borderRadius: 10, border: `1px solid ${C.line}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
            <div style={{ display: "inline-block", marginTop: 6, fontSize: 11, color: C.dim, background: "rgba(18,22,29,0.85)", padding: "4px 8px", borderRadius: 6 }}>
              {mode === "Overall"
                ? "Green = all four trades complete on that face"
                : `Colouring shows ${mode} only — tap Overall for the all-trades view`}
            </div>
          </div>
          <Building3D floors={floors} mode={mode} selected={selected} onSelectFace={setSelected} />
          <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 12, fontSize: 11, color: C.dim, background: "rgba(18,22,29,0.85)", padding: "6px 10px", borderRadius: 6 }}>
            {STATUS_ORDER.map((s) => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 11, color: C.dim }}>
            drag to rotate · tap a face · ▲ cone marks north
          </div>
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
                Tap any face of the model — each floor&apos;s north, east, south, and west elevations track separately.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700 }}>
                    Floor {sel.id} <span style={{ color: C.hivis }}>· {selected.face}</span>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>close ✕</button>
                </div>
                <FloorMeta floor={sel} canEdit={canEdit} onSaved={updateMeta} />
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {FACES.map((face) => (
                    <button key={face} onClick={() => setSelected({ floor: sel.id, face })} style={{
                      background: selected.face === face ? C.panel2 : "transparent",
                      color: selected.face === face ? C.text : C.dim,
                      border: `1px solid ${selected.face === face ? C.hivis : C.line}`,
                      borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{face}</button>
                  ))}
                </div>
                {TRADES.map((t) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 14 }}>{t}</span>
                    <button onClick={() => cycle(sel.id, selected.face, t)} disabled={!canEdit}
                      title={canEdit ? "Tap to change status" : "Read-only"}
                      style={{ background: "none", border: "none", cursor: canEdit ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}>
                      <Tag status={sel.status[selected.face]?.[t] || "pending"} />
                    </button>
                  </div>
                ))}
                {canEdit && (
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>
                    Tap a status to cycle: not started → in progress → complete.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
