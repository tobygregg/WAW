/* =====================================================================
   layout.js — shared by EVERY page
   Builds the nav + footer from config.js, fills in [data-text] etc,
   draws the footprint trails and runs scroll-reveal animations.
   ===================================================================== */
(function () {
  "use strict";

  const CFG = window.WAW_CONFIG || {};
  const ROOT = document.body.dataset.root || "";
  const IS_HOME = document.body.dataset.page === "home";

  /* ---------- helpers ------------------------------------------------ */
  const get = (path, obj = CFG) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const fmt = (v) => (typeof v === "string" ? v.replace(/\{year\}/g, get("event.year") || "") : v);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const isExternal = (u) => /^https?:\/\//i.test(u);

  function href(h) {
    if (!h) return "#";
    if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
    if (h.startsWith("#")) return IS_HOME ? h : ROOT + "index.html" + h;
    return ROOT + h;
  }
  function linkAttrs(h) {
    const u = href(h);
    return `href="${esc(u)}"` + (isExternal(u) ? ' target="_blank" rel="noopener"' : "");
  }

  /* ---------- icons -------------------------------------------------- */
  const s = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICONS = {
    arrow: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    external: s('<path d="M7 17 17 7M9 7h8v8"/>'),
    clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    flag: s('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    pin: s('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    route: s('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>'),
    mail: s('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
    up: s('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3.1 4.5 6.8 4.5c2.1 0 3.5 1.2 4.2 2.4h2c.7-1.2 2.1-2.4 4.2-2.4 3.7 0 5.9 3.8 4.4 7.2C19.5 16.4 12 21 12 21Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3Z"/></svg>',
    instagram: s('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    scales: s('<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7Zm14 0-3 7a3.5 3.5 0 0 0 6 0l-3-7Z"/>'),
    globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>'),
    runner: s('<circle cx="14" cy="4.5" r="2"/><path d="m6 21 3.5-6 3 2.5V22M8 10l3-3 3.5 1 2 3.5 3 .5M10.5 8.5 9 14"/>'),
    shoe: s('<path d="M3 16.5V9.5l4 1 2.5-3 4 3.5 5.5 2a3 3 0 0 1 2 2.8v.7H3Z"/><path d="M3 19.5h18M10 12l1.5 1.2M12.5 10.5 14 11.7"/>'),
    firstaid: s('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5h6v2M12 10.5v6M9 13.5h6"/>'),
    jacket: s('<path d="M8 3 4 6v15h5v-8M16 3l4 3v15h-5v-8M8 3l4 4 4-4M12 7v14"/>'),
    bottle: s('<path d="M10 2h4M10.5 2v3L8 8.5V21h8V8.5L13.5 5V2M8 12h8M8 16h8"/>'),
    map: s('<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11v13.5"/>'),
    shield: s('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6L12 3Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>'),
    check: s('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  };

  /* ---------- footprint (right foot; left foot is mirrored) ------------ */
  function foot(side, color, size) {
    const g = side === "l" ? ' transform="translate(28 0) scale(-1 1)"' : "";
    return `<svg class="foot" viewBox="0 0 28 44" style="--fs:${size || 22}px;color:${color || "currentColor"}" aria-hidden="true"><g fill="currentColor"${g}><path d="M6 20C6 14 10 12 15 12C21 12 23 16 22 22C21 27 19 29 19 33C19 39 17 43 13.5 43C10 43 8.5 40 8.5 36C8.5 31 6 27 6 20Z"/><circle cx="8.6" cy="7" r="3.4"/><circle cx="14" cy="4.5" r="2.5"/><circle cx="18.5" cy="5.4" r="2.2"/><circle cx="22" cy="8.2" r="1.9"/><circle cx="24.3" cy="12" r="1.6"/></g></svg>`;
  }

  /* Looping footstep trails: <div class="walk-trail" data-trail data-steps="10"> */
  function renderTrails(scope = document) {
    scope.querySelectorAll("[data-trail]").forEach((el) => {
      const n = +el.dataset.steps || 10;
      const color = el.dataset.color || "#7fb829";
      const size = +el.dataset.size || 18;
      const stepT = 0.34;
      const dur = n * stepT * 1.55;
      el.style.setProperty("--dur", dur + "s");
      if (el.dataset.op) el.style.setProperty("--op", el.dataset.op);
      let html = "";
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? "r" : "l";
        html += `<span class="step ${side}" style="left:${((i / n) * 100).toFixed(2)}%;--delay:${(i * stepT).toFixed(2)}s">${foot(side, color, size)}</span>`;
      }
      el.innerHTML = html;
    });
  }

  /* ---------- bind simple text/links from config --------------------- */
  function bind(scope = document) {
    scope.querySelectorAll("[data-text]").forEach((el) => {
      const v = get(el.dataset.text);
      if (v != null) el.textContent = fmt(v);
    });
    scope.querySelectorAll("[data-html]").forEach((el) => {
      const v = get(el.dataset.html);
      if (v != null) el.innerHTML = fmt(v);
    });
    scope.querySelectorAll("[data-href]").forEach((el) => {
      const v = get(el.dataset.href);
      if (v == null) return;
      const u = href(v);
      el.setAttribute("href", u);
      if (isExternal(u)) { el.target = "_blank"; el.rel = "noopener"; }
    });
    scope.querySelectorAll("[data-link]").forEach((el) => {
      const v = get("links." + el.dataset.link);
      if (v) el.setAttribute("href", v);
    });
    scope.querySelectorAll("[data-src]").forEach((el) => {
      const v = get(el.dataset.src);
      if (v) el.setAttribute("src", ROOT + v);
    });
  }

  /* ---------- NAV ---------------------------------------------------- */
  function renderNav() {
    const host = document.getElementById("site-nav");
    if (!host) return;
    const items = CFG.nav || [];
    const btn = CFG.navButton || { label: "Enter Now", href: "#enter" };
    host.outerHTML = `
<header class="site-nav ${IS_HOME ? "" : "is-solid"} fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4" data-nav>
  <div class="nav-shell mx-auto flex max-w-[90rem] items-center justify-between gap-3 rounded-full py-2 pl-2 pr-2 sm:pl-3">
    <a ${linkAttrs("#top")} class="flex items-center gap-2.5" aria-label="World Aid Walk — home">
      <img src="${ROOT}assets/images/logo.webp" alt="" width="512" height="512" class="h-11 w-11 drop-shadow-md sm:h-12 sm:w-12" />
      <span class="nav-logo-text hidden font-display text-[0.95rem] uppercase leading-[0.95] min-[400px]:block">World Aid<br/>Walk</span>
    </a>
    <nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
      ${items.map((i) => `<a ${linkAttrs(i.href)} class="nav-link rounded-full px-4 py-2.5 text-[0.95rem] font-bold transition hover:bg-white/10">${esc(i.label)}</a>`).join("")}
    </nav>
    <div class="flex items-center gap-2">
      <a ${linkAttrs(btn.href)} class="btn btn-lime px-4 py-2.5 text-sm sm:px-6 sm:py-3">
        ${esc(btn.label)} <span class="btn-arrow hidden h-4 w-4 sm:block">${ICONS.arrow}</span>
      </a>
      <button type="button" class="menu-toggle grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white transition lg:hidden" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>
        <span class="flex w-5 flex-col gap-[4px]"><span class="bar bar-1 h-[2px] w-full rounded bg-current"></span><span class="bar bar-2 h-[2px] w-full rounded bg-current"></span><span class="bar bar-3 h-[2px] w-full rounded bg-current"></span></span>
      </button>
    </div>
  </div>
</header>
<div id="mobile-menu" class="mobile-menu fixed inset-0 z-40 flex flex-col overflow-y-auto bg-navy px-6 pb-10 pt-28 text-white lg:hidden" aria-hidden="true" data-mobile-menu>
  <nav class="flex flex-col gap-1" aria-label="Mobile">
    ${items.map((i, n) => `<a ${linkAttrs(i.href)} class="mm-link flex items-center justify-between border-b border-white/10 py-4 font-display text-4xl uppercase" style="transition-delay:${0.15 + n * 0.06}s" data-close-menu>${esc(i.label)}<span class="h-6 w-6 text-lime">${ICONS.arrow}</span></a>`).join("")}
  </nav>
  <a ${linkAttrs(btn.href)} class="mm-link btn btn-lime mt-8 py-4 text-lg" style="transition-delay:${0.15 + items.length * 0.06}s" data-close-menu>${esc(btn.label)}</a>
  <div class="mm-link mt-auto flex items-center gap-3 pt-10" style="transition-delay:${0.25 + items.length * 0.06}s">
    ${socialLinks("h-11 w-11 bg-white/10 hover:bg-lime hover:text-navy")}
  </div>
  <div class="pointer-events-none absolute bottom-24 right-[-40px] opacity-40">${foot("r", "#7fb829", 70)}</div>
</div>`;

    const nav = document.querySelector("[data-nav]");
    const menu = document.querySelector("[data-mobile-menu]");
    const toggle = document.querySelector("[data-menu-toggle]");

    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.documentElement.style.overflow = open ? "hidden" : "";
      nav.classList.toggle("menu-is-open", open);
      if (open) nav.classList.add("is-scrolled");
      else onScroll();
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    menu.querySelectorAll("[data-close-menu]").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

    // blend into hero at the top, separate on scroll
    function onScroll() {
      if (!IS_HOME) return;
      if (menu.classList.contains("is-open")) return;
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // highlight the section you're in
    if (IS_HOME && "IntersectionObserver" in window) {
      const links = [...nav.querySelectorAll(".nav-link")];
      const map = new Map(links.map((l) => [l.getAttribute("href"), l]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          map.get("#" + e.target.id)?.classList.add("is-active");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      items.forEach((i) => { const sec = document.querySelector(i.href); if (sec) io.observe(sec); });
    }
  }

  function socialLinks(cls) {
    const L = CFG.links || {};
    return [
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["twitter", "X (Twitter)"],
    ].filter(([k]) => L[k]).map(([k, label]) => `<a href="${esc(L[k])}" target="_blank" rel="noopener" aria-label="${label}" class="grid place-items-center rounded-full transition ${cls}"><span class="h-5 w-5">${ICONS[k]}</span></a>`).join("");
  }

  /* ---------- FOOTER ------------------------------------------------- */
  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    const F = CFG.footer || {};
    const site = CFG.site || {};
    const btn = CFG.navButton || { label: "Enter Now", href: "#enter" };
    host.outerHTML = `
<footer class="relative z-10 -mt-10 overflow-hidden rounded-t-[2.5rem] bg-navy text-white sm:rounded-t-[3.5rem]">
  <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-lime/10 blur-3xl"></div>
  <div class="container-x relative pt-16 sm:pt-20">
    <div class="flex flex-col gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end lg:justify-between">
      <div class="flex items-center gap-5">
        <img src="${ROOT}assets/images/logo.webp" alt="World Aid Walk" width="512" height="512" loading="lazy" class="h-20 w-20 sm:h-24 sm:w-24" />
        <p class="font-hand text-[2.1rem] leading-[1.05] text-lime sm:text-5xl">${esc(fmt(get("event.slogan")))}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a ${linkAttrs(btn.href)} class="btn btn-lime">${esc(btn.label)} <span class="btn-arrow h-4 w-4">${ICONS.arrow}</span></a>
        <a href="${esc(get("links.donate") || "#")}" target="_blank" rel="noopener" class="btn btn-glass"><span class="h-4 w-4 text-lime">${ICONS.heart}</span> Donate</a>
      </div>
    </div>

    <div class="relative h-14" aria-hidden="true"><div class="walk-trail left-0 top-0" style="--len: min(100%, 900px)" data-trail data-steps="18" data-color="#7fb829" data-size="15" data-op="0.55"></div></div>

    <div class="grid grid-cols-2 gap-x-6 gap-y-10 pb-12 lg:grid-cols-12">
      <div class="col-span-2 lg:col-span-4">
        <p class="max-w-xs text-white/70">${esc(fmt(F.blurb || ""))}</p>
        <p class="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">Guernsey registered charity no. ${esc(site.charityNumber || "")}</p>
      </div>
      <div class="lg:col-span-2">
        <h3 class="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-lime-300">Explore</h3>
        <ul class="space-y-2.5">${(CFG.nav || []).map((i) => `<li><a ${linkAttrs(i.href)} class="font-semibold text-white/80 transition hover:text-lime">${esc(i.label)}</a></li>`).join("")}</ul>
      </div>
      <div class="lg:col-span-3">
        <h3 class="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-lime-300">Information</h3>
        <ul class="space-y-2.5">${(F.pages || []).map((i) => `<li><a ${linkAttrs(i.href)} class="font-semibold text-white/80 transition hover:text-lime">${esc(i.label)}</a></li>`).join("")}</ul>
      </div>
      <div class="col-span-2 lg:col-span-3">
        <h3 class="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-lime-300">Get in touch</h3>
        <a href="mailto:${esc(site.email)}" class="inline-flex items-center gap-2 break-all font-semibold text-white/80 transition hover:text-lime"><span class="h-5 w-5 flex-none">${ICONS.mail}</span>${esc(site.email)}</a>
        <div class="mt-5 flex gap-2.5">${socialLinks("h-11 w-11 bg-white/10 hover:bg-lime hover:text-navy")}</div>
      </div>
    </div>

    <div class="flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
      <p>© <span data-year></span> World Aid Walk · Guernsey</p>
      <p class="text-xs">${esc(F.credit || "")}</p>
      <a ${linkAttrs("#top")} class="inline-flex items-center gap-2 font-bold text-white/80 transition hover:text-lime"><span class="h-4 w-4">${ICONS.up}</span> Back to top</a>
    </div>
  </div>
  <p class="pointer-events-none select-none whitespace-nowrap text-center font-display text-[9.5vw] uppercase leading-[0.8] text-white/[0.04]" aria-hidden="true">Heart &amp; Sole</p>
</footer>`;
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- scroll reveal ----------------------------------------- */
  function initReveal(scope = document) {
    const els = scope.querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- expose for main.js + page scripts ---------------------- */
  window.WAW = { CFG, ROOT, IS_HOME, get, fmt, esc, href, linkAttrs, isExternal, ICONS, foot, renderTrails, bind, initReveal, socialLinks };

  renderNav();
  renderFooter();
  bind();
  renderTrails();
  // main.js / page scripts add their own content, then call WAW.initReveal()
  if (!IS_HOME) requestAnimationFrame(() => initReveal());
})();
