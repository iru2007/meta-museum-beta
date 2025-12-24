/* ============================================================
   META MUSEUM — BETA
   Frontend only • GitHub Pages friendly
   - Dati fittizi in JSON
   - Algoritmo valore trasparente e robusto (no NaN)
   - localStorage per persistenza demo
   - Effetti WOW: particles, parallax, tilt, reveal
============================================================ */

/* ----------------------------
   0) Utility “sicure”
---------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}
function fmtInt(n) { return new Intl.NumberFormat("it-IT").format(safeNum(n, 0)); }
function fmt2(n) { return safeNum(n, 0).toFixed(2); }

/* Toast (messaggio veloce) */
let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 1700);
}

/* Scroll morbido */
function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ----------------------------
   1) Config: valuta + coeff
---------------------------- */
const CURRENCY = { name: "MuseCredits", code: "MCR", symbol: "MCR" };

// Coefficienti semplici e leggibili (puoi cambiarli facilmente)
const COEFF = {
  base: 10,
  like: 0.20,
  view: 0.05,
  offer: 1.20,
};

/* Formula ufficiale usata nella demo:
   valore_attuale = base + like*coeffLike + views*coeffView + offers*coeffOfferte
*/
function computeValue(art) {
  const base = safeNum(art.baseValue, COEFF.base);
  const likes = safeNum(art.likes, 0);
  const views = safeNum(art.views, 0);
  const offers = safeNum(art.offers, 0);

  const v = base + (likes * COEFF.like) + (views * COEFF.view) + (offers * COEFF.offer);

  // robustezza: clamp minimo, evita negativi o NaN
  return clamp(safeNum(v, base), 0, 999999);
}

/* ----------------------------
   2) Dataset fittizio
   (immagini da URL pubblici)
---------------------------- */
const seedArtworks = [
  {
    id: "mm-001",
    title: "Busto Femminile",
    artist: "A. Rinaldi",
    category: "concept",
    desc: "Studio digitale su forma classica e valore percepito: l’interazione trasforma la quotazione.",
    img: "https://images.unsplash.com/photo-1549899599-90debbbf6c51?auto=format&fit=crop&w=1400&q=80",
    baseValue: 12,
    likes: 18,
    views: 120,
    offers: 2,
    history: [12.1, 12.3, 12.6, 12.9, 13.2, 13.1, 13.4],
  },
  {
    id: "mm-002",
    title: "Neon Corridor",
    artist: "K. Nova",
    category: "3d",
    desc: "Una galleria impossibile: prospettive e profondità. Perfetta per un museo digitale immersivo.",
    img: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=80",
    baseValue: 10,
    likes: 44,
    views: 320,
    offers: 4,
    history: [10.2, 10.6, 10.9, 11.4, 11.9, 12.1, 12.6],
  },
  {
    id: "mm-003",
    title: "Aurora Protocol",
    artist: "M. Ishikawa",
    category: "ai",
    desc: "Pattern generativi e micro-dettagli: un’opera che sembra viva, reattiva al pubblico.",
    img: "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80",
    baseValue: 11,
    likes: 26,
    views: 210,
    offers: 1,
    history: [11.0, 11.2, 11.4, 11.5, 11.7, 11.6, 11.8],
  },
  {
    id: "mm-004",
    title: "Blue Silence",
    artist: "L. Verdi",
    category: "photography",
    desc: "Fotografia digitale: luce e grana. L’attenzione del pubblico guida il valore.",
    img: "https://images.unsplash.com/photo-1520975958225-1c4a5f613a0a?auto=format&fit=crop&w=1400&q=80",
    baseValue: 9,
    likes: 62,
    views: 520,
    offers: 6,
    history: [9.1, 9.6, 10.0, 10.5, 11.1, 11.5, 12.2],
  },
  {
    id: "mm-005",
    title: "Signal Bloom",
    artist: "S. Conti",
    category: "ai",
    desc: "Un fiore di segnali: estetica cyber e pulizia geometrica. Il trend cambia con la domanda.",
    img: "https://images.unsplash.com/photo-1520975910891-98cc3e3f6ec9?auto=format&fit=crop&w=1400&q=80",
    baseValue: 10,
    likes: 9,
    views: 90,
    offers: 0,
    history: [10.0, 10.1, 10.2, 10.2, 10.3, 10.35, 10.4],
  },
  {
    id: "mm-006",
    title: "Museum Light",
    artist: "E. Serra",
    category: "photography",
    desc: "Spazio bianco, opere sospese: una citazione del museo fisico traslata nel digitale.",
    img: "https://images.unsplash.com/photo-1526142684086-7ebd69df27a5?auto=format&fit=crop&w=1400&q=80",
    baseValue: 10,
    likes: 21,
    views: 160,
    offers: 1,
    history: [10.0, 10.2, 10.3, 10.5, 10.6, 10.7, 10.85],
  },
];

/* ----------------------------
   3) Stato + localStorage
---------------------------- */
const LS_KEYS = {
  artworks: "mm_beta_artworks_v1",
  user: "mm_beta_user_v1",
  history: "mm_beta_history_v1",
};

function loadLS(key, fallback) {
  try{
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}
function saveLS(key, value) {
  try{
    localStorage.setItem(key, JSON.stringify(value));
  }catch(e){
    // se localStorage non disponibile, la demo funziona comunque (solo senza persistenza)
  }
}

function makeDefaultUser(){
  return {
    username: null,
    balance: 250,              // saldo demo iniziale
    followed: [],              // ids opere “seguite” (non usato in UI, ma pronto)
    likesTotal: 0,
    offersTotal: 0,
  };
}

let artworks = loadLS(LS_KEYS.artworks, null);
if (!Array.isArray(artworks) || artworks.length === 0) {
  artworks = seedArtworks.map(a => normalizeArtwork(a));
  saveLS(LS_KEYS.artworks, artworks);
} else {
  artworks = artworks.map(a => normalizeArtwork(a));
}

let user = loadLS(LS_KEYS.user, null);
if (!user || typeof user !== "object") {
  user = makeDefaultUser();
  saveLS(LS_KEYS.user, user);
} else {
  user = { ...makeDefaultUser(), ...user };
}

let history = loadLS(LS_KEYS.history, []);
if (!Array.isArray(history)) history = [];

function normalizeArtwork(a){
  const art = { ...a };
  art.baseValue = safeNum(art.baseValue, COEFF.base);
  art.likes = safeNum(art.likes, 0);
  art.views = safeNum(art.views, 0);
  art.offers = safeNum(art.offers, 0);
  art.history = Array.isArray(art.history) ? art.history.map(x => safeNum(x, art.baseValue)) : [];
  if (art.history.length < 6) art.history = (art.history.length ? art.history : [art.baseValue]);
  // salva anche valore corrente in modo consistente
  art.value = computeValue(art);
  return art;
}

function pushHistory(art, newValue){
  const v = safeNum(newValue, computeValue(art));
  art.history.push(v);
  // limita lunghezza (performance + grafico)
  if (art.history.length > 32) art.history = art.history.slice(-32);
}

/* ----------------------------
   4) Rendering UI
---------------------------- */
const grid = $("#artGrid");
const marketList = $("#marketList");

let currentFilter = "all";
let currentMarketSort = "popular";
let searchQuery = "";

function renderAll(){
  $("#currencyLabel").textContent = `${CURRENCY.name} (${CURRENCY.code})`;

  // metriche hero (mock credibili)
  $("#metricArtworks").textContent = fmtInt(artworks.length);
  const vol = artworks.reduce((s,a)=> s + safeNum(a.offers,0)*10, 0);
  $("#metricVolume").textContent = fmtInt(vol);
  $("#metricUsers").textContent = fmtInt(128 + (history.length % 90)); // mock

  renderGallery();
  renderMarket();
  renderProfile();
}

function matchesFilter(art){
  if (currentFilter === "all") return true;
  return art.category === currentFilter;
}

function matchesSearch(art){
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return art.title.toLowerCase().includes(q) || art.artist.toLowerCase().includes(q);
}

function renderGallery(){
  const items = artworks
    .filter(matchesFilter)
    .filter(matchesSearch);

  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<div class="badge" style="grid-column:1/-1; justify-self:start;">
      Nessun risultato per la ricerca.
    </div>`;
    return;
  }

  for (const art of items){
    // rendering valore sempre calcolato “da formula”
    art.value = computeValue(art);

    const card = document.createElement("article");
    card.className = "card reveal";
    card.dataset.id = art.id;

    card.innerHTML = `
      <div class="card__media">
        <img src="${art.img}" alt="${escapeHtml(art.title)}" loading="lazy" />
        <div class="card__frame"></div>
      </div>

      <div class="card__body">
        <h3 class="card__title">${escapeHtml(art.title)}</h3>
        <div class="card__artist">${escapeHtml(art.artist)}</div>

        <div class="card__meta">
          <div class="kpi">
            <div class="kpi__label">Valore</div>
            <div class="kpi__value">${fmt2(art.value)} ${CURRENCY.code}</div>
          </div>
          <div class="kpi">
            <div class="kpi__label">Interazioni</div>
            <div class="kpi__value">♥ ${fmtInt(art.likes)} • ◉ ${fmtInt(art.views)}</div>
          </div>
        </div>
      </div>

      <div class="card__foot">
        ${sparklineSVG(art.history)}
        <div class="card__actions">
          <button class="iconbtn" data-action="view" title="Osserva">⟡</button>
          <button class="iconbtn" data-action="like" title="Metti like">♥</button>
          <button class="iconbtn" data-action="offer" title="Fai offerta">⇡</button>
        </div>
      </div>
    `;

    grid.appendChild(card);

    // reveal animation
    requestAnimationFrame(()=> card.classList.add("is-in"));
  }

  enableCardTilt();
}

function renderMarket(){
  const list = artworks.map(a => {
    const value = computeValue(a);
    const first = safeNum(a.history?.[0], value);
    const last = safeNum(a.history?.[a.history.length-1], value);
    const delta = last - first;

    // popolarità: mix semplice (like + offers*2 + views/50)
    const popularity = safeNum(a.likes,0) + safeNum(a.offers,0)*2 + safeNum(a.views,0)/50;

    return { ...a, value, delta, popularity };
  });

  let sorted = list.slice();

  if (currentMarketSort === "popular"){
    sorted.sort((a,b)=> b.popularity - a.popularity);
  } else if (currentMarketSort === "growth"){
    sorted.sort((a,b)=> b.delta - a.delta);
  } else if (currentMarketSort === "views"){
    sorted.sort((a,b)=> safeNum(b.views,0) - safeNum(a.views,0));
  }

  marketList.innerHTML = "";

  for (const art of sorted){
    const up = art.delta >= 0;
    const trendClass = up ? "trend trend--up" : "trend trend--down";
    const arrow = up ? "↑" : "↓";

    const row = document.createElement("div");
    row.className = "row reveal";
    row.dataset.id = art.id;

    row.innerHTML = `
      <div class="row__main">
        <img class="thumb" src="${art.img}" alt="" loading="lazy" />
        <div>
          <div class="row__title">${escapeHtml(art.title)}</div>
          <div class="row__sub">${escapeHtml(art.artist)} • ${escapeHtml(art.category.toUpperCase())}</div>
        </div>
      </div>

      <div class="badge">${fmt2(art.value)} ${CURRENCY.code}</div>

      <div class="${trendClass}">
        <span>${arrow}</span>
        <span>${fmt2(Math.abs(art.delta))}</span>
      </div>

      <button class="btn btn--ghost" data-open="1">
        Apri
        <span class="btn__glow"></span>
      </button>
    `;

    marketList.appendChild(row);
    requestAnimationFrame(()=> row.classList.add("is-in"));
  }
}

function renderProfile(){
  const name = user.username ? user.username : "Ospite";
  $("#profileName").textContent = name;
  $("#loginLabel").textContent = user.username ? name : "Login";

  $("#profileBalance").textContent = `${fmt2(user.balance)} ${CURRENCY.code}`;
  $("#profileLikes").textContent = fmtInt(user.likesTotal);
  $("#profileOffers").textContent = fmtInt(user.offersTotal);

  // storia (ultimi 12)
  const box = $("#historyList");
  box.innerHTML = "";
  const last = history.slice(-12).reverse();

  if (last.length === 0){
    box.innerHTML = `<div class="badge">Nessuna interazione ancora. Apri un’opera e prova Like / Offerta.</div>`;
    return;
  }

  for (const h of last){
    const el = document.createElement("div");
    el.className = "hitem";
    el.innerHTML = `
      <div>
        <div><b>${escapeHtml(h.action)}</b> — ${escapeHtml(h.title)}</div>
        <div class="hitem__meta">${escapeHtml(h.when)}</div>
      </div>
      <div class="badge">${escapeHtml(h.badge)}</div>
    `;
    box.appendChild(el);
  }
}

/* Sparkline (leggerissimo, niente librerie) */
function sparklineSVG(values){
  const w = 120, h = 28, pad = 2;
  const arr = (Array.isArray(values) ? values : []).map(v => safeNum(v, 0));
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = Math.max(0.0001, max - min);

  const pts = arr.map((v, i) => {
    const x = pad + (i * (w - pad*2)) / Math.max(1, (arr.length - 1));
    const y = pad + (1 - ((v - min) / range)) * (h - pad*2);
    return [x, y];
  });

  const d = pts.map((p,i)=> (i===0 ? `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(" ");
  return `
    <svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" fill="none" stroke="rgba(34,211,238,0.85)" stroke-width="2" />
      <path d="${d}" fill="none" stroke="rgba(124,58,237,0.45)" stroke-width="5" opacity="0.25" />
    </svg>
  `;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ----------------------------
   5) Interazioni: view/like/offer
---------------------------- */
function logHistory(action, art, badge){
  const when = new Date().toLocaleString("it-IT", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
  history.push({ action, title: art.title, when, badge });
  if (history.length > 80) history = history.slice(-80);
  saveLS(LS_KEYS.history, history);
}

function updateArtwork(art){
  art.value = computeValue(art);
  pushHistory(art, art.value);
  saveLS(LS_KEYS.artworks, artworks);
}

function ensureLogged(){
  if (user.username) return true;
  openModal($("#loginModal"));
  toast("Fai login demo per interagire.");
  return false;
}

/* ----------------------------
   6) Modale opera + grafico
---------------------------- */
const artModal = $("#artModal");
const loginModal = $("#loginModal");
let currentArtId = null;
let chart = null;

function openArtModal(id){
  const art = artworks.find(a => a.id === id);
  if (!art) return;

  // ogni apertura = visualizzazione (incremento)
  art.views = safeNum(art.views, 0) + 1;
  updateArtwork(art);
  logHistory("Osservata", art, `+1 view`);
  renderProfile();

  // riempi UI
  currentArtId = id;
  $("#modalImg").src = art.img;
  $("#modalImg").alt = art.title;
  $("#modalTitle").textContent = art.title;
  $("#modalArtist").textContent = `di ${art.artist}`;
  $("#modalDesc").textContent = art.desc;
  $("#modalCategory").textContent = art.category.toUpperCase();

  syncModalStats(art);
  $("#modalFormula").textContent =
    `valore = ${COEFF.base} + like*${COEFF.like} + views*${COEFF.view} + offers*${COEFF.offer}`;

  // grafico (Chart.js) - distruggi e ricrea per evitare bug
  const ctx = $("#modalChart");
  if (chart) { chart.destroy(); chart = null; }

  const labels = art.history.map((_, i) => i + 1);
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Valore (${CURRENCY.code})`,
        data: art.history.map(v => safeNum(v, art.value)),
        tension: 0.32,
        borderWidth: 2,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          ticks: { color: "rgba(240,244,255,0.65)" },
          grid: { color: "rgba(140,160,255,0.10)" }
        }
      }
    }
  });

  // chiudi offerbox se aperto
  $("#offerBox").hidden = true;

  openModal(artModal);
  renderGallery();
  renderMarket();
}

function syncModalStats(art){
  $("#modalValue").textContent = `${fmt2(art.value)} ${CURRENCY.code}`;
  $("#modalLikes").textContent = fmtInt(art.likes);
  $("#modalViews").textContent = fmtInt(art.views);
  $("#modalOffers").textContent = fmtInt(art.offers);
}

function openModal(modalEl){
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modalEl){
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ----------------------------
   7) Event listeners
---------------------------- */

// Nav scroll
$$("[data-scroll]").forEach(btn => {
  btn.addEventListener("click", () => scrollToId(btn.dataset.scroll));
});

// Button glow follows mouse
$$(".btn").forEach(btn => {
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    btn.style.setProperty("--mx", `${mx}%`);
    btn.style.setProperty("--my", `${my}%`);
  });
});

// Gallery filter
$$(".section--gallery .segmented__btn").forEach(b => {
  b.addEventListener("click", () => {
    $$(".section--gallery .segmented__btn").forEach(x => x.classList.remove("is-active"));
    b.classList.add("is-active");
    currentFilter = b.dataset.filter;
    renderGallery();
  });
});

// Search
$("#searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderGallery();
});

// Market sort
$$(".market .segmented__btn").forEach(b => {
  b.addEventListener("click", () => {
    $$(".market .segmented__btn").forEach(x => x.classList.remove("is-active"));
    b.classList.add("is-active");
    currentMarketSort = b.dataset.market;
    renderMarket();
  });
});

// Login button
$("#btnLogin").addEventListener("click", () => openModal(loginModal));

// Login confirm
$("#loginConfirm").addEventListener("click", () => {
  const v = $("#loginInput").value.trim();
  if (v.length < 2){
    toast("Inserisci almeno 2 caratteri.");
    return;
  }
  user.username = v;
  saveLS(LS_KEYS.user, user);
  closeModal(loginModal);
  toast(`Benvenuto, ${v}.`);
  renderProfile();
});

// Reset demo
$("#btnReset").addEventListener("click", () => {
  if (!confirm("Reset demo? Cancellerà dati salvati nel browser.")) return;
  localStorage.removeItem(LS_KEYS.artworks);
  localStorage.removeItem(LS_KEYS.user);
  localStorage.removeItem(LS_KEYS.history);
  location.reload();
});

// Click su card / azioni
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;

  const actBtn = e.target.closest("[data-action]");
  if (!actBtn){
    openArtModal(id);
    return;
  }

  const action = actBtn.dataset.action;

  if (action === "view"){
    openArtModal(id);
    return;
  }

  if (action === "like"){
    if (!ensureLogged()) return;
    const art = artworks.find(a => a.id === id);
    if (!art) return;

    art.likes = safeNum(art.likes, 0) + 1;
    user.likesTotal = safeNum(user.likesTotal, 0) + 1;

    updateArtwork(art);
    saveLS(LS_KEYS.user, user);

    logHistory("Like", art, `+1 like`);
    toast("Like registrato.");
    renderAll();
    return;
  }

  if (action === "offer"){
    openArtModal(id);
    $("#modalOfferBtn").click();
  }
});

// Click su riga mercato
marketList.addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  const id = row.dataset.id;
  openArtModal(id);
});

// Close modal by backdrop / close buttons
$$(".modal").forEach(modal => {
  modal.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close]");
    if (close) closeModal(modal);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape"){
    if (artModal.classList.contains("is-open")) closeModal(artModal);
    if (loginModal.classList.contains("is-open")) closeModal(loginModal);
  }
});

// Modal actions
$("#modalLikeBtn").addEventListener("click", () => {
  if (!ensureLogged()) return;
  const art = artworks.find(a => a.id === currentArtId);
  if (!art) return;

  art.likes = safeNum(art.likes, 0) + 1;
  user.likesTotal = safeNum(user.likesTotal, 0) + 1;

  updateArtwork(art);
  saveLS(LS_KEYS.user, user);
  logHistory("Like", art, `+1 like`);

  toast("Like registrato.");
  syncModalStats(art);
  renderAll();
});

$("#modalOfferBtn").addEventListener("click", () => {
  if (!ensureLogged()) return;
  const art = artworks.find(a => a.id === currentArtId);
  if (!art) return;

  // mostra pannello offerta con range dinamico
  const box = $("#offerBox");
  box.hidden = false;

  const range = $("#offerRange");
  const suggestedMax = clamp(Math.round(art.value / 2), 12, 120);
  range.min = 1;
  range.max = suggestedMax;
  range.value = clamp(10, 1, suggestedMax);

  $("#offerValueLabel").textContent = `${range.value} ${CURRENCY.code}`;
});

$("#offerRange").addEventListener("input", (e) => {
  $("#offerValueLabel").textContent = `${e.target.value} ${CURRENCY.code}`;
});

$("#offerCancel").addEventListener("click", () => {
  $("#offerBox").hidden = true;
});

$("#offerConfirm").addEventListener("click", () => {
  const art = artworks.find(a => a.id === currentArtId);
  if (!art) return;

  const amount = safeNum($("#offerRange").value, 0);
  if (amount <= 0){
    toast("Importo non valido.");
    return;
  }

  // “realismo” in demo: saldo scalato.
  if (safeNum(user.balance, 0) < amount){
    toast("Saldo insufficiente (demo).");
    return;
  }

  user.balance = safeNum(user.balance, 0) - amount;
  user.offersTotal = safeNum(user.offersTotal, 0) + 1;

  // in questa demo, un’offerta incrementa “offers” di 1 (domanda),
  // e dà uno “shock” di trend perché il valore sale più nettamente.
  art.offers = safeNum(art.offers, 0) + 1;

  updateArtwork(art);
  saveLS(LS_KEYS.user, user);
  logHistory("Offerta simulata", art, `-${amount} ${CURRENCY.code}`);

  $("#offerBox").hidden = true;
  toast("Offerta registrata.");

  syncModalStats(art);
  renderAll();
});

$("#modalShareBtn").addEventListener("click", async () => {
  const art = artworks.find(a => a.id === currentArtId);
  if (!art) return;

  const text = `Meta Museum — ${art.title} (${fmt2(art.value)} ${CURRENCY.code})`;
  try{
    if (navigator.share){
      await navigator.share({ title: "Meta Museum", text });
      toast("Condiviso.");
    } else {
      await navigator.clipboard.writeText(text);
      toast("Copiato negli appunti.");
    }
  }catch(e){
    toast("Condivisione non disponibile.");
  }
});

/* ----------------------------
   8) WOW: Card tilt + parallax scroll
---------------------------- */

// Tilt solo desktop (mouse)
function enableCardTilt(){
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  if (isCoarse) return;

  $$(".card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      // rotazioni leggere (effetto museo)
      const rotY = (px - 0.5) * 10;  // -5..+5
      const rotX = (0.5 - py) * 8;   // -4..+4

      card.style.setProperty("--mx", `${px*100}%`);
      card.style.setProperty("--my", `${py*100}%`);
      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-1px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

// Parallax ambient “leggero” (mobile: scroll)
let raf = null;
window.addEventListener("scroll", () => {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = null;
    const y = window.scrollY || 0;
    const gA = document.querySelector(".ambient__glow--a");
    const gB = document.querySelector(".ambient__glow--b");
    if (gA) gA.style.transform = `translate3d(0, ${y*0.06}px, 0)`;
    if (gB) gB.style.transform = `translate3d(0, ${y*0.04}px, 0)`;
  });
}, { passive:true });

/* ----------------------------
   9) Reveal on scroll
---------------------------- */
const io = new IntersectionObserver((entries)=>{
  for (const en of entries){
    if (en.isIntersecting){
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  }
},{ threshold: 0.12 });

function observeReveals(){
  $$(".reveal").forEach(el => io.observe(el));
}

/* ----------------------------
   10) Particles hero (canvas)
   Leggero e fluido
---------------------------- */
function initHeroCanvas(){
  const c = $("#heroCanvas");
  const ctx = c.getContext("2d");
  let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

  const particles = [];
  const COUNT = 70;

  function resize(){
    w = c.clientWidth; h = c.clientHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function make(){
    particles.length = 0;
    for (let i=0; i<COUNT; i++){
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random()*2-1) * 0.22,
        vy: (Math.random()*2-1) * 0.18,
        r: 1 + Math.random()*2.2,
        t: Math.random()*Math.PI*2
      });
    }
  }

  let mx = w/2, my = h/2;
  window.addEventListener("mousemove", (e)=>{
    mx = e.clientX;
    my = e.clientY;
  }, { passive:true });

  function draw(){
    // background gradient “cinematografico”
    ctx.clearRect(0,0,w,h);

    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "rgba(124,58,237,0.12)");
    g.addColorStop(0.45, "rgba(34,211,238,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // particles
    for (const p of particles){
      p.t += 0.01;
      p.x += p.vx;
      p.y += p.vy;

      // leggera attrazione verso mouse per “parallax”
      const dx = (mx - p.x) * 0.00025;
      const dy = (my - p.y) * 0.00025;
      p.x += dx; p.y += dy;

      if (p.x < -20) p.x = w+20;
      if (p.x > w+20) p.x = -20;
      if (p.y < -20) p.y = h+20;
      if (p.y > h+20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = "rgba(240,244,255,0.12)";
      ctx.fill();
    }

    // lines (connessioni leggere)
    for (let i=0; i<particles.length; i++){
      for (let j=i+1; j<particles.length; j++){
        const a = particles[i], b = particles[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.hypot(dx,dy);
        if (dist < 120){
          const alpha = (1 - dist/120) * 0.08;
          ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  make();
  draw();
  window.addEventListener("resize", () => {
    resize();
    make();
  });
}

/* ----------------------------
   11) Start
---------------------------- */
function boot(){
  initHeroCanvas();

  // inizializza reveal observer
  observeReveals();

  // inizializza UI
  renderAll();
}
boot();
