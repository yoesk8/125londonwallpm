"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TRADES, STATUS_COLOR } from "@/lib/ui";

export default function Building3D({ floors, mode, selected, onSelectFloor }) {
  const mountRef = useRef(null);
  const meshesRef = useRef([]);
  const stateRef = useRef({ floors, mode, selected });
  stateRef.current = { floors, mode, selected };
  const selectRef = useRef(onSelectFloor);
  selectRef.current = onSelectFloor;

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    camera.position.set(30, 26, 34);
    camera.lookAt(0, 11, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
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

    // Floors: podium (1–3) wider, tower (4–16), upper setback (17–18)
    const meshes = [];
    const H = 1.15, GAP = 0.12;
    for (let i = 0; i < 18; i++) {
      const f = i + 1;
      let w = 11, d = 9;
      if (f <= 3) { w = 15; d = 12; }
      else if (f >= 17) { w = 9; d = 7.5; }
      const geo = new THREE.BoxGeometry(w, H, d);
      const mat = new THREE.MeshLambertMaterial({ color: 0x46536a });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = i * (H + GAP) + H / 2;
      mesh.userData.floor = f;
      group.add(mesh);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x0e1218 })
      );
      mesh.add(edges);
      meshes.push(mesh);
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
    meshesRef.current = meshes;

    // Drag to rotate, tap to select
    let dragging = false, moved = 0, px = 0, py = 0, rotY = 0.6, rotX = 0, lastActive = 0;
    const el = renderer.domElement;
    el.style.touchAction = "none";
    const down = (e) => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; lastActive = Date.now(); };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.008;
      rotX = Math.max(-0.15, Math.min(0.45, rotX + dy * 0.003));
      px = e.clientX; py = e.clientY; lastActive = Date.now();
    };
    const up = (e) => {
      if (dragging && moved < 6) {
        const rect = el.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(ndc, camera);
        const hits = ray.intersectObjects(meshesRef.current);
        if (hits.length) selectRef.current(hits[0].object.userData.floor);
      }
      dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const recolor = () => {
      const { floors, mode, selected } = stateRef.current;
      meshesRef.current.forEach((mesh) => {
        const f = floors.find((x) => x.id === mesh.userData.floor);
        if (!f) return;
        let hex;
        if (mode === "Overall") {
          const doneN = TRADES.filter((t) => f.status[t] === "done").length;
          const progN = TRADES.filter((t) => f.status[t] === "progress").length;
          hex = doneN === TRADES.length ? STATUS_COLOR.done
            : doneN + progN > 0 ? STATUS_COLOR.progress
            : STATUS_COLOR.pending;
        } else {
          hex = STATUS_COLOR[f.status[mode]];
        }
        mesh.material.color.set(hex);
        mesh.material.emissive.set(selected === f.id ? 0xff6b1a : 0x000000);
      });
    };

    let raf;
    const tick = () => {
      if (Date.now() - lastActive > 4000) rotY += 0.0025;
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
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
}
