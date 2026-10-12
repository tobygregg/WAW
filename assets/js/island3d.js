/* =====================================================================
   island3d.js — the floating 3D island diorama in "Walk Information"
   ---------------------------------------------------------------------
   Builds a stacked "block" island from the real coastline, draws the
   walking route along the coast, drops pins, and flies islands in/out
   when the Guernsey / Herm toggle is used.
   Needs: window.THREE (assets/vendor/three.custom.min.js), window.gsap,
          window.WAW_ISLANDS (assets/data/island-outlines.js)
   You shouldn't need to edit this — pins/routes live in config.js.
   ===================================================================== */
(function () {
  "use strict";

  const COLORS = {
    navy: 0x272151,
    navyMid: 0x332b6b,
    navyDeep: 0x1b1640,
    navyDeepest: 0x130f2e,
    lime: 0x7fb829,
    limeDark: 0x5f8d1c,
    sand: 0xf3ead2,
    sandDark: 0xdccfa9,
    white: 0xffffff,
    tree: 0x3f7a1a,
    treeLight: 0x6aa324,
    roof: 0x272151,
  };

  const ISLAND_SIZE = { guernsey: 9.2, herm: 8.2 };
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
    return { pts: outline.map(toLocal), toLocal, scale: s };
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
    const x = ax + t * dx, y = ay + t * dy;
    return Math.hypot(px - x, py - y);
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
      let n1x = -(p[1] - a[1]), n1y = p[0] - a[0];
      let n2x = -(b[1] - p[1]), n2y = b[0] - p[0];
      const l1 = Math.hypot(n1x, n1y) || 1, l2 = Math.hypot(n2x, n2y) || 1;
      let nx = n1x / l1 + n2x / l2, ny = n1y / l1 + n2y / l2;
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
    c.width = c.height = 512;
    const g = c.getContext("2d");
    const r = seeded(seed);
    const tints = ["#7fb829", "#86c02f", "#78ad25", "#8cc63a", "#72a622", "#93cb45"];
    g.fillStyle = "#7fb829";
    g.fillRect(0, 0, 512, 512);
    // patchwork fields with hedges
    g.save();
    g.translate(256, 256);
    g.rotate(0.35);
    for (let y = -420; y < 420; y += 46 + r() * 22) {
      let x = -420;
      const h = 44 + r() * 26;
      while (x < 420) {
        const w = 40 + r() * 70;
        g.fillStyle = tints[Math.floor(r() * tints.length)];
        g.fillRect(x, y, w, h);
        g.strokeStyle = "rgba(47,92,18,0.55)";
        g.lineWidth = 2.2;
        g.strokeRect(x, y, w, h);
        x += w;
      }
    }
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.16, 0.16);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function shadowTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, "rgba(39,33,81,0.38)");
    grd.addColorStop(0.55, "rgba(39,33,81,0.12)");
    grd.addColorStop(1, "rgba(39,33,81,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- island builder ----------------------------------------- */
  function buildIsland(THREE, key, outline, islandCfg) {
    const proj = projectOutline(outline, ISLAND_SIZE[key] || 9);
    const shape = new THREE.Shape(proj.pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const root = new THREE.Group();   // moved by fly-in / fly-out
    const floater = new THREE.Group(); // bobbing
    root.add(floater);

    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0, flatShading: true }, extra || {}));

    // layers: [top Y, depth, horizontal scale, capMaterial, sideMaterial, bevel]
    const grassTex = fieldsTexture(THREE, key === "herm" ? 77 : 1970);
    const layers = [
      { top: 0, depth: 0.26, s: 1, cap: std(COLORS.white, { map: grassTex }), side: std(COLORS.limeDark), bevel: 0.05 },
      { top: -0.31, depth: 0.22, s: 1.0, cap: std(COLORS.sand), side: std(COLORS.sand), bevel: 0.03 },
      { top: -0.56, depth: 0.7, s: 0.985, cap: std(COLORS.navy), side: std(COLORS.navy), bevel: 0.02 },
      { top: -1.28, depth: 0.55, s: 0.86, cap: std(COLORS.navyMid), side: std(COLORS.navyMid), bevel: 0.02 },
      { top: -1.85, depth: 0.45, s: 0.66, cap: std(COLORS.navyDeep), side: std(COLORS.navyDeep), bevel: 0.02 },
      { top: -2.32, depth: 0.38, s: 0.42, cap: std(COLORS.navyDeepest), side: std(COLORS.navyDeepest), bevel: 0.02 },
    ];
    layers.forEach((L, i) => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: L.depth,
        bevelEnabled: true,
        bevelThickness: L.bevel,
        bevelSize: L.bevel,
        bevelSegments: i === 0 ? 2 : 1,
        curveSegments: 1,
      });
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, [L.cap, L.side]);
      mesh.scale.set(L.s, 1, L.s);
      mesh.position.y = L.top - L.depth - L.bevel;
      mesh.castShadow = i > 1;
      mesh.receiveShadow = i === 0;
      floater.add(mesh);
    });

    // world helper: shape (x, north) -> world (x, y, -north)
    const W = (p, y) => new THREE.Vector3(p[0], y, -p[1]);

    // ---- route
    const route = buildRoutePoints(proj, islandCfg.map.route);
    const curve = new THREE.CatmullRomCurve3(route.pts.map((p) => W(p, 0.05)), route.closed, "centripetal");
    const segs = Math.max(200, route.pts.length * 3);
    const tubeGeo = new THREE.TubeGeometry(curve, segs, 0.075, 6, route.closed);
    const tubeMat = new THREE.MeshStandardMaterial({ color: COLORS.white, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.4 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.castShadow = true;
    const totalIdx = tubeGeo.index.count;
    tubeGeo.setDrawRange(0, 0);
    floater.add(tube);

    // little navy "walkers" travelling along the route
    const walkerCount = route.closed ? 12 : 10;
    const walkers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 10, 8), std(COLORS.navy, { flatShading: false, roughness: 0.5 }), walkerCount);
    walkers.castShadow = true;
    walkers.visible = false;
    floater.add(walkers);

    // ---- pins
    const pins = [];
    (islandCfg.map.pins || []).forEach((pin) => {
      const p = proj.toLocal(pin.at);
      const g = new THREE.Group();
      const main = pin.type === "main", alt = pin.type === "alt";
      const h = main ? 1.05 : alt ? 0.85 : 0.5;
      const headR = main ? 0.2 : alt ? 0.16 : 0.1;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, h, 8), std(COLORS.navy, { flatShading: false }));
      stick.position.y = h / 2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 14), std(main ? COLORS.lime : alt ? COLORS.white : COLORS.navy, { flatShading: false, roughness: 0.35, emissive: main ? COLORS.lime : 0x000000, emissiveIntensity: main ? 0.25 : 0 }));
      head.position.y = h;
      head.castShadow = stick.castShadow = true;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 32), new THREE.MeshBasicMaterial({ color: main ? COLORS.lime : COLORS.navy, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.025;
      g.add(stick, head, ring);
      g.position.copy(W(p, 0));
      g.scale.setScalar(0.001);
      floater.add(g);
      pins.push({ cfg: pin, group: g, ring, anchor: new THREE.Vector3(0, h + headR + 0.1, 0) });
    });

    // ---- trees & houses (deterministic scatter)
    const rand = seeded(key === "herm" ? 42 : 1970);
    const routePts = route.pts;
    const pinPts = (islandCfg.map.pins || []).map((p) => proj.toLocal(p.at));
    const treeGeo = new THREE.ConeGeometry(0.17, 0.48, 6);
    const treeGeo2 = new THREE.IcosahedronGeometry(0.17, 0);
    const trunkGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 5);
    const houseGeo = new THREE.BoxGeometry(0.3, 0.2, 0.22);
    const roofGeo = new THREE.ConeGeometry(0.24, 0.17, 4);
    const treeMat = std(COLORS.tree), treeMat2 = std(COLORS.treeLight), trunkMat = std(0x6b4a2b);
    const houseMat = std(COLORS.white), roofMat = std(COLORS.roof);
    const area = Math.abs(proj.pts.reduce((a, p, i) => { const q = proj.pts[(i + 1) % proj.pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
    const target = Math.round(area * (key === "herm" ? 2.1 : 1.15));
    let placed = 0, tries = 0;
    const deco = new THREE.Group();
    while (placed < target && tries < target * 30) {
      tries++;
      const x = (rand() - 0.5) * 10, y = (rand() - 0.5) * 10;
      if (!pointInPoly(x, y, proj.pts)) continue;
      if (distToPolyline(x, y, proj.pts, true) < 0.32) continue;
      if (distToPolyline(x, y, routePts, route.closed) < 0.34) continue;
      if (pinPts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.55)) continue;
      const isHouse = rand() < 0.28;
      const g = new THREE.Group();
      if (isHouse) {
        const b = new THREE.Mesh(houseGeo, houseMat); b.position.y = 0.1;
        const r = new THREE.Mesh(roofGeo, roofMat); r.position.y = 0.285; r.rotation.y = Math.PI / 4;
        r.scale.set(1, 1, 0.75);
        b.castShadow = r.castShadow = true;
        g.add(b, r);
      } else {
        const round = rand() < 0.4;
        const t = new THREE.Mesh(round ? treeGeo2 : treeGeo, round ? treeMat2 : treeMat);
        t.position.y = round ? 0.27 : 0.34;
        const tr = new THREE.Mesh(trunkGeo, trunkMat); tr.position.y = 0.07;
        t.castShadow = true;
        g.add(t, tr);
      }
      const sc = 0.75 + rand() * 0.55;
      g.scale.setScalar(sc);
      g.rotation.y = rand() * Math.PI;
      g.position.copy(W([x, y], 0));
      g.userData.baseScale = sc;
      deco.add(g);
      placed++;
    }
    floater.add(deco);

    // ---- clouds
    const clouds = new THREE.Group();
    const cloudMat = std(COLORS.white, { roughness: 1 });
    const cloudSpots = [[-4.6, 1.6, -1.5], [4.4, 2.1, 0.8], [1.2, 1.9, -3.2]];
    cloudSpots.forEach((c, i) => {
      const g = new THREE.Group();
      [[0, 0, 0, 0.42], [0.42, -0.06, 0.1, 0.32], [-0.4, -0.08, 0, 0.3], [0.1, 0.18, -0.05, 0.3]].forEach(([x, y, z, r]) => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), cloudMat);
        m.position.set(x, y, z);
        g.add(m);
      });
      g.position.set(c[0], c[1], c[2]);
      g.userData = { base: c, phase: i * 2.1 };
      clouds.add(g);
    });
    root.add(clouds);

    return {
      key, root, floater, tube, tubeGeo, totalIdx, curve, walkers, walkerCount, pins, deco, clouds,
      routeProgress: { v: 0 },
      pinScale: { v: 0 },
    };
  }

  /* ---------- 2D fallback (no WebGL) ---------------------------------- */
  function render2D(container, outlines, cfg, key) {
    const icfg = cfg.walkInfo.islands[key];
    const proj = projectOutline(outlines[key], 9);
    const route = buildRoutePoints(proj, icfg.map.route);
    const f = (p) => `${(p[0] * 40 + 220).toFixed(1)},${(-p[1] * 40 + 220).toFixed(1)}`;
    const pins = (icfg.map.pins || []).map((pin) => {
      const p = proj.toLocal(pin.at);
      const [x, y] = f(p).split(",");
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

    // WebGL check
    let renderer;
    try {
      if (!THREE) throw new Error("three missing");
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      render2D(container, outlines, cfg, current);
      container.classList.add("is-fallback");
      return { show: (k) => render2D(container, outlines, cfg, (current = k)), playIntro() {}, fallback: true };
    }

    const small = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.6 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3b3470, 1.35));
    const sun = new THREE.DirectionalLight(0xfff4dc, 2.1);
    sun.position.set(-6, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 768 : 1024, small ? 768 : 1024);
    const sc = sun.shadow.camera;
    sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xb9f06a, 0.6);
    rim.position.set(6, 3, -6);
    scene.add(rim);

    // soft shadow on the "ground"
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(13, 9), new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -4.4;
    scene.add(shadow);

    // islands
    const islands = {};
    Object.keys(cfg.walkInfo.islands).forEach((k) => {
      if (!outlines[k]) return;
      const isl = buildIsland(THREE, k, outlines[k], cfg.walkInfo.islands[k]);
      isl.root.visible = false;
      scene.add(isl.root);
      islands[k] = isl;
    });

    // labels (HTML overlay)
    const labelEls = {};
    Object.values(islands).forEach((isl) => {
      labelEls[isl.key] = isl.pins.map((p) => {
        const el = document.createElement("div");
        el.className = `pin-label pin-label--${p.cfg.type || "minor"}`;
        el.innerHTML = `<span>${p.cfg.label}</span>${p.cfg.sub ? `<small>${p.cfg.sub}</small>` : ""}`;
        labelLayer && labelLayer.appendChild(el);
        return el;
      });
    });

    const BASE_ROT_Y = { guernsey: 2.1, herm: 0.5 };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0, spin: 0, spinV: 0 };

    // sizing
    function resize() {
      const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const a = w / h;
      const far = a < 1.1 ? 1.5 : 1.16;
      camera.position.set(0, 11 * far, 10.4 * far);
      camera.lookAt(0, -0.6, 0);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvasWrap);
    resize();

    // pointer tilt + drag spin (mouse only — touch keeps page scrolling)
    let dragging = false, lastX = 0;
    container.addEventListener("pointermove", (e) => {
      const r = container.getBoundingClientRect();
      tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.18;
      tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
      if (dragging) { tilt.spinV += (e.clientX - lastX) * 0.0022; lastX = e.clientX; }
    });
    container.addEventListener("pointerleave", () => { tilt.tx = tilt.ty = 0; dragging = false; });
    canvasWrap.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { dragging = true; lastX = e.clientX; canvasWrap.classList.add("is-grabbing"); } });
    window.addEventListener("pointerup", () => { dragging = false; canvasWrap.classList.remove("is-grabbing"); });

    // ---- animations
    const tl = () => (gsap ? gsap : null);

    function revealDetails(isl, delay) {
      const g = tl();
      isl.routeProgress.v = 0;
      isl.pinScale.v = 0;
      isl.walkers.visible = false;
      if (!g || prefersReduced) {
        isl.routeProgress.v = 1; isl.pinScale.v = 1; isl.walkers.visible = true;
        return;
      }
      g.to(isl.pinScale, { v: 1, duration: 0.7, delay: delay, ease: "back.out(2.2)" });
      g.to(isl.routeProgress, { v: 1, duration: 2.2, delay: delay + 0.2, ease: "power2.inOut", onComplete: () => (isl.walkers.visible = true) });
      isl.deco.children.forEach((d, i) => {
        d.scale.setScalar(0.001);
        g.to(d.scale, { x: d.userData.baseScale, y: d.userData.baseScale, z: d.userData.baseScale, duration: 0.5, delay: delay * 0.6 + i * 0.012, ease: "back.out(2.5)" });
      });
    }

    function flyIn(isl, from) {
      const g = tl();
      isl.root.visible = true;
      if (!g || prefersReduced) {
        isl.root.position.set(0, 0, 0); isl.root.rotation.set(0, 0, 0); isl.root.scale.setScalar(1);
        revealDetails(isl, 0);
        return;
      }
      const start = from === "below" ? { x: 0, y: -9, z: 2, ry: -1.4 } : { x: 13, y: 2.5, z: -3, ry: 1.6 };
      isl.root.position.set(start.x, start.y, start.z);
      isl.root.rotation.set(0.25, start.ry, 0.15);
      isl.root.scale.setScalar(0.35);
      g.to(isl.root.position, { x: 0, y: 0, z: 0, duration: 1.4, ease: "power3.out" });
      g.to(isl.root.rotation, { x: 0, y: 0, z: 0, duration: 1.7, ease: "power3.out" });
      g.to(isl.root.scale, { x: 1, y: 1, z: 1, duration: 1.3, ease: "back.out(1.25)" });
      revealDetails(isl, 0.9);
    }

    function flyOut(isl) {
      const g = tl();
      if (!g || prefersReduced) { isl.root.visible = false; return; }
      g.to(isl.root.position, { x: -13, y: 3, z: -4, duration: 0.85, ease: "power3.in" });
      g.to(isl.root.rotation, { y: -1.6, z: -0.2, duration: 0.85, ease: "power2.in" });
      g.to(isl.root.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 0.85, ease: "power2.in", onComplete: () => (isl.root.visible = false) });
    }

    let introDone = false;
    function playIntro() {
      if (introDone) return;
      introDone = true;
      flyIn(islands[current], "below");
    }

    function show(key) {
      if (!islands[key] || key === current) return;
      const prev = islands[current];
      current = key;
      if (!introDone) { introDone = true; flyIn(islands[key], "below"); return; }
      flyOut(prev);
      setTimeout(() => flyIn(islands[key], "side"), prefersReduced ? 0 : 380);
    }

    // ---- render loop (only while on screen)
    let visible = false, raf = 0;
    const t0 = performance.now();
    const dummy = new THREE.Object3D();
    const v = new THREE.Vector3();

    function frame() {
      raf = requestAnimationFrame(frame);
      const t = (performance.now() - t0) / 1000;
      tilt.x += (tilt.tx - tilt.x) * 0.05;
      tilt.y += (tilt.ty - tilt.y) * 0.05;
      tilt.spin += tilt.spinV;
      tilt.spinV *= 0.92;
      if (!dragging) tilt.spin *= 0.985;

      Object.values(islands).forEach((isl) => {
        if (!isl.root.visible) return;
        const f = isl.floater;
        if (!prefersReduced) {
          f.position.y = Math.sin(t * 1.1) * 0.16;
          f.rotation.z = Math.sin(t * 0.7) * 0.025;
          f.rotation.x = tilt.x + Math.cos(t * 0.6) * 0.02;
        }
        f.rotation.y = (BASE_ROT_Y[isl.key] || 0.5) + tilt.y + tilt.spin;

        // route drawing
        const idx = Math.floor(isl.totalIdx * isl.routeProgress.v / 3) * 3;
        isl.tubeGeo.setDrawRange(0, idx);

        // pins
        isl.pins.forEach((p, i) => {
          p.group.scale.setScalar(Math.max(0.001, isl.pinScale.v));
          const pulse = (t * 0.8 + i * 0.3) % 1;
          p.ring.scale.setScalar(1 + pulse * 1.8);
          p.ring.material.opacity = 0.85 * (1 - pulse);
        });

        // walkers
        if (isl.walkers.visible) {
          for (let i = 0; i < isl.walkerCount; i++) {
            let u = (i / isl.walkerCount + t * 0.018) % 1;
            if (!isl.curve.closed) u = 0.5 - 0.5 * Math.cos(((i / isl.walkerCount) + t * 0.02) * Math.PI * 2) * 0.98 + 0.01; // there-and-back
            isl.curve.getPointAt(Math.min(0.999, Math.max(0, u)), v);
            dummy.position.set(v.x, v.y + 0.07 + Math.abs(Math.sin(t * 7 + i)) * 0.05, v.z);
            dummy.scale.setScalar(1);
            dummy.updateMatrix();
            isl.walkers.setMatrixAt(i, dummy.matrix);
          }
          isl.walkers.instanceMatrix.needsUpdate = true;
        }

        // clouds drift
        isl.clouds.children.forEach((c) => {
          const b = c.userData.base;
          c.position.x = b[0] + Math.sin(t * 0.25 + c.userData.phase) * 0.5;
          c.position.y = b[1] + Math.sin(t * 0.6 + c.userData.phase) * 0.12;
        });
      });

      // shadow breathes with the float
      const cur = islands[current];
      const fy = cur ? cur.floater.position.y : 0;
      shadow.material.opacity = cur && cur.root.visible ? 0.9 - fy * 0.8 : 0.4;
      shadow.scale.setScalar((cur ? cur.root.scale.x : 1) * (1 - fy * 0.15));

      renderer.render(scene, camera);
      updateLabels();
      updateCompass();
    }

    // compass needle follows the island's north
    const compass = container.querySelector("[data-compass]");
    const n0 = new THREE.Vector3(), n1 = new THREE.Vector3();
    function updateCompass() {
      const isl = islands[current];
      if (!compass || !isl) return;
      n0.set(0, 0, 0); n1.set(0, 0, -3);
      isl.floater.localToWorld(n0); isl.floater.localToWorld(n1);
      n0.project(camera); n1.project(camera);
      const ang = Math.atan2(n1.x - n0.x, n1.y - n0.y) * (180 / Math.PI);
      compass.style.setProperty("--north", `${ang.toFixed(1)}deg`);
    }

    function updateLabels() {
      if (!labelLayer) return;
      const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
      Object.values(islands).forEach((isl) => {
        const els = labelEls[isl.key];
        const on = isl.root.visible && isl.pinScale.v > 0.6 && isl.root.scale.x > 0.95 && Math.abs(isl.root.position.x) < 0.5;
        isl.pins.forEach((p, i) => {
          const el = els[i];
          if (!on) { el.classList.remove("is-on"); return; }
          v.copy(p.anchor);
          p.group.localToWorld(v);
          v.project(camera);
          const x = Math.min(w - el.offsetWidth / 2 - 4, Math.max(el.offsetWidth / 2 + 4, (v.x * 0.5 + 0.5) * w));
          const y = Math.max(el.offsetHeight + 8, (-v.y * 0.5 + 0.5) * h);
          el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          el.classList.add("is-on");
        });
      });
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        visible = e.isIntersecting;
        if (visible && !raf) frame();
        if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    }, { threshold: 0 });
    io.observe(container);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!document.hidden && visible && !raf) frame();
    });

    container.classList.add("is-3d");
    return { show, playIntro, get current() { return current; } };
  }

  window.WAWIsland = { mount };
})();
