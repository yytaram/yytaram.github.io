/* =========================
   SLC Project Website
   Vanilla JavaScript only
   ========================= */

(() => {
  "use strict";

  // -------------------------
  // Project placeholders
  // Edit these values to customise the site quickly.
  // -------------------------
  const PROJECT = {
    issueTitle: "[INSERT YOUR SOCIAL ISSUE HERE]",
    teamName: "[INSERT TEAM NAME]",
    targetAudience: "[INSERT TARGET AUDIENCE]",
    mainGoal: "[INSERT MAIN GOAL]",
    visualMood: "[INSERT VISUAL STYLE, e.g. dark elegant / modern academic / energetic youth campaign]",
  };

  const STORAGE = {
    theme: "slc_theme",
    challenge: "slc_selectedChallenge",
    quiz: "slc_quizResult",
    lastOpened: "slc_lastOpened",
  };

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Small helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function safeSetText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  // -------------------------
  // Bind placeholder text
  // -------------------------
  function bindProjectText() {
    const binds = $$("[data-bind]");
    for (const el of binds) {
      const key = el.getAttribute("data-bind");
      if (!key) continue;
      if (Object.prototype.hasOwnProperty.call(PROJECT, key)) {
        el.textContent = PROJECT[key];
      }
    }

    // Subtle hint if bracket placeholders still exist
    const anyBracket = Object.values(PROJECT).some(v => typeof v === "string" && v.includes("[INSERT"));
    const hint = $("#customiseHint");
    if (hint) hint.hidden = !anyBracket;
  }

  // -------------------------
  // Theme toggle (dark/light)
  // data-theme on <html>
  // -------------------------
  function getSystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    const html = document.documentElement;

    // allow "auto" only internally; store light/dark in localStorage
    html.setAttribute("data-theme", theme);

    const toggle = $("#themeToggle");
    const toggleText = $("#themeToggleText");
    if (!toggle) return;

    const isDark = theme === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    safeSetText(toggleText, isDark ? "Dark" : "Light");

    // Switch icon
    const iconUse = toggle.querySelector("use");
    if (iconUse) iconUse.setAttribute("href", isDark ? "#i-sun" : "#i-moon");

    // Update meta theme-color (nice touch)
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#070b16" : "#f7f9ff");
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE.theme);
    const initial = saved || getSystemTheme();
    applyTheme(initial);

    const toggle = $("#themeToggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE.theme, next);
      applyTheme(next);
      toast(`Theme set to ${next}.`);
    });
  }

  // -------------------------
  // Sticky header shadow + header height CSS var
  // -------------------------
  function updateHeaderHeightVar() {
    const header = $(".site-header");
    if (!header) return;
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", `${Math.round(h)}px`);
  }

  function initHeaderScrollState() {
    const header = $(".site-header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // -------------------------
  // Mobile menu
  // -------------------------
  function initMobileMenu() {
    const header = $(".site-header");
    const toggle = $("#menuToggle");
    const overlay = $("#navOverlay");
    const menu = $("#navMenu");

    if (!header || !toggle || !overlay || !menu) return;

    const open = () => {
      header.classList.add("nav-open");
      document.body.classList.add("no-scroll");
      overlay.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      // swap icon
      const use = toggle.querySelector("use");
      if (use) use.setAttribute("href", "#i-close");
    };

    const close = () => {
      header.classList.remove("nav-open");
      document.body.classList.remove("no-scroll");
      overlay.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      const use = toggle.querySelector("use");
      if (use) use.setAttribute("href", "#i-menu");
    };

    const isOpen = () => header.classList.contains("nav-open");

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));
    overlay.addEventListener("click", close);

    // Close when clicking a link
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      close();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });

    // Auto-close on resize to desktop
    const mq = window.matchMedia("(max-width: 980px)");
    const onResize = () => {
      if (!mq.matches) close();
      updateHeaderHeightVar();
    };
    window.addEventListener("resize", onResize);
    onResize();
  }

  // -------------------------
  // Smooth scroll helpers (anchors) + optional focus
  // -------------------------
  function initAnchorFocusHelper() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;

      const hash = a.getAttribute("href");
      if (!hash || hash === "#") return;

      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      // Let browser do smooth scroll; we just handle optional focus targets
      const focusId = a.getAttribute("data-focus");
      if (focusId) {
        // delay to allow scroll settle
        setTimeout(() => {
          const focusEl = document.getElementById(focusId);
          focusEl?.focus?.();
        }, prefersReducedMotion ? 0 : 420);
      }
    });
  }

  // -------------------------
  // Scroll spy (active link highlighting)
  // -------------------------
  function initScrollSpy() {
    const links = $$(".nav__link[href^='#']");
    const sections = $$("main section[id]");

    if (!links.length || !sections.length) return;

    const linkById = new Map();
    for (const link of links) {
      const id = link.getAttribute("href")?.slice(1);
      if (id) linkById.set(id, link);
    }

    let ticking = false;

    const setActive = (id) => {
      for (const [sid, link] of linkById.entries()) {
        const active = sid === id;
        link.classList.toggle("is-active", active);
        link.setAttribute("aria-current", active ? "page" : "false");
      }
    };

    const pickCurrentSection = () => {
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
      const y = window.scrollY + headerH + 120;

      let current = sections[0].id;
      for (const s of sections) {
        if (s.offsetTop <= y) current = s.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        pickCurrentSection();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => pickCurrentSection());
    pickCurrentSection();
  }

  // -------------------------
  // Reveal on scroll
  // -------------------------
  function initRevealOnScroll() {
    const revealEls = $$("[data-reveal], .reveal");
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    revealEls.forEach(el => io.observe(el));
  }

  // -------------------------
  // Challenges data + UI
  // -------------------------
  const CHALLENGES = [
    {
      key: "clarify-values",
      title: "Clarify Values",
      kicker: "Agree what we stand for before we act.",
      what: "We created a short team charter: our values, boundaries (what we will/won’t do), and how we will communicate respectfully while working on the issue in Kazakhstan.",
      why: "Clear values reduced confusion, prevented conflict, and made our outreach messages consistent and responsible.",
      evidence: "[Insert real evidence here: team charter photo/PDF, meeting notes, agreed roles & responsibilities]",
      impact: "We worked faster, resolved disagreements more calmly, and represented our project with a shared, trustworthy tone."
    },
    {
      key: "set-example",
      title: "Set a Personal Example",
      kicker: "Model the behaviour we want to see.",
      what: "We started with ourselves: practising the habits we promoted (e.g. respectful language, safer online behaviour, following school guidelines, showing up on time, doing what we promised).",
      why: "People trust actions more than words. Modelling the behaviour increased credibility and made it easier to enlist others.",
      evidence: "[Insert real evidence here: reflection logs, peer observations, photos from preparation, code of conduct]",
      impact: "Our team became a visible example, which helped more students participate without embarrassment or fear."
    },
    {
      key: "share-vision",
      title: "Share a Vision",
      kicker: "Make the future feel clear and possible.",
      what: "We drafted a one-minute vision statement for assemblies and social posts: what a better situation looks like for our audience in Kazakhstan, and what small steps lead there.",
      why: "A vision motivates. It helps people understand ‘why now’ and shows the project is more than a one-time event.",
      evidence: "[Insert real evidence here: vision statement script, slides, recorded talk, poster draft]",
      impact: "Our project became easier to explain, which improved engagement and reduced hesitation from stakeholders."
    },
    {
      key: "enlist-others",
      title: "Enlist Others",
      kicker: "Invite help in specific, realistic ways.",
      what: "We created ‘micro-roles’ so people could contribute in 10–20 minutes (sharing a post, helping collect feedback, translating a leaflet, setting up a room).",
      why: "People participate more when tasks feel doable and safe. Clear roles also protect quality and accountability.",
      evidence: "[Insert real evidence here: volunteer sign-up sheet, role cards, collaboration screenshots]",
      impact: "Participation increased—and our team avoided burnout by sharing responsibility."
    },
    {
      key: "opportunities",
      title: "Search for Opportunities",
      kicker: "Look for moments where action is possible.",
      what: "We scanned school routines (class meetings, clubs, parent events) to find the best moments to run sessions and distribute resources without disrupting learning.",
      why: "Timing matters. Using existing opportunities made the project feel natural and boosted attendance.",
      evidence: "[Insert real evidence here: event calendar, approvals, invitation messages, timetable screenshots]",
      impact: "We reached more people with less effort and built a sustainable project rhythm."
    },
    {
      key: "risks",
      title: "Experiment and Take Risks",
      kicker: "Test small, learn fast, improve.",
      what: "We ran a pilot session with a small group first, collected feedback, and adjusted language, structure, and visuals before delivering to a wider audience.",
      why: "Small experiments reduce risk, improve safety, and make the final version stronger and more inclusive.",
      evidence: "[Insert real evidence here: pilot photos, feedback form results, before/after materials]",
      impact: "Our final session felt smoother and more relevant because it was built from real responses."
    },
    {
      key: "collaboration",
      title: "Foster Collaboration",
      kicker: "Build teamwork across groups.",
      what: "We collaborated with mentors/teachers and at least one stakeholder (e.g. counsellor, NGO, youth group). We agreed on roles and how decisions would be made.",
      why: "Collaboration increases expertise, reach, and credibility—especially on sensitive social issues.",
      evidence: "[Insert real evidence here: partner emails, meeting agenda, permission notes, co-created materials]",
      impact: "We reduced mistakes and improved trust because we worked with people who had experience."
    },
    {
      key: "strengthen-others",
      title: "Strengthen Others",
      kicker: "Help people feel capable and confident.",
      what: "We created simple resources (one-page guide, short video script, Q&A sheet) so classmates could explain the issue confidently and support each other.",
      why: "Leadership grows others, not only the project. Tools make people more independent and reduce reliance on the core team.",
      evidence: "[Insert real evidence here: resource files, training slide, distribution proof]",
      impact: "More students could support the initiative with confidence, which extended our project’s reach."
    },
    {
      key: "recognise",
      title: "Recognise Contributions",
      kicker: "Notice effort publicly and fairly.",
      what: "We thanked volunteers and partners with clear, specific recognition (what they did and why it mattered), plus simple certificates where appropriate.",
      why: "Recognition builds motivation and strengthens relationships. Specific appreciation also encourages repeat support.",
      evidence: "[Insert real evidence here: certificates, shoutout posts, thank-you messages (with permission)]",
      impact: "Volunteers felt valued, and partners were more open to future collaboration."
    },
    {
      key: "celebrate",
      title: "Celebrate the Values and Victories",
      kicker: "Mark progress and keep momentum.",
      what: "We ended with a short celebration: a recap of what changed, what we learned, and the values we practised. We also documented the ‘wins’ in a final summary.",
      why: "Celebrations increase retention and make the project feel meaningful. They also provide clear evidence for your SLC portfolio.",
      evidence: "[Insert real evidence here: final recap slide, group photo, summary post, reflection notes]",
      impact: "The project closed with energy and pride—and we created a clear handover plan for next steps."
    }
  ];

  function initChallengesUI() {
    const tabs = $("#challengeTabs");
    const panel = $("#challengePanel");
    const resetBtn = $("#resetChallengeChoice");
    if (!tabs || !panel || !resetBtn) return;

    // Build tabs
    tabs.innerHTML = "";
    for (const c of CHALLENGES) {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.type = "button";
      btn.role = "tab";
      btn.id = `tab-${c.key}`;
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("aria-controls", `panel-${c.key}`);
      btn.dataset.key = c.key;
      btn.textContent = c.title;
      tabs.appendChild(btn);
    }

    function renderPanel(c) {
      panel.innerHTML = `
        <div class="challenge-panel__title">
          <div>
            <h3 id="panel-${c.key}">${escapeHTML(c.title)}</h3>
            <div class="challenge-panel__kicker">${escapeHTML(c.kicker)}</div>
          </div>
          <span class="badge badge--soft">SLC practice</span>
        </div>

        <div class="detail-grid">
          <div class="detail">
            <div class="detail__head">
              <span class="detail__dot" aria-hidden="true"></span>
              <p class="detail__title">What we did</p>
            </div>
            <p class="detail__text">${escapeHTML(c.what)}</p>
          </div>

          <div class="detail">
            <div class="detail__head">
              <span class="detail__dot" aria-hidden="true"></span>
              <p class="detail__title">Why it was important</p>
            </div>
            <p class="detail__text">${escapeHTML(c.why)}</p>
          </div>

          <div class="detail">
            <div class="detail__head">
              <span class="detail__dot" aria-hidden="true"></span>
              <p class="detail__title">Evidence / results</p>
            </div>
            <p class="detail__text">${escapeHTML(c.evidence)}</p>
            <div class="detail__evidence">
              Suggestion: attach screenshots/photos and a 1–2 sentence explanation of what the evidence shows.
            </div>
          </div>

          <div class="detail">
            <div class="detail__head">
              <span class="detail__dot" aria-hidden="true"></span>
              <p class="detail__title">Impact / takeaway</p>
            </div>
            <p class="detail__text">${escapeHTML(c.impact)}</p>
          </div>
        </div>
      `;
    }

    function selectChallenge(key, { focusPanel = false, userAction = false } = {}) {
      const found = CHALLENGES.find(x => x.key === key) || CHALLENGES[0];

      // Update tabs
      const allTabs = $$(".tab", tabs);
      for (const t of allTabs) {
        const isSelected = t.dataset.key === found.key;
        t.setAttribute("aria-selected", String(isSelected));
      }

      renderPanel(found);

      if (focusPanel) panel.focus({ preventScroll: true });

      if (userAction) {
        localStorage.setItem(STORAGE.challenge, found.key);
      }
    }

    // Restore saved
    const saved = localStorage.getItem(STORAGE.challenge);
    selectChallenge(saved || CHALLENGES[0].key, { userAction: false });

    // Click handlers + keyboard nav
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      selectChallenge(btn.dataset.key, { focusPanel: true, userAction: true });
      toast(`Selected: ${btn.textContent}`);
    });

    tabs.addEventListener("keydown", (e) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(e.key)) return;

      const all = $$(".tab", tabs);
      const currentIndex = all.findIndex(b => b.getAttribute("aria-selected") === "true");
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + all.length) % all.length;
      if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % all.length;
      if (e.key === "Home") nextIndex = 0;
      if (e.key === "End") nextIndex = all.length - 1;

      e.preventDefault();
      all[nextIndex].focus();
      selectChallenge(all[nextIndex].dataset.key, { focusPanel: false, userAction: true });
    });

    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE.challenge);
      selectChallenge(CHALLENGES[0].key, { focusPanel: true, userAction: false });
      toast("Challenge selection reset.");
    });
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------------------------
  // Counters (count-up animation)
  // -------------------------
  function animateCounter(el, target, suffix = "", duration = 1200) {
    if (!el) return;

    const start = 0;
    const startTime = performance.now();
    const d = prefersReducedMotion ? 0 : duration;

    const step = (now) => {
      const t = d === 0 ? 1 : clamp((now - startTime) / d, 0, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = `${value}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = $$("[data-counter]");
    if (!counters.length) return;

    if (prefersReducedMotion) {
      counters.forEach(el => {
        const target = Number(el.dataset.target || "0");
        const suffix = el.dataset.suffix || "";
        el.textContent = `${target}${suffix}`;
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;
        const target = Number(el.dataset.target || "0");
        const suffix = el.dataset.suffix || "";
        animateCounter(el, target, suffix, 1200);
        io.unobserve(el);
      }
    }, { threshold: 0.35 });

    counters.forEach(el => io.observe(el));
  }

  // -------------------------
  // Gallery data + modal
  // -------------------------
  const GALLERY_ITEMS = [
    {
      id: "g1",
      type: "event",
      title: "Awareness session (photo)",
      caption: "Photo evidence from our session with students. [Insert photo or replace thumbnail with real image]",
      tags: ["event", "students", "school"],
      thumbStyle: "event"
    },
    {
      id: "g2",
      type: "poster",
      title: "Poster draft (v1 → v2)",
      caption: "We improved clarity after feedback. [Insert before/after poster screenshots]",
      tags: ["poster", "design", "iteration"],
      thumbStyle: "poster"
    },
    {
      id: "g3",
      type: "social",
      title: "Outreach post (screenshot)",
      caption: "Social media outreach with a clear call-to-action and safe language. [Insert post screenshot + link]",
      tags: ["social", "outreach"],
      thumbStyle: "event"
    },
    {
      id: "g4",
      type: "data",
      title: "Survey summary (chart)",
      caption: "Survey results used to guide improvements. [Insert anonymised chart or key results]",
      tags: ["data", "survey"],
      thumbStyle: "data"
    },
    {
      id: "g5",
      type: "certificate",
      title: "Certificate / recognition",
      caption: "Recognition for volunteers or speakers. [Insert certificate photo or official confirmation]",
      tags: ["certificate", "thanks"],
      thumbStyle: "certificate"
    },
    {
      id: "g6",
      type: "event",
      title: "Partner meeting (notes)",
      caption: "Planning notes and agreement on roles. [Insert meeting agenda, notes, approvals]",
      tags: ["collaboration", "planning"],
      thumbStyle: "event"
    },
    {
      id: "g7",
      type: "poster",
      title: "Resource handout (one-page)",
      caption: "Practical resource for students/families. [Insert PDF screenshot or photo of handout]",
      tags: ["resource", "poster"],
      thumbStyle: "poster"
    },
    {
      id: "g8",
      type: "social",
      title: "Thank-you post",
      caption: "Recognising contributions (with permission). [Insert post screenshot; blur private info if needed]",
      tags: ["social", "recognition"],
      thumbStyle: "certificate"
    }
  ];

  function initGallery() {
    const grid = $("#galleryGrid");
    const modal = $("#galleryModal");
    const modalPreview = $("#modalPreview");
    const modalTitle = $("#modalTitle");
    const modalCaption = $("#modalCaption");
    const modalMeta = $("#modalMeta");
    const closeBtn = $("#modalClose");

    if (!grid || !modal || !modalPreview || !modalTitle || !modalCaption || !modalMeta || !closeBtn) return;

    function buildItem(item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-item";
      btn.dataset.galleryType = item.type;
      btn.dataset.id = item.id;
      btn.setAttribute("aria-label", `Open gallery item: ${item.title}`);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const thumb = document.createElement("div");
      thumb.className = `gallery-thumb ${thumbClass(item.thumbStyle)}`;
      thumb.setAttribute("aria-hidden", "true");

      const body = document.createElement("div");
      body.className = "gallery-body";

      const title = document.createElement("p");
      title.className = "gallery-title";
      title.textContent = item.title;

      const caption = document.createElement("p");
      caption.className = "gallery-caption";
      caption.textContent = item.caption;

      const tags = document.createElement("div");
      tags.className = "gallery-tags";
      (item.tags || []).forEach(t => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t;
        tags.appendChild(tag);
      });

      body.appendChild(title);
      body.appendChild(caption);
      body.appendChild(tags);

      card.appendChild(thumb);
      card.appendChild(body);
      btn.appendChild(card);

      return btn;
    }

    function thumbClass(style) {
      if (style === "poster") return "gallery-thumb--poster";
      if (style === "certificate") return "gallery-thumb--certificate";
      if (style === "data") return "gallery-thumb--data";
      return ""; // default
    }

    // Render
    grid.innerHTML = "";
    for (const item of GALLERY_ITEMS) {
      grid.appendChild(buildItem(item));
    }

    // Filtering
    const filterBtns = $$("[data-gallery-filter]");
    function setFilter(filter) {
      for (const b of filterBtns) {
        const active = b.dataset.galleryFilter === filter;
        b.classList.toggle("is-active", active);
      }

      const items = $$(".gallery-item", grid);
      items.forEach(btn => {
        const type = btn.dataset.galleryType;
        const show = filter === "all" || type === filter;
        btn.style.display = show ? "" : "none";
      });
    }
    filterBtns.forEach(b => {
      b.addEventListener("click", () => setFilter(b.dataset.galleryFilter));
    });

    // Modal open/close with focus restore
    let lastFocus = null;

    function openModal(item) {
      lastFocus = document.activeElement;

      modal.hidden = false;
      document.body.classList.add("no-scroll");

      modalTitle.textContent = item.title;
      modalCaption.textContent = item.caption;

      // Preview classes
      modalPreview.className = "modal__preview";
      modalPreview.classList.add(thumbClass(item.thumbStyle));

      // Meta tags
      modalMeta.innerHTML = "";
      item.tags.forEach(t => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t;
        modalMeta.appendChild(tag);
      });

      closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("no-scroll");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeModal();
    });

    // Open on click
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".gallery-item");
      if (!btn) return;

      const item = GALLERY_ITEMS.find(x => x.id === btn.dataset.id);
      if (!item) return;
      openModal(item);
    });
  }

  // -------------------------
  // Testimonials slider
  // -------------------------
  function initTestimonials() {
    const track = $("#testimonialTrack");
    const slider = $("#testimonialSlider");
    const prev = $("#testimonialPrev");
    const next = $("#testimonialNext");
    const dotsWrap = $("#testimonialDots");

    if (!track || !slider || !prev || !next || !dotsWrap) return;

    const slides = $$(".testimonial", track);
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function renderDots() {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dot";
        b.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
        b.addEventListener("click", () => go(i, true));
        dotsWrap.appendChild(b);
      });
    }

    function update() {
      const x = -index * 100;
      track.style.transform = `translateX(${x}%)`;

      const dots = $$(".dot", dotsWrap);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }

    function go(i, userAction = false) {
      index = (i + slides.length) % slides.length;
      update();
      if (userAction) toast(`Testimonial ${index + 1} of ${slides.length}`);
      restartAuto();
    }

    function restartAuto() {
      if (prefersReducedMotion) return;
      stopAuto();
      timer = window.setInterval(() => go(index + 1, false), 8000);
    }

    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    prev.addEventListener("click", () => go(index - 1, true));
    next.addEventListener("click", () => go(index + 1, true));

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", restartAuto);
    slider.addEventListener("focusin", stopAuto);
    slider.addEventListener("focusout", restartAuto);

    renderDots();
    update();
    restartAuto();
  }

  // -------------------------
  // Quiz (LocalStorage)
  // Correct answers: q1=b, q2=b, q3=b
  // -------------------------
  function initQuiz() {
    const form = $("#quizForm");
    const msg = $("#quizMsg");
    const savedBox = $("#quizSavedResult");

    if (!form || !msg || !savedBox) return;

    function loadSaved() {
      const raw = localStorage.getItem(STORAGE.quiz);
      if (!raw) {
        savedBox.hidden = true;
        return;
      }
      try {
        const data = JSON.parse(raw);
        const dt = new Date(data.ts);
        savedBox.hidden = false;
        savedBox.innerHTML = `
          <strong>Last result:</strong> ${data.score}/${data.total}
          • <strong>${data.label}</strong>
          <br/>
          <span class="mono">${dt.toLocaleString("en-GB")}</span>
        `;
      } catch {
        savedBox.hidden = true;
      }
    }

    function setMsg(text, type) {
      msg.textContent = text;
      msg.classList.remove("is-ok", "is-bad");
      if (type) msg.classList.add(type === "ok" ? "is-ok" : "is-bad");
    }

    function getAnswer(name) {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const a1 = getAnswer("q1");
      const a2 = getAnswer("q2");
      const a3 = getAnswer("q3");
      if (!a1 || !a2 || !a3) {
        setMsg("Please answer all three questions.", "bad");
        return;
      }

      const correct = { q1: "b", q2: "b", q3: "b" };
      let score = 0;
      score += a1 === correct.q1 ? 1 : 0;
      score += a2 === correct.q2 ? 1 : 0;
      score += a3 === correct.q3 ? 1 : 0;

      const total = 3;
      const label =
        score === 3 ? "Excellent" :
        score === 2 ? "Good" :
        score === 1 ? "Getting started" : "Try again";

      setMsg(`Score: ${score}/${total} — ${label}. (Saved on this device)`, "ok");

      localStorage.setItem(STORAGE.quiz, JSON.stringify({
        score, total, label, ts: Date.now()
      }));

      loadSaved();
    });

    $("#quizReset")?.addEventListener("click", () => {
      form.reset();
      localStorage.removeItem(STORAGE.quiz);
      setMsg("Quiz reset. Your saved result was cleared from this device.", "ok");
      loadSaved();
    });

    loadSaved();
  }

  // -------------------------
  // Pulse prompt (engagement mini-tool)
  // Generates a summary (good screenshot evidence)
  // -------------------------
  function initPulsePrompt() {
    const form = $("#pulseForm");
    const msg = $("#pulseMsg");
    const out = $("#pulseOutput");
    const summary = $("#pulseSummary");
    const clear = $("#pulseClear");

    if (!form || !msg || !out || !summary || !clear) return;

    function setMsg(text, type) {
      msg.textContent = text;
      msg.classList.remove("is-ok", "is-bad");
      if (type) msg.classList.add(type === "ok" ? "is-ok" : "is-bad");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const choice = $("#pulseChoice")?.value || "";
      const text = $("#pulseText")?.value?.trim() || "";

      if (!choice) {
        setMsg("Please choose an option.", "bad");
        return;
      }
      if (text.length < 10) {
        setMsg("Please write a bit more detail (at least 10 characters).", "bad");
        return;
      }

      const labelByChoice = {
        awareness: "Awareness/understanding",
        tools: "Practical tools/resources",
        collab: "Collaboration",
        reflection: "Reflection/lessons"
      };

      const label = labelByChoice[choice] || "Other";
      out.hidden = false;

      const dt = new Date().toLocaleString("en-GB");
      summary.textContent = `Most useful: ${label}. Improvement idea: ${text} (captured ${dt}).`;

      setMsg("Summary created. You can copy or screenshot this as evidence.", "ok");
      toast("Pulse summary created.");
    });

    clear.addEventListener("click", () => {
      form.reset();
      out.hidden = true;
      setMsg("Cleared.", "ok");
    });
  }

  // -------------------------
  // Feedback form validation (demo)
  // -------------------------
  function initFeedbackForm() {
    const form = $("#feedbackForm");
    const msg = $("#formMsg");
    const clearBtn = $("#clearForm");

    if (!form || !msg || !clearBtn) return;

    const fields = {
      name: $("#name"),
      email: $("#email"),
      role: $("#role"),
      topic: $("#topic"),
      message: $("#message"),
      consent: $("#consent"),
    };

    const errs = {
      name: $("#err-name"),
      email: $("#err-email"),
      role: $("#err-role"),
      topic: $("#err-topic"),
      message: $("#err-message"),
      consent: $("#err-consent"),
    };

    function setMsg(text, type) {
      msg.textContent = text;
      msg.classList.remove("is-ok", "is-bad");
      if (type) msg.classList.add(type === "ok" ? "is-ok" : "is-bad");
    }

    function setError(fieldKey, text) {
      const el = fields[fieldKey];
      const err = errs[fieldKey];
      if (!el || !err) return;

      err.textContent = text || "";
      const has = Boolean(text);
      el.setAttribute("aria-invalid", has ? "true" : "false");
    }

    function validate() {
      let ok = true;

      const name = (fields.name?.value || "").trim();
      if (name.length < 2) { setError("name", "Please enter a name (at least 2 characters)."); ok = false; }
      else setError("name", "");

      const email = (fields.email?.value || "").trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) { setError("email", "Please enter a valid email address."); ok = false; }
      else setError("email", "");

      const role = fields.role?.value || "";
      if (!role) { setError("role", "Please select your role."); ok = false; }
      else setError("role", "");

      const topic = fields.topic?.value || "";
      if (!topic) { setError("topic", "Please select a topic."); ok = false; }
      else setError("topic", "");

      const message = (fields.message?.value || "").trim();
      if (message.length < 20) { setError("message", "Please write at least 20 characters."); ok = false; }
      else setError("message", "");

      const consent = Boolean(fields.consent?.checked);
      if (!consent) { setError("consent", "Consent is required to proceed."); ok = false; }
      else setError("consent", "");

      return ok;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = validate();

      if (!ok) {
        setMsg("Please fix the highlighted fields.", "bad");
        toast("Form needs fixes.");
        return;
      }

      // Demo success message (no network submission)
      setMsg("Validated successfully. This is a demo form—no data was sent. Copy your message if needed.", "ok");
      localStorage.setItem("slc_feedbackValidatedAt", String(Date.now()));
      toast("Feedback validated (demo).");
    });

    clearBtn.addEventListener("click", () => {
      form.reset();
      Object.keys(errs).forEach(k => setError(k, ""));
      setMsg("Cleared.", "ok");
      toast("Form cleared.");
    });
  }

  // -------------------------
  // Back-to-top button
  // -------------------------
  function initBackToTop() {
    const btn = $("#backToTop");
    if (!btn) return;

    const showAfter = 700;

    const onScroll = () => {
      btn.hidden = window.scrollY < showAfter;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  // -------------------------
  // Placeholder links: show toast
  // -------------------------
  function initPlaceholderLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-placeholder-link='true']");
      if (!a) return;
      e.preventDefault();
      toast("Placeholder link — replace with your real URL.");
    });
  }

  // -------------------------
  // Toast
  // -------------------------
  let toastTimer = null;
  function toast(text) {
    const el = $("#toast");
    const t = $("#toastText");
    if (!el || !t) return;

    t.textContent = text;
    el.hidden = false;

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.hidden = true;
    }, 2800);
  }

  // -------------------------
  // Footer utilities
  // -------------------------
  function initFooter() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const lastOpened = $("#lastOpened");
    const now = Date.now();
    const last = localStorage.getItem(STORAGE.lastOpened);

    if (lastOpened) {
      const display = last ? new Date(Number(last)).toLocaleString("en-GB") : new Date(now).toLocaleString("en-GB");
      lastOpened.textContent = display;
    }
    localStorage.setItem(STORAGE.lastOpened, String(now));
  }

  // -------------------------
  // Init
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
    bindProjectText();

    initTheme();
    initHeaderScrollState();
    initMobileMenu();

    updateHeaderHeightVar();
    window.addEventListener("resize", updateHeaderHeightVar);

    initAnchorFocusHelper();
    initScrollSpy();
    initRevealOnScroll();

    initChallengesUI();
    initCounters();
    initGallery();
    initTestimonials();
    initQuiz();
    initPulsePrompt();
    initFeedbackForm();
    initBackToTop();
    initPlaceholderLinks();
    initFooter();
  });

})();
