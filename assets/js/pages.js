/* =====================================================================
   pages.js — fills the extra pages (privacy, terms, volunteer,
   contact, support) from the "pages" section of config.js
   ===================================================================== */
(function () {
  "use strict";
  const W = window.WAW;
  if (!W) return;
  const { CFG, ROOT, get, fmt, esc, ICONS, foot } = W;
  const page = document.body.dataset.page;
  const P = get("pages." + page) || {};
  const $ = (s) => document.querySelector(s);
  const host = $("[data-page-content]");

  // shared page hero
  const t = $("[data-page-title]"), i = $("[data-page-intro]");
  if (t && P.title) t.textContent = fmt(P.title);
  if (i && P.intro) i.textContent = fmt(P.intro);

  const paras = (arr) => (arr || []).map((p) => `<p>${fmt(p)}</p>`).join("");
  const arrowBtn = (href, label, cls = "btn-navy", external) =>
    `<a href="${esc(href)}" ${external ? 'target="_blank" rel="noopener"' : ""} class="btn ${cls}">${esc(label)} <span class="btn-arrow h-4 w-4">${external ? ICONS.external : ICONS.arrow}</span></a>`;

  const renderers = {
    privacy() {
      return `<div class="prose-waw">${paras(P.body)}</div>
        <p class="prose-waw">For more details please read our privacy statement.</p>
        <div class="mt-2">${arrowBtn(get("links.privacyStatementPdf"), "Read the privacy statement (PDF)", "btn-navy", true)}</div>`;
    },

    terms() {
      return `<ol class="space-y-4">${(P.items || []).map((item, n) => `
        <li class="flex gap-4 rounded-3xl bg-cream p-5 sm:p-6" data-reveal style="--d:${n * 0.05}s">
          <span class="grid h-9 w-9 flex-none place-items-center rounded-full bg-navy font-display text-sm text-lime">${n + 1}</span>
          <p class="pt-1 leading-relaxed text-navy/80">${esc(fmt(item))}</p>
        </li>`).join("")}</ol>`;
    },

    volunteer() {
      return `<div class="prose-waw">${paras(P.body)}</div>
        <div class="mt-8 grid grid-cols-3 gap-3 sm:gap-4">${(P.roles || []).map((r, n) => `
          <div class="rounded-3xl bg-lime/15 p-4 ring-1 ring-lime/30 sm:p-5" data-reveal style="--d:${n * 0.08}s">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-lime text-navy"><span class="h-5 w-5">${[ICONS.flag, ICONS.bottle, ICONS.shield][n % 3]}</span></span>
            <p class="mt-3 font-display text-sm sm:mt-4 sm:text-lg">${esc(r)}</p>
          </div>`).join("")}</div>
        <div class="mt-10 flex flex-wrap gap-3">
          ${arrowBtn(`mailto:${get("site.email")}?subject=${encodeURIComponent("World Aid Walk – Volunteering")}`, "Offer to help", "btn-lime")}
          <a href="mailto:${esc(get("site.email"))}" class="btn btn-outline">${esc(get("site.email"))}</a>
        </div>
        <figure class="mt-12 overflow-hidden rounded-4xl shadow-lift">
          <img src="${ROOT}assets/images/photos/samba-band-start.webp" alt="The samba band playing at the start of the walk" width="960" height="720" loading="lazy" class="aspect-[16/9] w-full object-cover" />
        </figure>`;
    },

    support() {
      const L = CFG.links || {};
      const card = (href, title, text, n) => `
        <a href="${esc(href)}" target="_blank" rel="noopener" class="card group flex items-start gap-4 p-6 transition hover:-translate-y-1 hover:shadow-lift" data-reveal style="--d:${n * 0.08}s">
          <span class="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-navy text-lime"><span class="h-6 w-6">${n ? ICONS.mail : ICONS.check}</span></span>
          <span><span class="block font-display text-lg">${title}</span><span class="mt-1 block text-sm text-navy/65">${text}</span>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-extrabold">Open Race Nation help <span class="h-4 w-4">${ICONS.external}</span></span></span>
        </a>`;
      return `<div class="prose-waw">${paras(P.body)}</div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          ${card(L.raceNationSupport, "Registration or payment help", "Race Nation support for anything to do with entering or paying.", 0)}
          ${card(L.raceNationNoEmails, "No emails received?", "Entered but had no confirmation? Check junk/spam first, then follow this guide.", 1)}
        </div>
        <p class="prose-waw mt-8">Still stuck? <a href="mailto:${esc(get("site.email"))}?subject=${encodeURIComponent("World Aid Walk – Registration")}">Email the World Aid Walk team</a>.</p>`;
    },

    contact() {
      const site = CFG.site || {};
      const L = CFG.links || {};
      const email = site.email || "";
      const mail = (subject) => `mailto:${email}?subject=${encodeURIComponent("World Aid Walk – " + subject)}`;
      const topics = P.topics || [];
      const socials = [
        ["facebook", "Facebook", "@WorldAidWalk"],
        ["instagram", "Instagram", "@worldaidwalk"],
        ["twitter", "X (Twitter)", "@WorldAidWalk"],
      ].filter(([k]) => L[k]);
      return `
      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Email -->
        <div class="relative overflow-hidden rounded-4xl bg-navy p-7 text-white sm:p-10 lg:col-span-3" data-reveal>
          <div class="pointer-events-none absolute -bottom-8 -right-4 rotate-[-18deg] opacity-10">${foot("r", "#7fb829", 120)}</div>
          <span class="grid h-14 w-14 place-items-center rounded-2xl bg-lime text-navy"><span class="h-7 w-7">${ICONS.mail}</span></span>
          <h2 class="mt-6 font-display text-3xl sm:text-4xl">Email the team</h2>
          <p class="mt-2 max-w-md text-white/70">The quickest way to reach us. Someone from the committee will get back to you.</p>
          <a href="mailto:${esc(email)}" class="mt-6 block break-all font-display text-xl text-lime underline decoration-white/20 decoration-2 underline-offset-8 transition hover:decoration-lime sm:text-3xl">${esc(email)}</a>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="mailto:${esc(email)}" class="btn btn-lime">Send an email <span class="btn-arrow h-4 w-4">${ICONS.arrow}</span></a>
            <button type="button" class="btn btn-glass" data-copy="${esc(email)}">Copy address</button>
          </div>
          ${topics.length ? `
          <p class="mt-10 text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">Or email us about…</p>
          <div class="mt-3 flex flex-wrap gap-2">${topics.map((t) => `<a href="${esc(mail(t))}" class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-lime hover:text-navy">${esc(t)}</a>`).join("")}</div>` : ""}
        </div>

        <div class="flex flex-col gap-6 lg:col-span-2">
          <!-- Socials -->
          <div class="card p-7" data-reveal style="--d:.08s">
            <h2 class="font-display text-2xl">Follow along</h2>
            <p class="mt-1 text-sm text-navy/65">News, photos and walk-day updates.</p>
            <ul class="mt-5 space-y-2">${socials.map(([k, label, handle]) => `
              <li><a href="${esc(L[k])}" target="_blank" rel="noopener" class="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-navy/[0.04]">
                <span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-navy text-white transition group-hover:bg-lime group-hover:text-navy"><span class="h-5 w-5">${ICONS[k]}</span></span>
                <span><span class="block font-bold">${label}</span><span class="block text-sm text-navy/55">${handle}</span></span>
                <span class="ml-auto h-4 w-4 text-navy/40">${ICONS.external}</span>
              </a></li>`).join("")}
            </ul>
          </div>
          <!-- Quick links -->
          <a href="${ROOT}pages/volunteer.html" class="flex items-center justify-between rounded-4xl bg-lime p-6 font-display text-lg text-navy transition hover:-translate-y-1" data-reveal style="--d:.16s">Want to volunteer? <span class="h-6 w-6">${ICONS.arrow}</span></a>
          <a href="${ROOT}pages/support.html" class="card flex items-center justify-between p-6 font-display text-lg transition hover:-translate-y-1" data-reveal style="--d:.24s">Help with registration <span class="h-6 w-6">${ICONS.arrow}</span></a>
        </div>
      </div>`;
    },
  };

  if (host && renderers[page]) host.innerHTML = renderers[page]();

  // copy-email button on the contact page
  document.querySelectorAll("[data-copy]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        const old = b.textContent;
        b.textContent = "Copied! ✓";
        setTimeout(() => (b.textContent = old), 1800);
      } catch (e) {
        location.href = "mailto:" + b.dataset.copy;
      }
    });
  });

  W.renderTrails();
  W.initReveal();
})();
