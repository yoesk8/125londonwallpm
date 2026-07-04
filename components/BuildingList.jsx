"use client";

import { useState } from "react";
import { C, TRADES, FACES, Tag } from "@/lib/ui";
import FloorMeta from "./FloorMeta";

// Text alternative to the 3D model: Floor 17 → West face → Cladding: In progress
export default function BuildingList({ floors, onCycle, onMeta, canEdit }) {
  const [openFloor, setOpenFloor] = useState(null);

  const floorDone = (f) =>
    FACES.reduce((a, face) => a + TRADES.filter((t) => f.status[face]?.[t] === "done").length, 0);
  const cells = FACES.length * TRADES.length; // 16 per floor

  return (
    <div>
      {[...floors].sort((a, b) => b.id - a.id).map((f) => {
        const done = floorDone(f);
        const open = openFloor === f.id;
        return (
          <div key={f.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => setOpenFloor(open ? null : f.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: "none", border: "none", color: C.text, padding: "12px 14px",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, minWidth: 64 }}>
                Floor {f.id}
              </span>
              <span style={{ fontSize: 12, color: C.dim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.owner}</span>
              <span style={{ fontSize: 12, color: done === cells ? C.done : C.dim, fontWeight: 700 }}>
                {done}/{cells}
              </span>
              <span style={{ height: 6, width: 70, background: C.bg, borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                <span style={{ display: "block", height: "100%", width: `${(done / cells) * 100}%`, background: done === cells ? C.done : C.hivis }} />
              </span>
              <span style={{ color: C.dim, fontSize: 12, width: 14 }}>{open ? "▾" : "▸"}</span>
            </button>

            {open && (
              <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 14px 12px" }}>
                <FloorMeta floor={f} canEdit={canEdit} onSaved={onMeta} compact />
                {FACES.map((face) => (
                  <div key={face} style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.hivis, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                      {face} face
                    </div>
                    {TRADES.map((t) => (
                      <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 6px 10px", borderLeft: `2px solid ${C.line}` }}>
                        <span style={{ fontSize: 13 }}>{t}</span>
                        <button onClick={() => onCycle(f.id, face, t)} disabled={!canEdit}
                          title={canEdit ? "Tap to change status" : "Read-only"}
                          style={{ background: "none", border: "none", cursor: canEdit ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}>
                          <Tag status={f.status[face]?.[t] || "pending"} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
