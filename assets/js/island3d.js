/* =====================================================================
   island3d.js — the floating 3D island diorama in "Walk Information"
   ---------------------------------------------------------------------
   LITE version: no real-time shadows, trees/houses batched into a few
   draw calls, and the 3D scene only renders while something is moving
   (fly-in, toggle, mouse tilt, drag). The gentle "floating" is done
   with CSS, so an idle island costs basically nothing.
   Needs: window.THREE (assets/vendor/three.custom.min.js), window.gsap,
          window.WAW_ISLANDS (assets/data/island-outlines.js)
   Pins/routes live in config.js — you shouldn't need to edit this.
   ===================================================================== */
(function () {
  "use strict";

  const COLORS = {
    navy: 0x272151,
    navyMid: 0x332b6b,
    navyDeep: 0x1b1640,
    lime: 0x7fb829,
    limeDark: 0x5f8d1c,
    sand: 0xf3ead2,
    white: 0xffffff,
    tree: 0x3f7a1a,
    treeLight: 0x6aa324,
    trunk: 0x6b4a2b,
  };

  const ISLAND_SIZE = { guernsey: 9.2, herm: 8.2 };
  const BASE_ROT_Y = { guernsey: 0, herm: 0 }; // 0 = north at the top, like a normal map
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny helpers ------------------------------------------ */
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function projectOutline(outline, size) {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    outline.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    });
    const lon0 = (minLon + maxLon) / 2, lat0 = (minLat + maxLat) / 2;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const raw = ([lon, lat]) => [(lon - lon0) * k * 111320, (lat - lat0) * 110540];
    const w = (maxLon - minLon) * k * 111320, h = (maxLat - minLat) * 110540;
    const s = size / Math.max(w, h);
    const toLocal = (ll) => { const r = raw(ll); return [r[0] * s, r[1] * s]; };
    return { pts: outline.map(toLocal), toLocal };
  }

  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function distToPolyline(px, py, pts, closed) {
    let d = Infinity;
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      d = Math.min(d, distToSeg(px, py, a[0], a[1], b[0], b[1]));
    }
    return d;
  }

  function nearestIndex(pts, p) {
    let best = 0, bd = Infinity;
    pts.forEach((q, i) => {
      const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function pathLength(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }

  /** Move each point inwards (polygon is counter-clockwise, so "left" is inside). */
  function inset(pts, d) {
    const n = pts.length;
    return pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const n1x = -(p[1] - a[1]), n1y = p[0] - a[0];
      const n2x = -(b[1] - p[1]), n2y = b[0] - p[0];
      const l1 = Math.hypot(n1x, n1y) || 1, l2 = Math.hypot(n2x, n2y) || 1;
      const nx = n1x / l1 + n2x / l2, ny = n1y / l1 + n2y / l2;
      const l = Math.hypot(nx, ny) || 1;
      return [p[0] + (nx / l) * d, p[1] + (ny / l) * d];
    });
  }

  function chaikin(pts, iterations, closed) {
    let out = pts;
    for (let k = 0; k < iterations; k++) {
      const next = [];
      const n = out.length;
      if (!closed) next.push(out[0]);
      for (let i = 0; i < (closed ? n : n - 1); i++) {
        const a = out[i], b = out[(i + 1) % n];
        next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      if (!closed) next.push(out[n - 1]);
      out = next;
    }
    return out;
  }

  function buildRoutePoints(proj, routeCfg) {
    const coast = inset(proj.pts, 0.16);
    if (routeCfg === "loop") return { pts: chaikin(coast, 2, true), closed: true };
    const ia = nearestIndex(proj.pts, proj.toLocal(routeCfg.from));
    const ib = nearestIndex(proj.pts, proj.toLocal(routeCfg.to));
    const n = coast.length;
    const fwd = [], back = [];
    for (let i = ia; ; i = (i + 1) % n) { fwd.push(coast[i]); if (i === ib) break; }
    for (let i = ia; ; i = (i - 1 + n) % n) { back.push(coast[i]); if (i === ib) break; }
    const pts = pathLength(fwd) <= pathLength(back) ? fwd : back;
    return { pts: chaikin(pts, 2, false), closed: false };
  }

  /* ---------- textures ------------------------------------------------ */
  function fieldsTexture(THREE, seed) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const r = seeded(seed);
    const tints = ["#7fb829", "#86c02f", "#78ad25", "#8cc63a", "#72a622", "#93cb45"];
    g.fillStyle = "#7fb829";
    g.fillRect(0, 0, 256, 256);
    g.save();
    g.translate(128, 128);
    g.rotate(0.35);
    for (let y = -210; y < 210; y += 23 + r() * 11) {
      let x = -210;
      const h = 22 + r() * 13;
      while (x < 210) {
        const w = 20 + r() * 35;
        g.fillStyle = tints[Math.floor(r() * tints.length)];
        g.fillRect(x, y, w, h);
        g.strokeStyle = "rgba(47,92,18,0.55)";
        g.lineWidth = 1.3;
        g.strokeRect(x, y, w, h);
        x += w;
      }
    }
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.16, 0.16);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function shadowTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(39,33,81,0.34)");
    grd.addColorStop(0.55, "rgba(39,33,81,0.1)");
    grd.addColorStop(1, "rgba(39,33,81,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- island builder ----------------------------------------- */
  function buildIsland(THREE, key, outline, islandCfg) {
    const proj = projectOutline(outline, ISLAND_SIZE[key] || 9);
    const shape = new THREE.Shape(proj.pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const root = new THREE.Group();   // moved by fly-in / fly-out
    const floater = new THREE.Group(); // spin / tilt
    root.add(floater);

    // Lambert = cheaper lighting than Standard and looks great flat-shaded
    const mat = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra || {}));

    // stacked "block" layers: [top Y, depth, horizontal scale, cap, side, bevel]
    const layers = [
      { top: 0, depth: 0.26, s: 1, cap: mat(COLORS.white, { map: fieldsTexture(THREE, key === "herm" ? 77 : 1970) }), side: mat(COLORS.limeDark), bevel: 0.05 },
      { top: -0.31, depth: 0.22, s: 1, cap: mat(COLORS.sand), side: mat(COLORS.sand), bevel: 0 },
      { top: -0.53, depth: 0.85, s: 0.985, cap: mat(COLORS.navy), side: mat(COLORS.navy), bevel: 0 },
      { top: -1.38, depth: 0.7, s: 0.78, cap: mat(COLORS.navyMid), side: mat(COLORS.navyMid), bevel: 0 },
      { top: -2.08, depth: 0.5, s: 0.5, cap: mat(COLORS.navyDeep), side: mat(COLORS.navyDeep), bevel: 0 },
    ];
    layers.forEach((L) => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: L.depth,
        bevelEnabled: L.bevel > 0,
        bevelThickness: L.bevel,
        bevelSize: L.bevel,
        bevelSegments: 1,
        curveSegments: 1,
      });
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, [L.cap, L.side]);
      mesh.scale.set(L.s, 1, L.s);
      mesh.position.y = L.top - L.depth - L.bevel;
      floater.add(mesh);
    });

    // shape (x, north) -> world (x, y, -north)
    const W = (p, y) => new THREE.Vector3(p[0], y, -p[1]);

    // ---- route (drawn on with setDrawRange)
    const route = buildRoutePoints(proj, islandCfg.map.route);
    const curve = new THREE.CatmullRomCurve3(route.pts.map((p) => W(p, 0.05)), route.closed, "centripetal");
    const segs = Math.max(140, route.pts.length * 2);
    const tubeGeo = new THREE.TubeGeometry(curve, segs, 0.075, 5, route.closed);
    const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: COLORS.white }));
    const totalIdx = tubeGeo.index.count;
    tubeGeo.setDrawRange(0, 0);
    floater.add(tube);

    // ---- pins
    const pins = [];
    (islandCfg.map.pins || []).forEach((pin) => {
      const p = proj.toLocal(pin.at);
      const g = new THREE.Group();
      const main = pin.type === "main", alt = pin.type === "alt";
      const h = main ? 1.05 : alt ? 0.85 : 0.5;
      const headR = main ? 0.2 : alt ? 0.16 : 0.1;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, h, 6), mat(COLORS.navy, { flatShading: false }));
      stick.position.y = h / 2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 14, 10), mat(main ? COLORS.lime : alt ? COLORS.white : COLORS.navy, { flatShading: false }));
      head.position.y = h;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.22, 24), new THREE.MeshBasicMaterial({ color: main ? COLORS.lime : COLORS.navy, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.025;
      g.add(stick, head, ring);
      g.position.copy(W(p, 0));
      g.scale.setScalar(0.001);
      floater.add(g);
      pins.push({ cfg: pin, group: g, anchor: new THREE.Vector3(0, h + headR + 0.1, 0) });
    });

    // ---- trees & houses — batched with InstancedMesh (5 draw calls total)
    const rand = seeded(key === "herm" ? 42 : 1970);
    const pinPts = (islandCfg.map.pins || []).map((p) => proj.toLocal(p.at));
    const area = Math.abs(proj.pts.reduce((a, p, i) => { const q = proj.pts[(i + 1) % proj.pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
    const target = Math.round(area * (key === "herm" ? 1.6 : 0.85));
    const items = { cone: [], round: [], trunk: [], house: [], roof: [] };
    let placed = 0, tries = 0;
    while (placed < target && tries < target * 30) {
      tries++;
      const x = (rand() - 0.5) * 10, y = (rand() - 0.5) * 10;
      if (!pointInPoly(x, y, proj.pts)) continue;
      if (distToPolyline(x, y, proj.pts, true) < 0.32) continue;
      if (distToPolyline(x, y, route.pts, route.closed) < 0.34) continue;
      if (pinPts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.55)) continue;
      const pos = W([x, y], 0), sc = 0.75 + rand() * 0.55, rot = rand() * Math.PI;
      if (rand() < 0.28) {
        items.house.push({ pos, sc, rot, y: 0.1 });
        items.roof.push({ pos, sc, rot: rot + Math.PI / 4, y: 0.285, sz: 0.75 });
      } else if (rand() < 0.4) {
        items.round.push({ pos, sc, rot, y: 0.27 });
        items.trunk.push({ pos, sc, rot, y: 0.07 });
      } else {
        items.cone.push({ pos, sc, rot, y: 0.34 });
        items.trunk.push({ pos, sc, rot, y: 0.07 });
      }
      placed++;
    }
    const decoDefs = {
      cone: [new THREE.ConeGeometry(0.17, 0.48, 6), mat(COLORS.tree)],
      round: [new THREE.IcosahedronGeometry(0.17, 0), mat(COLORS.treeLight)],
      trunk: [new THREE.CylinderGeometry(0.035, 0.035, 0.14, 5), mat(COLORS.trunk)],
      house: [new THREE.BoxGeometry(0.3, 0.2, 0.22), mat(COLORS.white)],
      roof: [new THREE.ConeGeometry(0.24, 0.17, 4), mat(COLORS.navy)],
    };
    const deco = [];
    const dummy = new THREE.Object3D();
    Object.keys(items).forEach((k) => {
      const list = items[k];
      if (!list.length) return;
      const im = new THREE.InstancedMesh(decoDefs[k][0], decoDefs[k][1], list.length);
      floater.add(im);
      deco.push({ im, list });
    });
    function setDecoScale(f) {
      deco.forEach(({ im, list }) => {
        list.forEach((d, i) => {
          const s = Math.max(0.001, d.sc * f);
          dummy.position.set(d.pos.x, d.y * s, d.pos.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(s, s, s * (d.sz || 1));
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
        });
        im.instanceMatrix.needsUpdate = true;
      });
    }
    setDecoScale(0.001);

    // ---- two static clouds (merged into one instanced mesh)
    const puffs = [];
    [[-4.6, 1.6, -1.5], [4.4, 2.1, 0.8]].forEach((c) => {
      [[0, 0, 0, 0.42], [0.42, -0.06, 0.1, 0.32], [-0.4, -0.08, 0, 0.3], [0.1, 0.18, -0.05, 0.3]].forEach(([x, y, z, r]) => puffs.push([c[0] + x, c[1] + y, c[2] + z, r]));
    });
    const clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat(COLORS.white), puffs.length);
    puffs.forEach(([x, y, z, r], i) => {
      dummy.position.set(x, y, z); dummy.rotation.set(0, i, 0); dummy.scale.setScalar(r); dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
    });
    root.add(clouds);

    return {
      key, root, floater, tubeGeo, totalIdx, pins, setDecoScale,
      routeProgress: { v: 0 },
      pinScale: { v: 0 },
      decoScale: { v: 0 },
    };
  }

  /* ---------- 2D fallback (no WebGL) ---------------------------------- */
  function render2D(container, outlines, cfg, key) {
    const icfg = cfg.walkInfo.islands[key];
    const proj = projectOutline(outlines[key], 9);
    const route = buildRoutePoints(proj, icfg.map.route);
    const f = (p) => `${(p[0] * 40 + 220).toFixed(1)},${(-p[1] * 40 + 220).toFixed(1)}`;
    const pins = (icfg.map.pins || []).map((pin) => {
      const [x, y] = f(proj.toLocal(pin.at)).split(",");
      return `<g transform="translate(${x},${y})"><circle r="${pin.type === "main" ? 9 : 6}" fill="${pin.type === "main" ? "#7fb829" : "#272151"}" stroke="#fff" stroke-width="3"/><text x="12" y="4" font-size="13" font-weight="700" fill="#272151">${pin.label}</text></g>`;
    }).join("");
    container.querySelector(".island-fallback")?.remove();
    const div = document.createElement("div");
    div.className = "island-fallback";
    div.innerHTML = `<svg viewBox="0 0 440 440" role="img" aria-label="${icfg.label} walk route map">
      <polygon points="${proj.pts.map(f).join(" ")}" fill="#7fb829" stroke="#272151" stroke-width="6" stroke-linejoin="round"/>
      <polyline points="${route.pts.map(f).join(" ")}${route.closed ? " " + f(route.pts[0]) : ""}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>
      ${pins}</svg>`;
    container.appendChild(div);
  }

  /* ---------- main mount ---------------------------------------------- */
  function mount(container, opts) {
    const THREE = window.THREE;
    const gsap = window.gsap;
    const cfg = opts.config;
    const outlines = opts.outlines;
    let current = opts.initial || "guernsey";
    const canvasWrap = container.querySelector(".island-canvas") || container;
    const labelLayer = container.querySelector(".island-labels");

    const dpr = window.devicePixelRatio || 1;
    const small = window.innerWidth < 768;
    let renderer;
    try {
      if (!THREE) throw new Error("three missing");
      // high-res screens don't need antialiasing — skipping it is a big saving on phones
      renderer = new THREE.WebGLRenderer({ antialias: dpr < 1.5, alpha: true, powerPreference: "low-power" });
    } catch (e) {
      render2D(container, outlines, cfg, current);
      container.classList.add("is-fallback");
      return { show: (k) => render2D(container, outlines, cfg, (current = k)), playIntro() {}, fallback: true };
    }

    renderer.setPixelRatio(Math.min(dpr, small ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3b3470, 1.5));
    const sun = new THREE.DirectionalLight(0xfff4dc, 2.0);
    sun.position.set(-6, 12, 7);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xb9f06a, 0.6);
    rim.position.set(6, 3, -6);
    scene.add(rim);

    // soft fake shadow under the island
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(13, 9), new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -4.4;
    scene.add(shadow);

    // Islands are built on demand: the one you see first is built straight away,
    // the other is built in idle time so the toggle is instant.
    const islands = {};
    const labelEls = {};
    function ensure(k) {
      if (islands[k] || !outlines[k] || !cfg.walkInfo.islands[k]) return islands[k];
      const isl = buildIsland(THREE, k, outlines[k], cfg.walkInfo.islands[k]);
      isl.root.visible = false;
      isl.spin = 0; // each island remembers where you spun it to
      scene.add(isl.root);
      islands[k] = isl;
      // HTML labels over the pins
      labelEls[k] = isl.pins.map((p) => {
        const el = document.createElement("div");
        el.className = `pin-label pin-label--${p.cfg.type || "minor"}`;
        el.innerHTML = `<span>${p.cfg.label}</span>${p.cfg.sub ? `<small>${p.cfg.sub}</small>` : ""}`;
        labelLayer && labelLayer.appendChild(el);
        return { el, w: 0, h: 0, on: false };
      });
      labelsMeasured = false;
      // upload geometry/textures + compile shaders now, so the first animated frame doesn't stutter
      isl.root.visible = true;
      // (async on GPUs that support it, so building the island never freezes scrolling)
      if (renderer.compileAsync && renderer.extensions.has("KHR_parallel_shader_compile")) renderer.compileAsync(isl.root, camera, scene).catch(() => {});
      else renderer.compile(isl.root, camera, scene);
      isl.root.visible = false;
      return isl;
    }
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
    function buildRestLater() {
      Object.keys(cfg.walkInfo.islands).forEach((k) => { if (!islands[k]) idle(() => ensure(k), { timeout: 3000 }); });
    }

    const tilt = { x: 0, y: 0, tx: 0, ty: 0, spinV: 0 };
    let stageW = 1, stageH = 1;

    function resize() {
      const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
      if (!w || !h) return;
      stageW = w; stageH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const far = w / h < 1.1 ? 1.5 : 1.16;
      // fairly overhead so the north coast (and the route along it) stays visible
      camera.position.set(0, 12.6 * far, 8.4 * far);
      camera.lookAt(0, -0.5, 0.4);
      camera.updateProjectionMatrix();
      labelsMeasured = false;
      wake(50);
    }

    /* ---- on-demand rendering: only draw while something moves ---- */
    let visible = false, raf = 0, activeUntil = 0, labelsMeasured = false;
    function wake(ms) {
      activeUntil = Math.max(activeUntil, performance.now() + ms);
      if (visible && !raf && !document.hidden) raf = requestAnimationFrame(frame);
    }

    // Mouse: gentle tilt on hover. Mouse or finger: drag sideways to spin.
    // The spin stays wherever you leave it (no snapping back).
    // Touch: vertical swipes still scroll the page (touch-action: pan-y on the stage).
    let dragging = false, lastX = 0;
    if (!prefersReduced) {
      container.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse") {
          const r = container.getBoundingClientRect();
          tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.18;
          tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
        }
        if (dragging) { tilt.spinV += (e.clientX - lastX) * (e.pointerType === "mouse" ? 0.0022 : 0.003); lastX = e.clientX; }
        wake(900);
      }, { passive: true });
      container.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { tilt.tx = tilt.ty = 0; wake(1500); } });
      canvasWrap.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; canvasWrap.classList.add("is-grabbing"); wake(900); });
      const stop = () => { if (dragging) { dragging = false; canvasWrap.classList.remove("is-grabbing"); wake(2500); } };
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop); // page started scrolling instead
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvasWrap);
    resize();

    /* ---- animations ---- */
    function revealDetails(isl, delay) {
      isl.routeProgress.v = 0; isl.pinScale.v = 0; isl.decoScale.v = 0;
      if (!gsap || prefersReduced) {
        isl.routeProgress.v = 1; isl.pinScale.v = 1; isl.decoScale.v = 1;
        isl.setDecoScale(1);
        wake(100);
        return;
      }
      gsap.to(isl.pinScale, { v: 1, duration: 0.7, delay, ease: "back.out(2.2)" });
      gsap.to(isl.decoScale, { v: 1, duration: 0.9, delay: delay * 0.6, ease: "back.out(1.8)", onUpdate: () => isl.setDecoScale(isl.decoScale.v) });
      gsap.to(isl.routeProgress, { v: 1, duration: 2, delay: delay + 0.2, ease: "power2.inOut" });
      wake((delay + 2.8) * 1000);
    }

    function flyIn(isl, from) {
      isl.root.visible = true;
      if (!gsap || prefersReduced) {
        isl.root.position.set(0, 0, 0); isl.root.rotation.set(0, 0, 0); isl.root.scale.setScalar(1);
        revealDetails(isl, 0);
        return;
      }
      const start = from === "below" ? { x: 0, y: -9, z: 2, ry: -1.4 } : { x: 13, y: 2.5, z: -3, ry: 1.6 };
      isl.root.position.set(start.x, start.y, start.z);
      isl.root.rotation.set(0.25, start.ry, 0.15);
      isl.root.scale.setScalar(0.35);
      gsap.to(isl.root.position, { x: 0, y: 0, z: 0, duration: 1.3, ease: "power3.out" });
      gsap.to(isl.root.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power3.out" });
      gsap.to(isl.root.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "back.out(1.25)" });
      revealDetails(isl, 0.8);
    }

    function flyOut(isl) {
      if (!gsap || prefersReduced) { isl.root.visible = false; return; }
      gsap.to(isl.root.position, { x: -13, y: 3, z: -4, duration: 0.75, ease: "power3.in" });
      gsap.to(isl.root.rotation, { y: -1.6, z: -0.2, duration: 0.75, ease: "power2.in" });
      gsap.to(isl.root.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 0.75, ease: "power2.in", onComplete: () => (isl.root.visible = false) });
      wake(900);
    }

    let introDone = false;
    function playIntro() {
      if (introDone) return;
      introDone = true;
      flyIn(ensure(current), "below");
      buildRestLater();
    }

    function show(key) {
      if (key === current || !ensure(key)) return;
      const prev = islands[current];
      current = key;
      tilt.spinV = 0;
      if (!introDone || !prev) { introDone = true; flyIn(islands[key], "below"); buildRestLater(); return; }
      gsap && gsap.killTweensOf([prev.root.position, prev.root.rotation, prev.root.scale]);
      flyOut(prev);
      setTimeout(() => flyIn(islands[key], "side"), prefersReduced ? 0 : 340);
    }

    /* ---- frame ---- */
    const v = new THREE.Vector3();
    function frame() {
      raf = 0;
      tilt.x += (tilt.tx - tilt.x) * 0.08;
      tilt.y += (tilt.ty - tilt.y) * 0.08;
      const cur0 = islands[current];
      if (cur0) cur0.spin = (cur0.spin + tilt.spinV) % (Math.PI * 2);
      tilt.spinV *= 0.9;

      Object.values(islands).forEach((isl) => {
        if (!isl.root.visible) return;
        isl.floater.rotation.x = tilt.x;
        isl.floater.rotation.y = (BASE_ROT_Y[isl.key] || 0) + tilt.y + isl.spin;
        isl.tubeGeo.setDrawRange(0, Math.floor((isl.totalIdx * isl.routeProgress.v) / 3) * 3);
        isl.pins.forEach((p) => p.group.scale.setScalar(Math.max(0.001, isl.pinScale.v)));
      });
      const cur = islands[current];
      shadow.scale.setScalar(cur ? cur.root.scale.x : 1);

      renderer.render(scene, camera);
      updateLabels();
      updateCompass();

      const settling = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) + Math.abs(tilt.spinV) > 0.002;
      if (visible && !document.hidden && (performance.now() < activeUntil || settling || dragging)) raf = requestAnimationFrame(frame);
    }

    const compass = container.querySelector("[data-compass]");
    const n0 = new THREE.Vector3(), n1 = new THREE.Vector3();
    function updateCompass() {
      const isl = islands[current];
      if (!compass || !isl) return;
      n0.set(0, 0, 0); n1.set(0, 0, -3);
      isl.floater.localToWorld(n0); isl.floater.localToWorld(n1);
      n0.project(camera); n1.project(camera);
      compass.style.setProperty("--north", `${(Math.atan2(n1.x - n0.x, n1.y - n0.y) * 57.2958).toFixed(1)}deg`);
    }

    function updateLabels() {
      if (!labelLayer) return;
      if (!labelsMeasured) {
        // measure once (reading sizes every frame causes layout jank)
        Object.values(labelEls).forEach((arr) => arr.forEach((l) => { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }));
        labelsMeasured = true;
      }
      Object.values(islands).forEach((isl) => {
        const on = isl.root.visible && isl.pinScale.v > 0.6 && isl.root.scale.x > 0.95 && Math.abs(isl.root.position.x) < 0.5;
        isl.pins.forEach((p, i) => {
          const l = labelEls[isl.key][i];
          if (!on) { if (l.on) { l.el.classList.remove("is-on"); l.on = false; } return; }
          v.copy(p.anchor);
          p.group.localToWorld(v);
          v.project(camera);
          const x = Math.min(stageW - l.w / 2 - 4, Math.max(l.w / 2 + 4, (v.x * 0.5 + 0.5) * stageW));
          const y = Math.max(l.h + 8, (-v.y * 0.5 + 0.5) * stageH);
          l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          if (!l.on) { l.el.classList.add("is-on"); l.on = true; }
        });
      });
    }

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake(100);
    }).observe(container);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(100); });

    // build + upload the first island now (before it's on screen) so the fly-in is smooth
    ensure(current);

    container.classList.add("is-3d");
    return { show, playIntro, get current() { return current; } };
  }

  window.WAWIsland = { mount };
})();