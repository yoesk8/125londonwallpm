"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, Btn, inputStyle } from "@/lib/ui";

// Inline editor for a floor's managing agent + access notes.
// Used by both the 3D detail panel and the list view.
export default function FloorMeta({ floor, canEdit, onSaved, compact }) {
  const [editing, setEditing] = useState(false);
  const [owner, setOwner] = useState(floor.owner || "");
  const [notes, setNotes] = useState(floor.notes || "");
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setOwner(floor.owner || "");
    setNotes(floor.notes || "");
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    const patch = { owner: owner.trim(), notes: notes.trim() };
    const { error } = await supabase.from("floors").update(patch).eq("id", floor.id);
    setBusy(false);
    if (error) return alert("Couldn't save. Try again.");
    onSaved(floor.id, patch);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ margin: "6px 0 12px" }}>
        <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 4 }}>Managing agent</label>
        <input value={owner} onChange={(e) => setOwner(e.target.value)}
          placeholder="e.g. Workman LLP — J. Smith" style={{ ...inputStyle, marginBottom: 8 }} />
        <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 4 }}>Access notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          placeholder="e.g. Call reception ext. 204 before rigging on this level"
          style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
          <Btn small kind="outline" onClick={() => setEditing(false)} disabled={busy}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: compact ? "2px 0 8px" : "2px 0 10px" }}>
      <div style={{ fontSize: 13, color: C.dim }}>
        Managed by <span style={{ color: C.text }}>{floor.owner || "—"}</span>
        {canEdit && (
          <button onClick={startEdit} style={{
            background: "none", border: "none", color: C.hivis, cursor: "pointer",
            fontSize: 12, fontWeight: 700, marginLeft: 8, padding: 0, fontFamily: "inherit",
          }}>Edit</button>
        )}
      </div>
      {floor.notes ? (
        <div style={{ fontSize: 12, color: C.dim, fontStyle: "italic", marginTop: 3 }}>
          {floor.notes}
        </div>
      ) : canEdit ? (
        <button onClick={startEdit} style={{
          background: "none", border: "none", color: C.dim, cursor: "pointer",
          fontSize: 11, padding: 0, marginTop: 3, fontFamily: "inherit", textDecoration: "underline",
        }}>Add access notes</button>
      ) : null}
    </div>
  );
}
