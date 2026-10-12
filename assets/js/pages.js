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
          ${arrowBtn(ROOT + "pages/contact.html?topic=Volunteering", "Offer to help", "btn-lime")}
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
        <p class="prose-waw mt-8">Still stuck? <a href="${ROOT}pages/contact.html?topic=Registration">Contact the World Aid Walk team</a>.</p>`;
    },

    contact() {
      const site = CFG.site || {};
      const params = new URLSearchParams(location.search);
      const pre = params.get("topic");
      const topics = P.topics || ["General question"];
      const thanks = (site.url || "") + "/pages/thanks.html";
      return `
      <div class="grid gap-10 lg:grid-cols-5">
        <form class="lg:col-span-3" action="${esc(site.formEndpoint)}" method="POST" data-contact-form novalidate>
          <input type="hidden" name="_subject" value="New message from the World Aid Walk website" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_next" value="${esc(thanks)}" />
          <input type="text" name="_honey" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
          <div class="grid gap-5 sm:grid-cols-2">
            <div><label class="field-label" for="f-name">Your name</label><input class="field" id="f-name" name="name" required autocomplete="name" placeholder="Jane Le Page" /></div>
            <div><label class="field-label" for="f-email">Email</label><input class="field" id="f-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com" /></div>
          </div>
          <div class="mt-5"><label class="field-label" for="f-topic">What's it about?</label>
            <select class="field" id="f-topic" name="topic">${topics.map((tp) => `<option ${pre === tp ? "selected" : ""}>${esc(tp)}</option>`).join("")}</select>
          </div>
          <div class="mt-5"><label class="field-label" for="f-msg">Message</label><textarea class="field min-h-[160px]" id="f-msg" name="message" required placeholder="How can we help?"></textarea></div>
          <p class="mt-3 text-xs text-navy/55">We only use your details to reply to you. See our <a class="font-bold underline" href="${ROOT}pages/privacy.html">privacy info</a>.</p>
          <button type="submit" class="btn btn-lime mt-6 px-8 py-4 text-base" data-submit>Send message <span class="btn-arrow h-5 w-5">${ICONS.arrow}</span></button>
          <p class="mt-4 hidden rounded-2xl p-4 text-sm font-bold" data-form-status role="status"></p>
        </form>
        <aside class="lg:col-span-2">
          <div class="rounded-4xl bg-navy p-7 text-white">
            <h2 class="font-display text-2xl">Prefer email?</h2>
            <p class="mt-2 text-white/70">Drop us a line any time.</p>
            <a href="mailto:${esc(site.email)}" class="mt-5 inline-flex items-center gap-2 break-all font-bold text-lime"><span class="h-5 w-5 flex-none">${ICONS.mail}</span>${esc(site.email)}</a>
            <div class="mt-6 flex gap-2.5">${W.socialLinks("h-11 w-11 bg-white/10 hover:bg-lime hover:text-navy")}</div>
            <div class="mt-8 flex gap-2 opacity-70">${foot("l", "#7fb829", 18)}${foot("r", "#7fb829", 18)}</div>
          </div>
          <a href="${ROOT}pages/volunteer.html" class="mt-4 flex items-center justify-between rounded-4xl bg-lime p-6 font-display text-lg text-navy transition hover:-translate-y-1">Want to volunteer? <span class="h-6 w-6">${ICONS.arrow}</span></a>
        </aside>
      </div>`;
    },
  };

  if (host && renderers[page]) host.innerHTML = renderers[page]();

  // contact form: send with AJAX so people stay on the page
  const form = $("[data-contact-form]");
  if (form) {
    const status = $("[data-form-status]");
    const btn = $("[data-submit]");
    const show = (msg, ok) => {
      status.textContent = msg;
      status.className = `mt-4 rounded-2xl p-4 text-sm font-bold ${ok ? "bg-lime/20 text-navy" : "bg-red-50 text-red-700"}`;
    };
    form.addEventListener("submit", async (e) => {
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
      e.preventDefault();
      btn.disabled = true;
      btn.classList.add("opacity-60");
      try {
        const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error("bad response");
        form.reset();
        show("Thanks! Your message is on its way — we'll get back to you soon. 💚", true);
      } catch (err) {
        show(`Sorry, that didn't send. Please email us at ${get("site.email")}.`, false);
      } finally {
        btn.disabled = false;
        btn.classList.remove("opacity-60");
      }
    });
  }

  W.renderTrails();
  W.initReveal();
})();
