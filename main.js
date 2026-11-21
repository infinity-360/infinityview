/* ==========================================================
   INFINITY 360 — scripts principais
   ========================================================== */
(() => {
  "use strict";
  const S = window.SITE || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const waLink = (text) => `https://wa.me/${S.whatsapp || "5544999750719"}?text=${encodeURIComponent(text)}`;

  /* ---------- Google Analytics (opcional) ---------- */
  if (S.googleAnalyticsId) {
    const g = document.createElement("script");
    g.async = true; g.src = `https://www.googletagmanager.com/gtag/js?id=${S.googleAnalyticsId}`;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", S.googleAnalyticsId);
  }
  const track = (name, params) => { try { window.gtag && gtag("event", name, params || {}); } catch (e) {} };

  /* ---------- Instagram (só aparece se configurado) ---------- */
  if (S.instagram) $$("[data-instagram]").forEach(a => { a.href = S.instagram; a.hidden = false; });
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ==========================================================
     INTRO (animação da logo) + pré-carregamento
     ========================================================== */
  const intro = $("#intro");
  const loadBar = $(".intro-load i");
  let introClosed = false;
  const preload = [];
  const addLoad = (p) => { preload.push(p); };

  function finishIntro() {
    if (introClosed) return;
    introClosed = true;
    intro.classList.add("is-out");
    setTimeout(() => {
      intro.classList.add("is-done");
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      pano && pano.zoomIn();
    }, reduced ? 0 : 750);
  }
  $(".intro-skip").addEventListener("click", finishIntro);

  /* ==========================================================
     HEADER, PROGRESSO, MENU
     ========================================================== */
  const header = $(".header");
  const progress = $(".scroll-progress i");
  const burger = $(".burger");
  const menu = $("#menu-mobile");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open")); body.style.overflow = "hidden"; }
    else { menu.classList.remove("is-open"); body.style.overflow = ""; setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 400); }
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") setMenu(false); });

  // link ativo do menu
  const navLinks = $$(".nav a");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["sobre", "servicos", "experiencia", "portfolio", "sites", "processo", "contato"].forEach(id => { const el = document.getElementById(id); el && spy.observe(el); });

  /* ==========================================================
     REVELAR AO ROLAR
     ========================================================== */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = $$(":scope > .reveal", el.parentElement);
      const i = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = Math.min(i * 0.08, 0.5) + "s";
      el.classList.add("is-in");
      revealIO.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal").forEach(el => revealIO.observe(el));

  /* ==========================================================
     HERO — PANORAMA 360° (three.js)
     ========================================================== */
  let pano = null;
  function initPano() {
    const wrap = $("#heroPano");
    const canvas = $("#panoCanvas");
    if (!wrap || !canvas) return null;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false }) || canvas.getContext("experimental-webgl");
    if (!gl) return null;

    // Visualizador 360° próprio (WebGL puro, sem bibliotecas externas)
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision highp float;
      uniform sampler2D t;uniform vec2 r;uniform float yaw,pitch,fov;
      const float PI=3.14159265;
      void main(){
        vec2 uv=(gl_FragCoord.xy/r)*2.-1.;uv.x*=r.x/r.y;
        vec3 d=normalize(vec3(uv.x,uv.y,-1./tan(fov*.5)));
        float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);
        float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy-d.z*sy,d.y,d.x*sy+d.z*cy);
        float u=fract(atan(d.x,-d.z)/(2.*PI)+.5);
        float v=.5-asin(clamp(d.y,-1.,1.))/PI;
        gl_FragColor=texture2D(t,vec2(u,v));
      }`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r"), uYaw = gl.getUniformLocation(prog, "yaw"),
          uPitch = gl.getUniformLocation(prog, "pitch"), uFov = gl.getUniformLocation(prog, "fov");
    let texReady = false;

    const ready = new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texReady = true;
        wrap.classList.add("has-webgl");
        res();
      };
      img.onerror = () => res();
      img.src = "pano-360.jpg";
    });
    addLoad(ready);

    let lon = 200, lat = 0, targetLon = 200, targetLat = 0, fov = 110, targetFov = 110;
    let dragging = false, px = 0, py = 0, pLon = 0, pLat = 0, idle = 0, visible = true, mx = 0, my = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(wrap.clientWidth * dpr);
      canvas.height = Math.round(wrap.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize(); addEventListener("resize", resize);

    wrap.addEventListener("pointerdown", e => {
      dragging = true; px = e.clientX; py = e.clientY; pLon = targetLon; pLat = targetLat;
      if (e.pointerType === "mouse") wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", e => {
      if (!dragging) {
        if (e.pointerType === "mouse") { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }
        return;
      }
      targetLon = pLon - (e.clientX - px) * 0.12;
      if (e.pointerType === "mouse") targetLat = Math.max(-60, Math.min(60, pLat + (e.clientY - py) * 0.12));
      idle = 0;
    });
    const up = () => { dragging = false; };
    wrap.addEventListener("pointerup", up); wrap.addEventListener("pointercancel", up); wrap.addEventListener("pointerleave", up);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(wrap);

    const rad = d => d * Math.PI / 180;
    function tick() {
      requestAnimationFrame(tick);
      if (!visible || !texReady) return;
      idle++;
      if (!dragging && idle > 90 && !reduced) targetLon += 0.035;
      const sy = Math.min(scrollY / innerHeight, 1);
      lon += (targetLon + mx * 8 - lon) * 0.06;
      lat += (targetLat - my * 5 - lat) * 0.06;
      fov += (targetFov + sy * 14 - fov) * 0.05;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uYaw, rad(lon));
      gl.uniform1f(uPitch, rad(Math.max(-85, Math.min(85, lat))));
      gl.uniform1f(uFov, rad(Math.min(fov, 120)));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    tick();
    return { zoomIn() { targetFov = innerWidth < 700 ? 85 : 72; targetLon += 40; } };
  }

  /* ==========================================================
     DRONE — sequência de quadros controlada pela rolagem
     ========================================================== */
  const DRONE_FRAMES = 103;
  const droneSec = $("#drone");
  const dCanvas = $("#droneCanvas");
  const dCtx = dCanvas.getContext("2d");
  // todos os quadros ficam numa única imagem (drone-sprite.webp, 10 colunas de 576x320)
  const SPR_COLS = 10, FW = 576, FH = 320;
  const pad = n => String(n).padStart(3, "0");
  let lastFrame = -1, sprite = null;
  addLoad(new Promise(res => {
    const img = new Image();
    img.onload = () => { sprite = img; if (lastFrame < 0) drawFrame(0); res(); };
    img.onerror = res;
    img.src = "drone-sprite.webp";
  }));
  const loadRest = () => {};

  function drawFrame(i) {
    if (!sprite) return;
    lastFrame = i;
    dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    dCtx.drawImage(sprite, (i % SPR_COLS) * FW, Math.floor(i / SPR_COLS) * FH, FW, FH, 0, 0, dCanvas.width, dCanvas.height);
  }
  const steps = $$(".drone-step");
  const dPct = $("#dronePct");
  const dBar = $(".drone-progress i");
  let activeStep = -1;
  function updateDrone() {
    const r = droneSec.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const fi = Math.min(DRONE_FRAMES - 1, Math.round(Math.min(1, p / 0.85) * (DRONE_FRAMES - 1)));
    if (fi !== lastFrame) drawFrame(fi);
    const s = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    if (s !== activeStep) { steps.forEach((el, k) => el.classList.toggle("is-active", k === s)); activeStep = s; }
    dPct.textContent = pad(Math.round(p * 100));
    dBar.style.transform = `scaleX(${p})`;
  }

  /* ==========================================================
     LAÇO DE ROLAGEM (header, parallax, drone, linha do processo)
     ========================================================== */
  const parallaxEls = reduced ? [] : $$(".parallax");
  const procLine = $(".steps-line i");
  const procSec = $("#processo");
  const stepEls = $$(".step");
  let ticking = false;
  function onScroll() {
    const sy = scrollY;
    header.classList.toggle("is-scrolled", sy > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;

    parallaxEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0,${c * parseFloat(el.dataset.speed || 0)}px,0)`;
    });

    updateDrone();

    if (procSec) {
      const r = procSec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height * 0.7)));
      if (procLine) procLine.style.transform = `scaleX(${p})`;
      stepEls.forEach((el, i) => el.classList.toggle("is-lit", p >= (i + 0.2) / stepEls.length || (innerWidth < 900 && el.getBoundingClientRect().top < innerHeight * 0.7)));
    }
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);

  /* ==========================================================
     MODAL UNIVERSAL
     ========================================================== */
  const modal = $("#modal");
  const mBody = $("#modalBody");
  const mTitle = $("#modalTitle");
  const mKicker = $("#modalKicker");
  const mExt = $("#modalExt");
  const mFs = $("#modalFs");
  let lastFocus = null;

  function openModal({ kicker = "Infinity 360", title = "", html = "", ext = "", fs = false, cls = "" }) {
    lastFocus = document.activeElement;
    modal.className = "modal " + cls;
    mKicker.textContent = kicker;
    mTitle.textContent = title;
    mBody.innerHTML = html;
    mExt.hidden = !ext; if (ext) mExt.href = ext;
    mFs.hidden = !fs;
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    body.style.overflow = "hidden";
    const v = $("video", mBody); if (v) v.play().catch(() => {});
  }
  function closeModal() {
    if (modal.open) modal.close(); else modal.removeAttribute("open");
  }
  modal.addEventListener("close", () => {
    mBody.innerHTML = "";
    body.style.overflow = "";
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  });
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
  mFs.addEventListener("click", () => {
    const f = $("iframe", mBody) || mBody;
    (f.requestFullscreen || f.webkitRequestFullscreen || (() => {})).call(f);
  });

  const iframeHTML = (src, title) =>
    `<div class="modal-loader"><span></span></div><iframe src="${src}" title="${title}" allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer; magnetometer" allowfullscreen loading="eager"></iframe>`;

  function openTour(key) {
    const t = (S.tours || {})[key]; if (!t) return;
    openModal({ kicker: "Tour virtual 360°", title: t.title, html: iframeHTML(t.url, "Tour virtual 360° — " + t.title), ext: t.url, fs: true, cls: "is-media" });
    track("abrir_tour", { tour: key });
  }
  $$("[data-open-tour]").forEach(el => el.addEventListener("click", () => openTour(el.dataset.openTour)));

  /* ---------- seletor de tours (topo do site) ---------- */
  const card = $("[data-tour-card]");
  function setCardTour(key) {
    const t = (S.tours || {})[key]; if (!t || !card) return;
    $$("[data-tour-key]", card).forEach(b => b.setAttribute("aria-selected", b.dataset.tourKey === key));
    $$("[data-tf]", card).forEach(el => {
      const f = el.dataset.tf;
      if (f === "img") el.src = t.img;
      else if (f === "nameUp") el.textContent = t.name.toUpperCase();
      else el.textContent = t[f];
    });
    $("[data-open-tour]", card).dataset.openTour = key;
    const g = $(".tour-card-glass", card); g.classList.remove("is-swap"); void g.offsetWidth; g.classList.add("is-swap");
  }
  if (card) $$("[data-tour-key]", card).forEach(b => b.addEventListener("click", () => setCardTour(b.dataset.tourKey)));

  /* ---------- tour inline na seção Experiência ---------- */
  const stage = $("#tourStage");
  const stageView = $(".tour-stage-view", stage);
  const posterHTML = stageView.innerHTML;
  let stageKey = "faz-bem";
  function loadInline() {
    const t = S.tours[stageKey];
    stageView.innerHTML = `<iframe src="${t.url}" title="Tour virtual 360° — ${t.title}" allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer; magnetometer" allowfullscreen></iframe>`;
    track("tour_inline", { tour: stageKey });
  }
  function bindPoster() { const b = $("[data-load-inline]", stage); if (b) b.addEventListener("click", loadInline); }
  bindPoster();
  $$("[data-stage-switch] [data-tour-key]").forEach(b => b.addEventListener("click", () => {
    stageKey = b.dataset.tourKey;
    $$("[data-stage-switch] [data-tour-key]").forEach(x => x.setAttribute("aria-selected", x === b));
    const t = S.tours[stageKey];
    $("#tsbUrl").textContent = `${t.name} · Tour Virtual 360°`;
    loadInline();
    stage.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }));
  $("[data-tour-fs]", stage).addEventListener("click", () => {
    const f = $("iframe", stageView);
    if (f && (f.requestFullscreen || f.webkitRequestFullscreen)) (f.requestFullscreen || f.webkitRequestFullscreen).call(f);
    else openTour(stageKey);
  });

  /* ==========================================================
     SERVIÇOS — "Saiba mais" + seleção automática no formulário
     ========================================================== */
  const check = '<svg><use href="#i-check"/></svg>';
  $$(".svc-card[data-svc]").forEach(card => {
    const name = card.dataset.svc;
    $(".svc-more-btn", card).addEventListener("click", () => {
      const det = $(".svc-detail", card);
      const img = $(".svc-media > img", card);
      const p = $("p", det).outerHTML;
      const li = $$("li", det).map(l => `<li>${check}<span>${l.textContent}</span></li>`).join("");
      openModal({
        kicker: "Serviço", title: $("h3", card).textContent, cls: "is-svc",
        html: `<div class="m-svc">${img ? `<img class="m-svc-img" src="${img.getAttribute("src")}" alt="">` : ""}${p}<ul>${li}</ul>
          <div class="m-actions"><a href="#contato" class="btn btn-primary" data-service="${name}" data-close>Solicitar orçamento <svg><use href="#i-arrow"/></svg></a>
          <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(`Olá, Infinity 360! Quero saber mais sobre: ${name}.`)}"><svg><use href="#i-wa"/></svg>Falar no WhatsApp</a></div></div>`
      });
      track("saiba_mais", { servico: name });
    });
  });
  const sel = $("#f-servico");
  const setService = v => {
    if (!v || !sel) return;
    const opt = [...sel.options].find(o => o.text === v || o.value === v);
    if (opt) { sel.value = opt.value || opt.text; sel.classList.add("has-value"); sel.closest(".field").classList.remove("is-invalid"); }
  };
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-service]"); if (!a) return;
    setService(a.dataset.service);
    if (a.hasAttribute("data-close")) { e.preventDefault(); closeModal(); setTimeout(() => $("#contato").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 80); }
  });

  /* brilho seguindo o mouse */
  if (finePointer) $$(".svc-card, .diff").forEach(el => el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (e.clientX - r.left) + "px");
    el.style.setProperty("--my", (e.clientY - r.top) + "px");
  }));

  /* botões magnéticos */
  if (finePointer && !reduced) $$(".magnetic").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ==========================================================
     SITES AO VIVO (miniaturas)
     ========================================================== */
  const thumbIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const box = en.target; thumbIO.unobserve(box);
      const f = document.createElement("iframe");
      f.src = box.dataset.src; f.loading = "lazy"; f.tabIndex = -1;
      f.setAttribute("aria-hidden", "true"); f.setAttribute("title", "Pré-visualização do site");
      f.setAttribute("sandbox", "allow-scripts allow-same-origin");
      f.onload = () => box.classList.add("is-loaded");
      box.appendChild(f);
      const scale = () => { f.style.transform = `scale(${box.clientWidth / 1440})`; f.style.height = (box.clientHeight / (box.clientWidth / 1440)) + "px"; };
      scale(); new ResizeObserver(scale).observe(box);
    });
  }, { rootMargin: "300px" });
  $$(".live-thumb").forEach(el => thumbIO.observe(el));

  /* ==========================================================
     PORTFÓLIO — filtros e abertura
     ========================================================== */
  const pfItems = $$(".pf-item");
  $$(".filters button").forEach(btn => btn.addEventListener("click", () => {
    $$(".filters button").forEach(b => b.classList.toggle("is-active", b === btn));
    const f = btn.dataset.filter;
    pfItems.forEach((it, i) => {
      const show = f === "all" || it.dataset.cat.split(" ").includes(f);
      it.classList.toggle("is-hidden", !show);
      if (show) { it.classList.remove("is-entering"); void it.offsetWidth; it.style.animationDelay = (i % 8) * 0.04 + "s"; it.classList.add("is-entering"); }
    });
  }));
  function openItem(it) {
    if (it.dataset.openTour) return; // tratado acima
    const title = it.dataset.title || $("h3", it).textContent;
    if (it.dataset.openSite) {
      openModal({ kicker: "Site no ar", title, html: iframeHTML(it.dataset.openSite, title), ext: it.dataset.openSite, cls: "is-media" });
      track("abrir_site", { site: title });
    } else if (it.dataset.video) {
      openModal({ kicker: "Portfólio", title, html: `<video src="${it.dataset.video}" controls playsinline autoplay></video>`, cls: "is-media" });
    } else if (it.dataset.lightbox) {
      openModal({ kicker: "Imagem 360°", title, html: `<img class="m-img" src="${it.dataset.lightbox}" alt="${title}">`, cls: "is-media" });
    }
  }
  pfItems.forEach(it => {
    it.addEventListener("click", () => openItem(it));
    it.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); it.click(); } });
  });
  $$(".planet[data-lightbox]").forEach(p => {
    p.tabIndex = 0; p.setAttribute("role", "button");
    const go = () => openModal({ kicker: "Imagem 360°", title: p.dataset.caption, html: `<img class="m-img" src="${p.dataset.lightbox}" alt="${p.dataset.caption}">`, cls: "is-media" });
    p.addEventListener("click", go);
    p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  /* ==========================================================
     DESENVOLVIMENTO DE SITES — vitrine ao vivo (computador + celular)
     ========================================================== */
  const wdSec = $("#sites");
  if (wdSec) {
    const wdItems = $$(".wd-item", wdSec);
    const screens = $$(".wd-screen", wdSec);
    let wdStarted = false, current = wdItems[0];
    const fit = (box, f) => {
      const w = +box.dataset.w, k = box.clientWidth / w;
      f.style.width = w + "px";
      f.style.height = (box.clientHeight / k) + "px";
      f.style.transform = `scale(${k})`;
    };
    function loadScreens(url) {
      screens.forEach(box => {
        if (getComputedStyle(box).display === "none" || !box.offsetParent) { box.innerHTML = ""; box.dataset.pending = url; return; }
        box.classList.remove("is-loaded");
        const f = document.createElement("iframe");
        f.src = url; f.title = "Site " + current.dataset.name + (box.dataset.w === "390" ? " no celular" : " no computador");
        if (box.dataset.w !== "390") { f.tabIndex = -1; f.setAttribute("aria-hidden", "true"); }
        f.onload = () => box.classList.add("is-loaded");
        box.replaceChildren(f); fit(box, f);
      });
    }
    function setSite(btn) {
      current = btn;
      wdItems.forEach(b => b.setAttribute("aria-selected", b === btn));
      $("#wdName").textContent = btn.dataset.name;
      $("#wdSeg").textContent = `${btn.dataset.seg} · ${btn.dataset.city}`;
      $("#wdUrl").textContent = btn.dataset.url.replace("https://", "");
      $("#wdExt").href = btn.dataset.url;
      if (wdStarted) loadScreens(btn.dataset.url);
    }
    wdItems.forEach(b => b.addEventListener("click", () => {
      setSite(b);
      if (innerWidth < 900) $("#wdDevices").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      track("ver_site", { site: b.dataset.name });
    }));
    new IntersectionObserver(([en], o) => {
      if (!en.isIntersecting) return;
      wdStarted = true; o.disconnect(); loadScreens(current.dataset.url);
    }, { rootMargin: "400px" }).observe(wdSec);
    new ResizeObserver(() => screens.forEach(box => {
      const f = $("iframe", box);
      if (f) fit(box, f); else if (wdStarted && box.offsetParent) loadScreens(current.dataset.url);
    })).observe(wdSec);
    $("#wdOpen").addEventListener("click", () => {
      const u = current.dataset.url, n = current.dataset.name;
      openModal({ kicker: "Site desenvolvido", title: n, html: iframeHTML(u, n), ext: u, fs: true, cls: "is-media" });
    });
  }

  /* ==========================================================
     VITRINE DE VÍDEOS (celular)
     ========================================================== */
  const sv = $("#showcaseVideo");
  const soundBtn = $(".phone-sound");
  const tabs = $$(".showcase-tabs [role=tab]");
  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.setAttribute("aria-selected", x === t));
    sv.poster = t.dataset.poster; sv.src = t.dataset.video; sv.load(); sv.play().catch(() => {});
  }));
  soundBtn.addEventListener("click", () => {
    sv.muted = !sv.muted;
    soundBtn.setAttribute("aria-pressed", !sv.muted);
    soundBtn.setAttribute("aria-label", sv.muted ? "Ativar som" : "Desativar som");
    $("use", soundBtn).setAttribute("href", sv.muted ? "#i-mute" : "#i-sound");
    if (sv.paused) sv.play().catch(() => {});
  });
  const playIO = new IntersectionObserver(entries => entries.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.25 });
  [sv, $(".cta-video")].forEach(v => v && playIO.observe(v));

  /* ==========================================================
     DEPOIMENTOS
     ========================================================== */
  const deps = window.DEPOIMENTOS || [];
  if (deps.length) {
    const g = $("#tGrid");
    const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    g.innerHTML = deps.map(d => `<figure class="t-card reveal is-in"><blockquote>“${esc(d.texto)}”</blockquote><footer>${d.foto ? `<img src="${esc(d.foto)}" alt="" loading="lazy">` : ""}<div><strong>${esc(d.nome)}</strong><small>${esc([d.empresa, d.servico].filter(Boolean).join(" · "))}</small></div></footer></figure>`).join("");
    g.hidden = false; $("#tEmpty").hidden = true;
  }

  /* ==========================================================
     FORMULÁRIO → WHATSAPP
     ========================================================== */
  const form = $("#leadForm");
  const fWa = $("#f-wa");
  fWa.addEventListener("input", () => {
    let d = fWa.value.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    fWa.value = out;
  });
  sel.addEventListener("change", () => sel.classList.toggle("has-value", !!sel.value));
  $$("input, select, textarea", form).forEach(el => el.addEventListener("input", () => {
    el.closest(".field") && el.closest(".field").classList.remove("is-invalid");
    if (el.type === "checkbox") el.closest(".consent").classList.remove("is-invalid");
  }));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = id => $(id).value.trim();
    const errs = [];
    const mark = (id, ok) => { $(id).closest(".field").classList.toggle("is-invalid", !ok); if (!ok) errs.push(id); };
    mark("#f-nome", v("#f-nome").length >= 2);
    mark("#f-wa", v("#f-wa").replace(/\D/g, "").length >= 10);
    mark("#f-email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("#f-email")));
    mark("#f-servico", !!sel.value);
    mark("#f-msg", v("#f-msg").length >= 5);
    const ok = $("#f-ok").checked;
    $(".consent").classList.toggle("is-invalid", !ok);
    if (!ok) errs.push("#f-ok");
    if (errs.length) { $(errs[0]).focus(); return; }

    const msg =
`Olá, Infinity 360! Gostaria de solicitar um orçamento.

*Nome:* ${v("#f-nome")}
*WhatsApp:* ${v("#f-wa")}
*E-mail:* ${v("#f-email")}
*Serviço desejado:* ${sel.value}

*Necessidade:*
${v("#f-msg")}

_Enviado pelo site infinityview360.com.br_`;
    track("generate_lead", { servico: sel.value });
    const url = waLink(msg);
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
    const btn = $("button[type=submit]", form);
    const old = btn.innerHTML;
    btn.innerHTML = '<svg><use href="#i-check"/></svg>Abrindo o WhatsApp…';
    setTimeout(() => { btn.innerHTML = old; }, 3500);
  });

  /* ==========================================================
     INÍCIO
     ========================================================== */
  function start() {
    pano = initPano();
    onScroll();
    const t0 = performance.now();
    const minTime = reduced ? 0 : 3300;
    let done = 0;
    const total = preload.length || 1;
    preload.forEach(p => p.then(() => { done++; loadBar.style.width = (done / total * 100) + "%"; }));
    const all = Promise.race([Promise.all(preload), new Promise(r => setTimeout(r, 6000))]);
    all.then(() => {
      loadBar.style.width = "100%";
      setTimeout(finishIntro, Math.max(0, minTime - (performance.now() - t0)));
      loadRest();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
