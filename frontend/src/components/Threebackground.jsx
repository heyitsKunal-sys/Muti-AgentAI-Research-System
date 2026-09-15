import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ThreeBackground
 * ----------------
 * A fixed, full-viewport 3D scene that sits behind your page content:
 * four wireframe "agent" nodes drifting and rotating on their own,
 * linked by faint lines, with a soft particle field behind them.
 * The whole scene gently steers toward the cursor as it moves.
 *
 * It renders on a transparent WebGL canvas, so your page's own
 * background color/gradient shows through wherever there's no shape.
 * It keeps running normally while the page scrolls underneath it —
 * position: fixed means it always covers the viewport, and nothing
 * here is scroll-triggered.
 *
 * USAGE
 * -----
 *   import ThreeBackground from "./ThreeBackground";
 *
 *   export default function LandingPage() {
 *     return (
 *       <div style={{ position: "relative", background: "#0A0E17" }}>
 *         <ThreeBackground />
 *
 *         {/* wrap your actual page content in a positioned layer *\/}
 *         <div style={{ position: "relative", zIndex: 10 }}>
 *           <YourHeader />
 *           <YourHeroSection />
 *           ...
 *         </div>
 *       </div>
 *     );
 *   }
 *
 * That z-10 wrapper matters: the canvas uses zIndex 0 and
 * position: fixed, so your real content needs a positioned stacking
 * context above it (relative/absolute + a higher z-index) or the
 * canvas can end up painting over plain, non-positioned content.
 *
 * PROPS
 * -----
 * @param {number}  [zIndex=0]      Stacking order of the canvas layer.
 * @param {number}  [nodeCount=4]   How many floating wireframe nodes.
 * @param {number}  [particleCount=130]  How many background particles.
 * @param {string[]} [colors]       Hex colors (as CSS strings, e.g. "#6366F1")
 *                                  cycled across the nodes/lines/particles.
 * @param {boolean} [interactive=true]  Whether the scene follows the cursor.
 */
export default function ThreeBackground({
  zIndex = 0,
  nodeCount = 4,
  particleCount = 130,
  colors = ["#6366F1", "#A855F7", "#22D3EE", "#818CF8"],
  interactive = true,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const palette = colors.map((c) => new THREE.Color(c).getHex());

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // floating wireframe nodes 
    const shapePool = [
      () => new THREE.IcosahedronGeometry(1.15, 0),
      () => new THREE.OctahedronGeometry(1.05, 0),
      () => new THREE.IcosahedronGeometry(0.95, 1),
      () => new THREE.TorusGeometry(0.85, 0.26, 8, 22),
    ];

    const nodeGeometries = Array.from({ length: nodeCount }, (_, i) =>
      shapePool[i % shapePool.length]()
    );

    const nodes = [];
    nodeGeometries.forEach((geo, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / nodeGeometries.length) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * 6.2,
        Math.sin(angle) * 3.4,
        i % 2 === 0 ? -1.5 : 1.5
      );
      mesh.userData = {
        baseX: mesh.position.x,
        baseY: mesh.position.y,
        speed: 0.35 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
        rotSpeed: 0.12 + Math.random() * 0.18,
      };
      group.add(mesh);
      nodes.push(mesh);
    });

    // drifting particle field for depth 
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x9aa3ff,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    //connecting lines threading the nodes into a loop
    const lineMat = new THREE.LineBasicMaterial({
      color: palette[0],
      transparent: true,
      opacity: 0.22,
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(nodes.length * 2 * 3), 3)
    );
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    if (nodes.length > 1) group.add(lines);

    function updateLines() {
      if (nodes.length < 2) return;
      const arr = lineGeo.attributes.position.array;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i].position;
        const b = nodes[(i + 1) % nodes.length].position;
        arr[i * 6] = a.x;
        arr[i * 6 + 1] = a.y;
        arr[i * 6 + 2] = a.z;
        arr[i * 6 + 3] = b.x;
        arr[i * 6 + 4] = b.y;
        arr[i * 6 + 5] = b.z;
      }
      lineGeo.attributes.position.needsUpdate = true;
    }

    // cursor tracking, smoothed toward a target 
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    function handlePointerMove(e) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    const clock = new THREE.Clock();
    let frameId;

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (interactive) {
        current.x += (target.x - current.x) * 0.045;
        current.y += (target.y - current.y) * 0.045;
      }

      group.rotation.y = current.x * 0.4;
      group.rotation.x = -current.y * 0.22;
      camera.position.x += (current.x * 2.6 - camera.position.x) * 0.03;
      camera.position.y += (current.y * 1.6 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      nodes.forEach((mesh) => {
        const d = mesh.userData;
        mesh.position.y = d.baseY + Math.sin(t * d.speed + d.offset) * 0.55;
        mesh.position.x = d.baseX + Math.cos(t * d.speed * 0.6 + d.offset) * 0.3;
        mesh.rotation.x += d.rotSpeed * 0.01;
        mesh.rotation.y += d.rotSpeed * 0.014;
      });
      updateLines();
      particles.rotation.y = t * 0.015;

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
      window.removeEventListener("resize", handleResize);
      nodeGeometries.forEach((g) => g.dispose());
      nodes.forEach((m) => m.material.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once — see note below

  return (
    <div
      ref={mountRef}
      className="fixed inset-0"
      style={{ zIndex, pointerEvents: "none" }}
    />
  );
}

