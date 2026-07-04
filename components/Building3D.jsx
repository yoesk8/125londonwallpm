"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TRADES, STATUS_COLOR } from "@/lib/ui";

// Faces are mapped to local axes before rotation:
// North = -Z, South = +Z, East = +X, West = -X (the cone marker shows North)
export default function Building3D({ floors, mode, selected, onSelectFace }) {
  const mountRef = useRef(null);
  const panelsRef = useRef([]);
  const stateRef = useRef({ floors, mode, selected });
  stateRef.current = { floors, mode, selected };
  const selectRef = useRef(onSelectFace);
  selectRef.current = onSelectFace;

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    camera.position.set(30, 26, 34);
    camera.lookAt(0, 11, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75);
    sun.position.set(30, 50, 20);
    scene.add(sun);

    const group = new THREE.Group();
    scene.add(group);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.6, 16),
      new THREE.MeshLambertMaterial({ color: 0x0d1117 })
    );
    plinth.position.y = -0.3;
    group.add(plinth);

    // North marker: hi-vis cone on the plinth pointing along -Z
    const northCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.6, 12),
      new THREE.MeshLambertMaterial({ color: 0xff6b1a })
    );
    northCone.rotation.x = -Math.PI / 2;
    northCone.position.set(0, 0.35, -9.2);
    group.add(northCone);

    // Each floor = 4 selectable face panels around a dark core
    const panels = [];
    const H = 1.15, GAP = 0.12, T = 0.55; // panel thickness
    for (let i = 0; i < 18; i++) {
      const f = i + 1;
      let w = 11, d = 9;
      if (f <= 3) { w = 15; d = 12; }
      else if (f >= 17) { w = 9; d = 7.5; }
      const y = i * (H + GAP) + H / 2;

      const core = new THREE.Mesh(
        new THREE.BoxGeometry(w - 2 * T + 0.02, H, d - 2 * T + 0.02),
        new THREE.MeshLambertMaterial({ color: 0x151b23 })
      );
      core.position.y = y;
      group.add(core);

      const defs = [
        { face: "North", geo: [w, H, T], pos: [0, y, -(d - T) / 2] },
        { face: "South", geo: [w, H, T], pos: [0, y, (d - T) / 2] },
        { face: "East", geo: [T, H, d - 2 * T], pos: [(w - T) / 2, y, 0] },
        { face: "West", geo: [T, H, d - 2 * T], pos: [-(w - T) / 2, y, 0] },
      ];
      defs.forEach(({ face, geo, pos }) => {
        const g = new THREE.BoxGeometry(...geo);
        const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x46536a }));
        mesh.position.set(...pos);
        mesh.userData = { floor: f, face };
        group.add(mesh);
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(g),
          new THREE.LineBasicMaterial({ color: 0x0e1218 })
        );
        mesh.add(edges);
        panels.push(mesh);
      });
    }
    // Barrel roof — a nod to Alban Gate
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(3.75, 3.75, 9, 24, 1, false, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x2a3442 })
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 18 * (H + GAP) + 0.1;
    group.add(roof);
    panelsRef.current = panels;

    // --- Interaction: drag rotates, a short tap (small movement) selects a face ---
    let dragging = false, moved = 0, px = 0, py = 0, downX = 0, downY = 0;
    let rotY = 0.6, rotX = 0, lastActive = 0;
    const TAP_SLOP = 14; // px of total movement still counted as a tap (finger-friendly)
    const el = renderer.domElement;
    el.style.touchAction = "none";

    const down = (e) => {
      dragging = true;
      moved = 0;
      px = downX = e.clientX;
      py = downY = e.clientY;
      lastActive = Date.now();
      try { el.setPointerCapture(e.pointerId); } catch {}
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.008;
      rotX = Math.max(-0.15, Math.min(0.45, rotX + dy * 0.003));
      px = e.clientX; py = e.clientY;
      lastActive = Date.now();
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      // Use net displacement, not accumulated jitter, so shaky fingers still register taps
      const net = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
      if (Math.min(moved, net) > TAP_SLOP) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(panelsRef.current, false);
      if (hits.length) {
        const { floor, face } = hits[0].object.userData;
        selectRef.current({ floor, face });
      }
    };
    const cancel = () => { dragging = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const faceColor = (f, face, mode) => {
      const st = f.status[face] || {};
      if (mode === "Overall") {
        const doneN = TRADES.filter((t) => st[t] === "done").length;
        const progN = TRADES.filter((t) => st[t] === "progress").length;
        return doneN === TRADES.length ? STATUS_COLOR.done
          : doneN + progN > 0 ? STATUS_COLOR.progress
          : STATUS_COLOR.pending;
      }
      return STATUS_COLOR[st[mode] || "pending"];
    };

    const recolor = () => {
      const { floors, mode, selected } = stateRef.current;
      panelsRef.current.forEach((mesh) => {
        const { floor, face } = mesh.userData;
        const f = floors.find((x) => x.id === floor);
        if (!f) return;
        mesh.material.color.set(faceColor(f, face, mode));
        const isSel = selected && selected.floor === floor && selected.face === face;
        mesh.material.emissive.set(isSel ? 0xff6b1a : 0x000000);
      });
    };

    let raf;
    const tick = () => {
      if (Date.now() - lastActive > 4000 && !dragging) rotY += 0.0025;
      group.rotation.y = rotY;
      group.rotation.x = rotX * 0.3;
      recolor();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
}
