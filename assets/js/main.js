/* =====================================================================
   main.js — home page only
   Fills each section from config.js and runs the animations.
   (Content lives in config.js — you shouldn't need to edit this.)
   ===================================================================== */
(function () {
  "use strict";

  const W = window.WAW;
  if (!W) return;
  const { CFG, ROOT, get, fmt, esc, ICONS, foot } = W;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const ext = (u) => (W.isExternal(u) ? ' target="_blank" rel="noopener"' : "");
  const pad = (n) => String(n).padStart(2, "0");

  /* ================================================================
     HERO — video, countdown, intro animation
     ================================================================ */
  function initHeroVideo() {
    const vid = $("[data-hero-video]");
    const v = get("hero.video") || {};
    if (!vid) return;
    if (v.poster) vid.poster = ROOT + v.poster;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData || reduced) { vid.removeAttribute("autoplay"); return; }
    // mp4 first so swapping in a new hero.mp4 is all you need to do
    [["mp4", "video/mp4"], ["webm", "video/webm"]].forEach(([k, type]) => {
      if (!v[k]) return;
      const src = document.createElement("source");
      src.src = ROOT + v[k];
      src.type = type;
      vid.appendChild(src);
    });
    // if the video can't load, hide it so the poster/background still looks right
    const last = vid.querySelector("source:last-of-type");
    if (last) last.addEventListener("error", () => {
      console.warn("Hero video failed to load — check the file name/case in assets/video and config.js", v);
      vid.style.display = "none";
      vid.parentElement.style.background = `#130f2e url("${ROOT + v.poster}") center/cover`;
    });
    vid.muted = true;
    vid.defaultMuted = true;
    vid.load();
    const tryPlay = () => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    // some phones block autoplay until the first touch — start it then
    window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    // pause the video when it's off screen (saves battery on phones)
    new IntersectionObserver(([e]) => (e.isIntersecting ? vid.play().catch(() => {}) : vid.pause())).observe(vid);
  }

  function initCountdown() {
    const box = $("[data-countdown]");
    if (!box) return;
    if (!get("event.showCountdown")) { box.remove(); return; }
    const target = new Date(get("event.countdownTo")).getTime();
    if (isNaN(target)) { box.remove(); return; }
    const out = { d: $('[data-cd="d"]', box), h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
    function tick() {
      let diff = Math.max(0, target - Date.now());
      if (diff === 0) {
        box.querySelector("p").textContent = "It's walk day — good luck! 💚";
      }
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const s = Math.floor(diff / 1e3);
      out.d.textContent = d; out.h.textContent = pad(h); out.m.textContent = pad(m); out.s.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  }

  function heroIntro() {
    const big = $("[data-split]");
    if (big) {
      const text = big.textContent;
      big.setAttribute("aria-label", text);
      big.innerHTML = [...text].map((c) => `<span class="split-char" aria-hidden="true">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    }
    if (!gsap || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".split-char", { yPercent: 115, rotate: 10, opacity: 0, duration: 1.3, stagger: 0.07 }, 0.15)
      .from("[data-hero-in]", { y: 34, opacity: 0, duration: 1.1, stagger: 0.12 }, 0.45);

    // hero text drifts + fades as you scroll away
    if (window.ScrollTrigger) {
      gsap.to("[data-hero-content]", {
        yPercent: 14, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: true },
      });
    }
  }

  /* ================================================================
     STATS STRIP — numbers count up
     ================================================================ */
  function renderStats() {
    const host = $("[data-stats]");
    if (!host) return;
    const stats = CFG.stats || [];
    host.innerHTML = stats.map((s, i) => `
      <div class="px-4 py-6 text-center sm:px-6 sm:py-8 ${i < 2 ? "border-b border-navy/10 lg:border-b-0" : ""} ${i % 2 === 0 ? "border-r border-navy/10 lg:border-r-0" : ""}">
        <p class="font-display text-[2rem] leading-none text-navy sm:text-5xl">
          <span class="text-lime-600">${esc(s.prefix || "")}</span><span data-count="${+s.number}" ${s.plain ? 'data-from="1900"' : ""}>${s.plain ? s.number : 0}</span><span class="text-lime-600">${esc(s.suffix || "")}</span>
        </p>
        <p class="mt-2 text-xs font-extrabold uppercase tracking-[0.14em] text-navy/55 sm:text-sm">${esc(fmt(s.label))}</p>
      </div>`).join("");

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        $$("[data-count]", host).forEach((el) => {
          const to = +el.dataset.count, from = +(el.dataset.from || 0);
          if (reduced) { el.textContent = to; return; }
          const t0 = performance.now(), dur = 1800;
          const step = (t) => {
            const k = Math.min(1, (t - t0) / dur);
            const ease = 1 - Math.pow(1 - k, 4);
            el.textContent = Math.round(from + (to - from) * ease);
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      });
    }, { threshold: 0.4 });
    io.observe(host);
  }

  /* ================================================================
     WALK INFO — panel + 3D island + toggle
     ================================================================ */
  const islandsCfg = get("walkInfo.islands") || {};
  let activeIsland = "guernsey";

  function walkPanelHTML(key) {
    const isl = islandsCfg[key];
    if (!isl) return "";
    const enterLink = key === "herm" ? get("links.registerHerm") : get("links.registerGuernsey");
    const row = (icon, label, value) => `
      <div class="flex items-start gap-3">
        <span class="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-navy/[0.05] text-navy"><span class="h-[18px] w-[18px]">${ICONS[icon]}</span></span>
        <div><dt class="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-navy/45">${label}</dt><dd class="font-bold leading-snug text-navy">${esc(fmt(value))}</dd></div>
      </div>`;
    return `
      <div class="mb-5" data-panel-in>
        <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-lime-700">${esc(isl.label)}</p>
        <h3 class="mt-1 font-display text-2xl leading-tight sm:text-3xl">${esc(fmt(isl.tagline))}</h3>
      </div>
      <div class="space-y-4">
        ${(isl.walks || []).map((w) => `
        <article class="card relative overflow-hidden p-5 sm:p-6" data-panel-in>
          <div class="flex items-center justify-between gap-3">
            <h4 class="font-display text-xl sm:text-2xl">${esc(w.name)}</h4>
            <span class="flex-none rounded-full bg-navy px-3.5 py-1.5 font-display text-base text-lime sm:text-lg">${esc(w.distance)}</span>
          </div>
          <dl class="mt-5 grid gap-3.5 sm:grid-cols-2">
            ${row("clock", "Start time", w.time)}
            ${w.start === w.finish ? row("flag", "Start & finish", w.start) : row("flag", "Start", w.start) + row("pin", "Finish", w.finish)}
          </dl>
          ${enterLink ? `<a href="${esc(enterLink)}" target="_blank" rel="noopener" class="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-navy underline decoration-lime decoration-[3px] underline-offset-4 transition hover:gap-2.5">Enter the ${esc(w.name)} walk <span class="h-4 w-4">${ICONS.arrow}</span></a>` : ""}
        </article>`).join("")}
      </div>`;
  }

  function setBadge(key) {
    const isl = islandsCfg[key];
    if (!isl) return;
    const label = $("[data-island-badge-label]"), text = $("[data-island-badge-text]");
    if (label) label.textContent = isl.map && isl.map.route === "loop" ? "Island loop" : "Coastal route";
    if (text) text.textContent = (isl.walks || []).map((w) => w.distance).join(" · ");
  }

  function swapPanel(key, first) {
    const panel = $("[data-walk-panel]");
    if (!panel) return;
    const render = () => {
      panel.innerHTML = walkPanelHTML(key);
      if (gsap && !reduced) gsap.from($$("[data-panel-in]", panel), { x: first ? 0 : 50, y: first ? 30 : 0, opacity: 0, duration: 0.7, stagger: 0.09, ease: "power3.out" });
    };
    if (first || !gsap || reduced) return render();
    gsap.to($$("[data-panel-in]", panel), { x: -40, opacity: 0, duration: 0.35, stagger: 0.05, ease: "power2.in", onComplete: render });
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  let islandCtl = null;
  function initIsland() {
    const stage = $("[data-island-stage]");
    if (!stage) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      loadScript(ROOT + "assets/vendor/three.custom.min.js")
        .catch(() => null)
        .then(() => loadScript(ROOT + "assets/data/island-outlines.js"))
        .then(() => loadScript(ROOT + "assets/js/island3d.js"))
        .then(() => {
          islandCtl = window.WAWIsland.mount(stage, { config: CFG, outlines: window.WAW_ISLANDS, initial: activeIsland });
          // fly in when the stage is properly on screen
          const io2 = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { islandCtl.playIntro(); io2.disconnect(); }
          }, { threshold: 0.3 });
          io2.observe(stage);
        })
        .catch((err) => console.warn("Island map failed to load", err));
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } }, { rootMargin: "900px 0px" });
    io.observe(stage);
  }

  function initToggle() {
    const toggle = $("[data-island-toggle]");
    if (!toggle) return;
    $$("button[data-island]", toggle).forEach((b) => {
      b.addEventListener("click", () => {
        const key = b.dataset.island;
        if (key === activeIsland) return;
        activeIsland = key;
        toggle.dataset.active = key;
        $$("button[data-island]", toggle).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        swapPanel(key);
        setBadge(key);
        if (islandCtl) islandCtl.show(key);
      });
    });
  }

  /* ================================================================
     CHARITIES — cards + footprint trail that walks as you scroll
     ================================================================ */
  function logoBadge(c) {
    if (c.logo) return `<img src="${esc(ROOT + c.logo)}" alt="${esc(c.name)} logo" loading="lazy" class="h-full w-full object-contain ${c.logoBg ? "" : "p-2"}"${c.logoBg ? ` style="background:${esc(c.logoBg)}"` : ""} />`;
    switch (c.badgeStyle) {
      case "christian-aid":
        return `<div class="logo-badge logo-badge--christian-aid" role="img" aria-label="${esc(c.name)}"><span class="text-left"><span class="block text-[0.85rem] leading-none">christian</span><span class="block text-[1.9rem] leading-[0.85]">aid</span></span></div>`;
      case "tumaini":
        return `<div class="logo-badge logo-badge--tumaini" role="img" aria-label="${esc(c.name)}"><span><span class="block font-sans text-[0.6rem] font-bold not-italic tracking-[0.25em]">THE</span><span class="block text-[1.55rem] font-bold leading-none">Tumaini</span><span class="block font-sans text-[0.6rem] font-bold not-italic tracking-[0.3em]">FUND</span></span></div>`;
      case "epic":
        return `<div class="logo-badge logo-badge--epic" role="img" aria-label="${esc(c.name)}"><span><span class="block text-[0.6rem] tracking-[0.15em]">THIS IS</span><span class="block text-[1.75rem] leading-none tracking-wider">EPIC</span></span></div>`;
      case "eleanor":
        return `<div class="logo-badge logo-badge--eleanor flex flex-col gap-1" role="img" aria-label="${esc(c.name)}"><span class="grid h-11 w-11 place-items-center rounded-full bg-black font-hand text-2xl text-white">ef</span><span class="text-[0.5rem] font-semibold">The Eleanor Foundation</span></div>`;
      default:
        return `<div class="logo-badge bg-navy font-display text-white" role="img" aria-label="${esc(c.name)}">${esc(c.name)}</div>`;
    }
  }

  function renderCharities() {
    const list = $("[data-charity-list]");
    if (!list) return;
    const items = get("charities.items") || [];
    list.innerHTML = items.map((c, i) => `
      <div class="relative pl-10 md:flex md:pl-0 ${i % 2 ? "md:justify-end" : ""} ${i > 0 ? "md:-mt-16" : ""}" data-charity-row>
        <article class="card group relative overflow-hidden p-6 transition duration-500 hover:-translate-y-1 hover:shadow-lift sm:p-8 md:w-[46%]" data-reveal="${i % 2 ? "right" : "left"}" data-charity-card>
          <span class="pointer-events-none absolute right-5 top-3 font-display text-7xl text-navy/[0.05] transition duration-500 group-hover:text-lime/20">${pad(i + 1)}</span>
          <div class="flex items-center gap-4">
            <div class="h-[4.5rem] w-32 flex-none overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy/10">${logoBadge(c)}</div>
            <h3 class="font-display text-xl leading-tight sm:text-2xl">${esc(c.name)}</h3>
          </div>
          <p class="mt-5 leading-relaxed text-navy/75">${esc(fmt(c.text))}</p>
          <div class="mt-5 flex flex-wrap gap-2">${(c.highlights || []).map((h) => `<span class="chip"><span class="h-3.5 w-3.5 text-lime-600">${ICONS.check}</span>${esc(h)}</span>`).join("")}</div>
          <a href="${esc(c.url)}"${ext(c.url)} class="btn btn-navy mt-6 py-3">Find out more <span class="btn-arrow h-4 w-4">${ICONS.external}</span></a>
        </article>
      </div>`).join("");
  }

  function initCharityTrail() {
    const wrap = $("[data-charity-wrap]");
    const host = $("[data-charity-trail]");
    if (!wrap || !host) return;
    let steps = [];
    let built = false;

    function build() {
      // layout positions (offset*), so cards mid-animation don't knock the trail out of place
      const rel = (el) => {
        let x = 0, y = 0, n = el;
        while (n && n !== wrap) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        return { left: x, top: y, right: x + el.offsetWidth, bottom: y + el.offsetHeight };
      };
      const Wd = wrap.offsetWidth;
      const desktop = window.innerWidth >= 768;
      const rows = $$("[data-charity-card]", wrap).map(rel);
      const finish = $("[data-finish]", wrap);
      const fr = finish ? rel(finish) : null;
      const endY = fr ? fr.top + (fr.bottom - fr.top) * 0.45 : wrap.offsetHeight;
      const pts = [];
      if (desktop) {
        pts.push([Wd / 2, -40]);
        rows.forEach((r, i) => {
          const freeLeft = i % 2 === 1; // card on the right → space on the left
          const x = freeLeft ? r.left * 0.5 : r.right + (Wd - r.right) * 0.5;
          pts.push([x, r.top + (r.bottom - r.top) * 0.28]);
          pts.push([x + (freeLeft ? 30 : -30), r.top + (r.bottom - r.top) * 0.78]);
        });
        pts.push([Wd / 2, endY]);
      } else {
        pts.push([16, -30]);
        const total = endY;
        for (let y = 0; y <= total; y += 90) pts.push([16 + Math.sin(y / 140) * 7, y]);
        pts.push([Wd / 2, endY]);
      }

      // Catmull-Rom → cubic bezier path
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      host.innerHTML = `<svg class="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true"><path d="${d}" fill="none" stroke="#272151" stroke-opacity="0.08" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"/></svg>`;
      const path = host.querySelector("path");
      const len = path.getTotalLength();
      const gap = desktop ? 36 : 30;
      const size = desktop ? 19 : 15;
      let html = "";
      steps = [];
      for (let l = 10, i = 0; l < len - 10; l += gap, i++) {
        const p = path.getPointAtLength(l);
        const q = path.getPointAtLength(Math.min(len, l + 1));
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        const side = i % 2 ? 1 : -1;
        const ox = Math.cos(ang + Math.PI / 2) * 7 * side, oy = Math.sin(ang + Math.PI / 2) * 7 * side;
        const x = p.x + ox - size / 2, y = p.y + oy - size * 0.78;
        const deg = (ang * 180) / Math.PI + 90;
        html += `<span class="tstep" style="transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${deg.toFixed(1)}deg)" data-y="${p.y.toFixed(0)}">${foot(side < 0 ? "l" : "r", side < 0 ? "#272151" : "#7fb829", size)}</span>`;
      }
      host.insertAdjacentHTML("beforeend", html);
      steps = $$(".tstep", host).map((el) => ({ el, y: +el.dataset.y, on: false }));
      built = true;
      update();
    }

    function update() {
      if (!built) return;
      const top = wrap.getBoundingClientRect().top;
      const reach = window.innerHeight * 0.68 - top;
      steps.forEach((s) => {
        const on = reduced || s.y < reach;
        if (on !== s.on) { s.on = on; s.el.classList.toggle("on", on); }
      });
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });

    let rt;
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastW) return; // ignore mobile URL-bar resizes
      lastW = window.innerWidth;
      clearTimeout(rt); rt = setTimeout(build, 200);
    });
    // build after fonts/images settle so positions are right
    const go = () => setTimeout(build, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    window.addEventListener("load", go);
    // cards slide in (transform) — rebuild once they're settled
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(build, 1000); io.disconnect(); } });
    io.observe(wrap);
  }

  /* ================================================================
     SPONSORS
     ================================================================ */
  function renderSponsors() {
    const host = $("[data-sponsors]");
    if (!host) return;
    host.innerHTML = (get("sponsors.items") || []).map((s, i) => `
      <a href="${esc(s.url)}"${ext(s.url)} class="card group flex gap-4 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift" data-reveal style="--d:${i * 0.08}s">
        <span class="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-navy text-lime transition group-hover:rotate-[-8deg] group-hover:bg-lime group-hover:text-navy"><span class="h-6 w-6">${ICONS[s.icon] || ICONS.heart}</span></span>
        <span class="block">
          <span class="block text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-lime-700">${esc(s.role)}</span>
          <span class="mt-0.5 block font-display text-lg leading-tight">${esc(s.name)}</span>
          <span class="mt-1.5 block text-sm leading-relaxed text-navy/65">${esc(fmt(s.text))}</span>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-navy">Find out more <span class="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">${ICONS.external}</span></span>
        </span>
      </a>`).join("");
  }

  /* ================================================================
     REGISTER
     ================================================================ */
  function renderRegister() {
    const R = get("register") || {};
    const status = R.status || "open";
    const st = $("[data-register-status]");
    const stText = $("[data-register-status-text]");
    if (stText) stText.textContent = fmt((R.statusText || {})[status] || "");
    if (st && status !== "open") {
      st.classList.remove("bg-navy", "text-white");
      st.classList.add(status === "soon" ? "bg-lime" : "bg-navy/10", "text-navy");
      st.querySelector(".animate-ping")?.remove();
    }

    const fees = $("[data-fees]");
    if (fees) fees.innerHTML = (R.fees || []).map((f, i) => {
      const dark = i === 0;
      return `
      <div class="relative overflow-hidden rounded-4xl p-6 sm:p-7 ${dark ? "bg-navy text-white shadow-lift" : "card"}" data-reveal style="--d:${i * 0.1}s">
        <div class="pointer-events-none absolute -bottom-6 -right-2 rotate-[-20deg] ${dark ? "opacity-10" : "opacity-[0.06]"}">${foot("r", dark ? "#7fb829" : "#272151", 90)}</div>
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="font-display text-2xl">${esc(f.who)}</h4>
            <p class="text-sm font-bold ${dark ? "text-white/60" : "text-navy/55"}">${esc(f.age)}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${dark ? "bg-lime text-navy" : "bg-navy/[0.06] text-navy"}">Entry</span>
        </div>
        <p class="mt-6 font-display text-6xl leading-none ${dark ? "text-lime" : "text-navy"}">${esc(f.price)}</p>
        <div class="relative mt-6 flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${dark ? "bg-white/10" : "bg-navy/[0.04]"}">
          <span class="font-bold ${dark ? "text-white/75" : "text-navy/70"}">Late entry</span>
          <span class="font-display text-lg">${esc(f.latePrice)}</span>
        </div>
      </div>`;
    }).join("");

    const btns = $("[data-register-buttons]");
    if (btns) btns.innerHTML = (R.buttons || []).map((b, i) => {
      const url = get("links." + b.link);
      const lime = i === 0;
      const disabled = status === "closed";
      return `
      <a ${disabled ? 'aria-disabled="true"' : `href="${esc(url)}" target="_blank" rel="noopener"`} class="group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl p-5 transition duration-300 sm:p-6 ${lime ? "bg-lime text-navy shadow-[0_20px_40px_-18px_rgba(127,184,41,0.9)]" : "bg-navy text-white shadow-lift"} ${disabled ? "pointer-events-none opacity-50" : "hover:-translate-y-1"}" data-reveal style="--d:${0.15 + i * 0.1}s">
        <span>
          <span class="block font-display text-xl sm:text-2xl">${esc(b.label)}</span>
          <span class="mt-0.5 block text-sm font-bold ${lime ? "text-navy/70" : "text-white/65"}">${esc(fmt(b.sub))}</span>
        </span>
        <span class="grid h-12 w-12 flex-none place-items-center rounded-full transition duration-300 group-hover:-rotate-45 ${lime ? "bg-navy text-lime" : "bg-lime text-navy"}"><span class="h-5 w-5">${ICONS.arrow}</span></span>
      </a>`;
    }).join("");
  }

  /* ================================================================
     TIPS
     ================================================================ */
  function renderTips() {
    const host = $("[data-tips]");
    if (!host) return;
    host.innerHTML = (get("prepare.tips") || []).map((t, i) => `
      <article class="card group relative overflow-hidden p-7 transition duration-500 hover:-translate-y-1.5 hover:shadow-lift" data-reveal style="--d:${(i % 3) * 0.08}s">
        <div class="flex items-start justify-between">
          <span class="grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 text-lime-700 transition duration-500 group-hover:rotate-[-8deg] group-hover:bg-lime group-hover:text-navy"><span class="h-7 w-7">${ICONS[t.icon] || ICONS.check}</span></span>
          <span class="font-display text-5xl leading-none text-navy/[0.07]">${pad(i + 1)}</span>
        </div>
        <h3 class="mt-6 font-display text-xl">${esc(t.title)}</h3>
        <p class="mt-2 leading-relaxed text-navy/70">${esc(fmt(t.text))}</p>
      </article>`).join("");
  }

  /* ================================================================
     MARQUEE
     ================================================================ */
  function renderMarquee() {
    const host = $("[data-marquee]");
    if (!host) return;
    const words = [get("event.slogan"), "World Aid Walk " + get("event.year"), "Guernsey · Herm", "Since 1970"];
    const one = words.map((w) => `<span class="flex items-center gap-6 px-6 font-display text-xl uppercase tracking-wide text-white sm:text-3xl"><span class="whitespace-nowrap">${esc(fmt(w))}</span><span class="flex rotate-90 gap-1">${foot("l", "#7fb829", 14)}${foot("r", "#7fb829", 14)}</span></span>`).join("");
    host.innerHTML = `<div class="flex">${one}</div><div class="flex" aria-hidden="true">${one}</div>`;
  }

  /* ================================================================
     PARALLAX bits
     ================================================================ */
  function initParallax() {
    if (!gsap || !window.ScrollTrigger || reduced) return;
    $$("[data-parallax]").forEach((el) => {
      const amt = +el.dataset.parallax || 6;
      gsap.fromTo(el, { yPercent: -amt, scale: 1.12 }, { yPercent: amt, scale: 1.12, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
    // images/fonts change the page height after load — re-measure so nothing jumps
    const refresh = () => window.ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  /* ---------- go! ---------------------------------------------------- */
  initHeroVideo();
  initCountdown();
  heroIntro();
  renderStats();
  swapPanel(activeIsland, true);
  setBadge(activeIsland);
  initToggle();
  initIsland();
  renderCharities();
  renderSponsors();
  renderRegister();
  renderTips();
  renderMarquee();
  W.renderTrails();
  W.initReveal();
  initCharityTrail();
  initParallax();
})();