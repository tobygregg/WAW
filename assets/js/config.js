/* =====================================================================
   WORLD AID WALK — SITE CONFIG  ✏️  (the only file you normally edit)
   ---------------------------------------------------------------------
   • Change any text, date, price or link below and refresh the page.
   • Keep the quotes and commas exactly as they are around each value.
   • {year} anywhere in a text is swapped for event.year automatically.
   • Text marked "(html ok)" can contain simple tags like <strong>.
   • Social share preview (Open Graph) text lives in the <head> of each
     .html file because Facebook/WhatsApp don't run JavaScript.
   ===================================================================== */

window.WAW_CONFIG = {

  /* ------------------------------------------------------------------
     SITE BASICS
     ------------------------------------------------------------------ */
  site: {
    name: "World Aid Walk",
    url: "https://www.worldaidwalk.org.gg",          // live site address (no trailing slash)
    email: "worldaidwalk@gmail.com",
    charityNumber: "171",                            // Guernsey registered charity no.
  },

  /* ------------------------------------------------------------------
     THE EVENT
     ------------------------------------------------------------------ */
  event: {
    year: "2027",
    // Used for the countdown. Format: YYYY-MM-DDTHH:MM:SS+01:00 (Guernsey summer time)
    countdownTo: "2027-05-03T09:30:00+01:00",
    showCountdown: true,
    slogan: "Fighting Poverty with Heart & Sole",
  },

  /* ------------------------------------------------------------------
     ALL THE IMPORTANT LINKS
     ------------------------------------------------------------------ */
  links: {
    registerGuernsey: "https://race-nation.co.uk/register/world-aid-walk/world-aid-walk-2026-guernsey",
    registerHerm: "https://race-nation.co.uk/register/world-aid-walk/world-aid-walk-2026-herm",
    donate: "https://sportsgiving.co.uk/sponsorship/race/4983",
    facebook: "https://www.facebook.com/WorldAidWalk/",
    instagram: "https://www.instagram.com/worldaidwalk/",
    twitter: "https://twitter.com/WorldAidWalk/",
    privacyStatementPdf: "http://www.worldaidwalk.org.gg/wp-content/uploads/2021/05/WAW-Fair-Processing-Notice-July-2020.pdf",
    raceNationSupport: "http://support.race-nation.com/",
    raceNationNoEmails: "http://support.race-nation.com/article/13-i-have-entered-but-have-had-no-emails-or-any-confirmation",
  },

  /* ------------------------------------------------------------------
     TOP NAVIGATION  (href = section id on the home page)
     ------------------------------------------------------------------ */
  nav: [
    { label: "Walk Info", href: "#walk-info" },
    { label: "Charities", href: "#charities" },
    { label: "Sponsors", href: "#sponsors" },
    { label: "Donate", href: "#donate" },
    { label: "Prepare", href: "#prepare" },
  ],
  navButton: { label: "Enter Now", href: "#enter" },

  /* ------------------------------------------------------------------
     HERO (the big video bit at the top)
     ------------------------------------------------------------------ */
  hero: {
    eyebrow: "Guernsey's charity walk · since 1970",
    bigText: "MAY 3",
    smallText: "{year}",
    sticker: "Since 1970",
    primaryButton: { label: "Register Now", href: "#enter" },
    secondaryButton: { label: "Walk info", href: "#walk-info" },
    video: {
      // Easiest way to swap the video: replace the files in assets/video, keeping these names.
      // Keep it short (~20s), no audio, "web optimised"/faststart, under ~3MB (desktop) / ~1.5MB (mobile).
      // File names are CASE-SENSITIVE on GitHub Pages (hero.mp4 ≠ Hero.MP4).
      mp4: "assets/video/hero.mp4",              // desktop (720p)
      mp4Mobile: "assets/video/hero-mobile.mp4", // phones (540p) — delete this line to use one file for all
      poster: "assets/video/hero-poster.jpg",    // still image shown while the video loads (use the first frame)
    },
  },

  /* ------------------------------------------------------------------
     NUMBERS STRIP (under the hero). number + prefix/suffix animate up.
     ------------------------------------------------------------------ */
  stats: [
    { number: 1970, prefix: "", suffix: "", label: "First walk", plain: true },
    { number: 500, prefix: "£", suffix: "k+", label: "Raised for charity" },
    { number: 3, prefix: "", suffix: "", label: "Walks to choose from" },
    { number: 2, prefix: "£1 → £", suffix: "", label: "Every £1 raised is doubled" },
  ],

  /* ------------------------------------------------------------------
     OUR STORY
     ------------------------------------------------------------------ */
  story: {
    eyebrow: "A Guernsey tradition",
    title: "Over 50 years of walking to fight poverty",
    // (html ok)
    text: "The World Aid Walk began in <strong>1970</strong> as a small local event organised by <strong>Roy Banniers</strong> and his friend <strong>Ken Wild</strong>. Since then it has grown into an island favourite — families, friends, teams and even a samba band — and has raised <strong>in excess of £500,000</strong> for charities fighting poverty around the world.",
  },

  /* ------------------------------------------------------------------
     WALK INFORMATION  (Guernsey / Herm toggle)
     Map pins use [longitude, latitude] — find them on Google Maps by
     right-clicking a spot (Google shows latitude first, so swap them!).
     ------------------------------------------------------------------ */
  walkInfo: {
    title: "Walk Information",
    intro: "There are three walk options: Guernsey Full, Guernsey Half and Herm. Pick your island below.",
    note: "Registration will close the day before the walk. We encourage all walkers to raise as much money as possible to help in the fight against poverty.",
    islands: {
      guernsey: {
        label: "Guernsey",
        tagline: "Coastal paths from Port Soif to L'Ancresse",
        walks: [
          {
            name: "Guernsey Full",
            distance: "20 km",
            time: "9.30am",
            start: "Rovers Athletic Club, Port Soif",
            finish: "Rovers Athletic Club, Port Soif",
            badge: "Full",
          },
          {
            name: "Guernsey Half",
            distance: "10 km",
            time: "12pm",
            start: "Pembroke Bay (right of the Beach Café, parkrun side)",
            finish: "Rovers Athletic Club, Port Soif",
            badge: "Half",
          },
        ],
        map: {
          // The coloured route line follows the coast between these two points
          route: { from: [-2.5822, 49.4866], to: [-2.5205, 49.5046] },
          pins: [
            { label: "Start & Finish", sub: "Rovers AC, Port Soif", at: [-2.5822, 49.4866], type: "main" },
            { label: "Half start", sub: "Pembroke Bay", at: [-2.5215, 49.5038], type: "alt" },
          ],
        },
      },
      herm: {
        label: "Herm",
        tagline: "A beautiful 8.5 km loop of Herm Island",
        walks: [
          {
            name: "Herm",
            distance: "8.5 km",
            time: "9.30am",
            start: "Herm Harbour (check in at The Ship before)",
            finish: "The Ship",
            badge: "Herm",
          },
        ],
        map: {
          route: "loop", // "loop" = all the way round the island
          pins: [
            { label: "Start & Finish", sub: "Herm Harbour · The Ship", at: [-2.4566, 49.4711], type: "main" },
            { label: "Shell Beach", sub: "", at: [-2.4443, 49.4772], type: "minor" },
            { label: "Belvoir Bay", sub: "", at: [-2.4432, 49.4672], type: "minor" },
          ],
        },
      },
    },
  },

  /* ------------------------------------------------------------------
     CHARITIES
     logo: path to an image (PNG/SVG/WebP). Leave "" to show the styled
     name badge instead. Drop official logos in assets/images/logos/
     ------------------------------------------------------------------ */
  charities: {
    eyebrow: "Where your money goes",
    title: "The charities you're walking for",
    intro: "The World Aid Walk is proud to raise funds for these Guernsey registered charities.",
    items: [
      {
        name: "Christian Aid",
        logo: "assets/images/logos/christian-aid.webp",
        badgeStyle: "christian-aid",
        text: "A worldwide charity working to sustain life and build better living conditions in areas of poverty. Local partners on the ground make sure aid reaches the people who need it most — right now supporting vulnerable and displaced people in Gaza and Ukraine.",
        highlights: ["Worldwide projects", "Gaza & Ukraine relief"],
        url: "https://www.christianaid.org.uk/",
      },
      {
        name: "The Tumaini Fund",
        logo: "assets/images/logos/tumaini-fund.webp",
        badgeStyle: "tumaini",
        text: "Founded in Guernsey in 2003 and now also registered in the UK, USA and Canada. Tumaini supports AIDS orphans in Kagera, NW Tanzania — in their own communities, not orphanages — with education to degree or college level, clean water, decent housing and school buildings.",
        highlights: ["Founded in Guernsey, 2003", "50,000 orphans supported"],
        url: "https://www.tumainifund.org.uk/",
      },
      {
        name: "This Is EPIC",
        logo: "assets/images/logos/this-is-epic.webp",
        logoBg: "#faa73f", // fills the logo box behind square logos (optional)
        badgeStyle: "epic",
        text: "Empowers local organisations in Uganda and the Democratic Republic of Congo to run their own Village Savings and Loans projects — teaching groups to save, lend and invest in income-generating work, so families in extreme poverty can build a stable, sustainable future.",
        highlights: ["Uganda & DR Congo", "Village Savings & Loans"],
        url: "https://www.thisisepic.org.uk/",
      },
      {
        name: "The Eleanor Foundation",
        logo: "assets/images/logos/eleanor-foundation.webp",
        badgeStyle: "eleanor",
        text: "Created in 2012 in memory of Eleanor Carey, who died aged 22 while cycling in London. Ellie cared deeply about sustainable development and clean water, so since 2014 the Foundation has been installing shallow wells and protected springs in North West Tanzania.",
        highlights: ["Clean water & sanitation", "NW Tanzania since 2014"],
        url: "https://www.eleanorfoundation.co.uk/",
      },
    ],
  },

  /* ------------------------------------------------------------------
     SPONSORS
     icon options: "scales", "globe", "runner"
     ------------------------------------------------------------------ */
  sponsors: {
    eyebrow: "Thank you",
    title: "Our sponsors & supporters",
    // (html ok)
    intro: "The World Aid Walk is delighted to be sponsored by <strong>Number 10 Advocates</strong>, with match funding from the <strong>Guernsey Overseas Aid &amp; Development Commission</strong>. Their support keeps the walk running smoothly and means every penny raised goes straight to the charities.",
    matchHeadline: "Every £1 you raise is doubled",
    items: [
      {
        name: "Number 10 Advocates",
        role: "Headline sponsor",
        icon: "scales",
        text: "A Guernsey law firm at 10 Lefebvre Street, by the Royal Court — nine dedicated lawyers delivering exceptional legal services with a personal touch.",
        url: "https://number10advocates.com/",
      },
      {
        name: "Overseas Aid & Development Commission",
        role: "Match funding",
        icon: "globe",
        text: "\"Helping the world's least developed countries through a hand up rather than a hand-out.\" Their match funding doubles every £1 raised.",
        url: "https://www.gov.gg/overseasaid",
      },
      {
        name: "Rovers Athletic Club",
        role: "Walk HQ",
        icon: "runner",
        text: "Our home at Port Soif — a huge thank you to Rovers AC for their support of the World Aid Walk.",
        url: "http://www.roversac.com/",
      },
    ],
  },

  /* ------------------------------------------------------------------
     DONATE
     ------------------------------------------------------------------ */
  donate: {
    eyebrow: "Can't make it on the day?",
    title: "Every step counts. Every pound doubles.",
    text: "You don't have to walk to make a difference. Sponsor a walker or give directly — thanks to match funding, every £1 raised is doubled and goes straight to the charities fighting poverty.",
    buttonLabel: "Donate now",
    note: "Secure donations via SportsGiving",
  },

  /* ------------------------------------------------------------------
     ENTER / REGISTRATION
     status: "open" | "soon" | "closed"
     ------------------------------------------------------------------ */
  register: {
    status: "open",
    statusText: {
      open: "Registration for the {year} walk is NOW OPEN!",
      soon: "Registration for the {year} walk opens soon",
      closed: "Registration for the {year} walk has closed",
    },
    title: "Enter the walk",
    closes: "Registration will close at 4pm on Sunday 2nd May {year}.",
    text: "You have the choice of two Guernsey walks as well as the beautiful walk in Herm. If the full 20 km route is too long, choose the half distance walk, or the 8.5 km Herm walk.",
    afterText: "Once registered, you'll be sent a confirmation with your unique Walker Number and a link to your personal online fundraising page.",
    fees: [
      { who: "Adult", age: "19+", price: "£15", latePrice: "£20" },
      { who: "Youth", age: "Under 19", price: "£10", latePrice: "£13" },
    ],
    buttons: [
      { label: "Enter Guernsey", sub: "Full 20 km · Half 10 km", link: "registerGuernsey" },
      { label: "Enter Herm", sub: "8.5 km island loop", link: "registerHerm" },
    ],
    tshirt: {
      title: "Walk T-shirt",
      price: "£18",
      text: "Special World Aid Walk t-shirts are available to buy for just £18 when you register. Adult and children's sizes are available, but stock of each size is limited — register early to avoid disappointment.",
      front: "assets/images/shirt/tshirt-front.webp",
      back: "assets/images/shirt/tshirt-back.webp",
    },
  },

  /* ------------------------------------------------------------------
     PREPARATION TIPS  (icon options: shoe, firstaid, jacket, bottle, map, shield)
     ------------------------------------------------------------------ */
  prepare: {
    eyebrow: "Preparation",
    title: "Top six tips for the walk",
    tips: [
      { icon: "shoe", title: "Wear comfortable shoes", text: "It's a long walk and an unsuitable pair of shoes will cause you lots of problems!" },
      { icon: "firstaid", title: "First aid kit", text: "Bring a small first aid kit — plasters, suncream and so on." },
      { icon: "jacket", title: "Dress appropriately", text: "Dress for the weather and the event. Rain? Bring a waterproof. Sun? Come prepared." },
      { icon: "bottle", title: "Food & drink", text: "Water is available at checkpoints, but bring enough food and drink for your own needs." },
      { icon: "map", title: "Know the route", text: "Get familiar with the route before you set off on the walk." },
      { icon: "shield", title: "Be safe & sensible", text: "Marshals are at many stops and crossings, but stay aware of what's around you and of traffic. It's a walk — no running please!" },
    ],
  },

  /* ------------------------------------------------------------------
     FOOTER
     ------------------------------------------------------------------ */
  footer: {
    blurb: "Walking together since 1970 to raise money for charities fighting poverty around the world.",
    pages: [
      { label: "Volunteer", href: "pages/volunteer.html" },
      { label: "Contact us", href: "pages/contact.html" },
      { label: "Registration support", href: "pages/support.html" },
      { label: "Privacy", href: "pages/privacy.html" },
      { label: "Terms & Conditions", href: "pages/terms.html" },
    ],
    credit: "Map data © OpenStreetMap contributors & geoBoundaries",
  },

  /* ------------------------------------------------------------------
     EXTRA PAGES (their wording)
     ------------------------------------------------------------------ */
  pages: {
    volunteer: {
      title: "Volunteer",
      intro: "The Walk simply couldn't happen without our volunteers.",
      // (html ok) — each item is a paragraph
      body: [
        "The Guernsey World Aid Walk relies on many volunteers to make the event run smoothly and to ensure the safety of walkers. Without these people the Walk simply couldn't go ahead, and we are so grateful to everyone who gives up their time.",
        "As the Walk gets bigger we are always in need of additional volunteers to help with <strong>checkpoints</strong>, <strong>serving refreshments</strong> or <strong>marshalling</strong>.",
        "If you could help, please use our contact page and one of our team will be in touch.",
      ],
      roles: ["Checkpoints", "Refreshments", "Marshalling"],
    },
    contact: {
      title: "Contact us",
      intro: "Questions, ideas or want to volunteer? Get in touch and the team will get back to you.",
      // these show as quick "email us about…" buttons on the contact page
      topics: ["General question", "Volunteering", "Registration", "Sponsorship", "Fundraising"],
    },
    support: {
      title: "Registration support",
      intro: "Race Nation provide our fabulous online registration service.",
      body: [
        "Hopefully everything about your registration will be smooth. However, if you need some help or if you don't receive your emails, please check your junk/spam folder first and then get in touch with Race Nation.",
      ],
    },
    privacy: {
      title: "Privacy",
      intro: "How we look after your information.",
      body: [
        "The World Aid Walk (Guernsey registered charity no. 171) collects and processes your information in accordance with the Data Protection (Bailiwick of Guernsey) Law, 2017.",
        "Information collected is used only for the purpose of registering walkers and ensuring their safety.",
      ],
    },
    terms: {
      title: "Terms & Conditions",
      intro: "Please read these before entering the walk.",
      items: [
        "I understand that I enter this event at my own risk and that Race Nation, the event organiser or any of our event partners and sponsors will not be held responsible for any accident suffered or injury sustained by myself from any cause whatsoever.",
        "I understand that this waiver includes any claims, whether caused by negligence, the action or inaction of any of the above parties, or otherwise.",
        "By entering the event I am also indicating and declaring that I am medically fit and able to complete this event and do so totally and absolutely at my own risk. I am also aware that any medical conditions that I suffer from must be indicated to the race organisers prior to my taking part in the event.",
        "Race Nation, the event organiser or any of our event partners and sponsors will not be held responsible for any property lost, mislaid or stolen on the course, at the bag drop areas or in the event site.",
        "I understand that once I enter this event, my entry is non-refundable under any circumstances and entries are non-transferable to other potential participants.",
        "Please note that registration implies an obligation to hand in any money collected.",
      ],
    },
  },
};