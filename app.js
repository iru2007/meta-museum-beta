/* =========================================================
   META MUSEUM — BETA (NO BACKEND)
   - Dati fittizi in JS
   - Stato + localStorage
   - Algoritmo trasparente valore dinamico
   - Modal + Chart.js + sparklines
   - Animazioni: GSAP + ScrollTrigger
   ========================================================= */

/** Nome moneta interna (virtuale) */
const CURRENCY_NAME = "MuseCredits";
const CURRENCY_SYMBOL = "MΞ";

/** localStorage key */
const LS_KEY = "meta_museum_beta_v1";

/* ---------------------------------------------------------
   1) DATASET FINTIZIO (aggiungere opere = aggiungere oggetti qui)
   --------------------------------------------------------- */
const DEFAULT_DATA = {
  user: {
    username: null,
    balance: 0,
    followed: [], // array di artworkId
    likes: {},    // artworkId -> true
    activity: []  // log azioni
  },
  artworks: [
    {
      id: "mm-001",
      title: "Busto Femminile // Index",
      artist: "A. Neri",
      img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=1400&q=80",
      desc: "Scultura classica re-immaginata come asset digitale. Ogni interazione sposta il prezzo come in una micro-borsa.",
      base: 10,
      likes: 124,
      views: 6800,
      offers: [14, 22, 18, 30],
      history: [10, 11.2, 12.1, 11.9, 12.45, 12.68, 12.45]
    },
    {
      id: "mm-002",
      title: "Neon Corridor",
      artist: "Luna Shard",
      img: "https://images.unsplash.com/photo-1520975682031-a0a350c0ce4c?auto=format&fit=crop&w=1400&q=80",
      desc: "Spazio architetturale sintetico: luce e profondità. Il valore cresce con l’interesse di mercato simulato.",
      base: 10,
      likes: 88,
      views: 3900,
      offers: [9, 12, 16],
      history: [10, 10.6, 10.9, 11.1, 11.45, 11.62]
    },
    {
      id: "mm-003",
      title: "Algorithmic Bloom",
      artist: "K. Yapa (demo)",
      img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1400&q=80",
      desc: "Pattern generativo ispirato a dati di mercato: una fioritura che reagisce al comportamento degli utenti.",
      base: 10,
      likes: 156,
      views: 9100,
      offers: [20, 26, 33, 17, 24],
      history: [10, 11.0, 11.6, 12.4, 13.2, 13.9, 14.4]
    },
    {
      id: "mm-004",
      title: "Blue Signal (NFT-less)",
      artist: "M. Riva",
      img: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=1400&q=80",
      desc: "Arte digitale senza hype crypto: reputazione e domanda definiscono la traiettoria del valore.",
      base: 10,
      likes: 62,
      views: 2500,
      offers: [8, 10],
      history: [10, 10.2, 10.3, 10.55, 10.7]
    },
    {
      id: "mm-005",
      title: "Quantum Portrait",
      artist: "E. Satori",
      img: "https://images.unsplash.com/photo-1520975958225-7f61a1b8b1b8?auto=format&fit=crop&w=1400&q=80",
      desc: "Ritratto digitale: identità come variabile di mercato. Il valore segue le interazioni (simulazione).",
      base: 10,
      likes: 44,
      views: 1200,
      offers: [6, 7, 11],
      history: [10, 10.15, 10.28, 10.44, 10.62]
    },
    {
      id: "mm-006",
      title: "Black Gallery / Void",
      artist: "Studio Meta",
      img: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80",
      desc: "Ambiente museale immersivo: la sala stessa è un’opera. Trend e crescita sono guidati da domanda simulata.",
      base: 10,
      likes: 112,
      views: 5400,
      offers: [12, 18, 19],
      history: [10, 10.9, 11.2, 11.75, 12.0, 12.12]
    }
  ]
};

/* ---------------------------------------------------------
   2) STATE + PERSISTENZA
   --------------------------------------------------------- */
let state = loadState();
let currentArtworkId = null;

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);

    // Merge soft: se aggiorni DEFAULT_DATA in futuro, non rompi la demo
    return {
      user: { ...DEFAULT_DATA.user, ...(parsed.user || {}) },
      artworks: Array.isArray(parsed.artworks) ? parsed.artworks : structuredClone(DEFAULT_DATA.artworks)
    };
  }catch(e){
    console.warn("Errore loadState, resetto demo:", e);
    return structuredClone(DEFAULT_DATA);
  }
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* ---------------------------------------------------------
   3) ALGORITMO VALORE DINAMICO (trasparente e commentato)
   ---------------------------------------------------------
   Obiettivo: simulare un prezzo che reagisce a:
   - like: aumento piccolo
   - views: aumento micro
   - offerte: aumento più forte (domanda)
*/
function computeOfferImpact(offers){
  // "Domanda" simulata: offerta più alta pesa di più, ma senza esplodere
  // Usiamo una radice per comprimere valori grandi (effetto realistico).
  // Esempio: 25 MΞ -> sqrt(25)=5 -> impatto = 5*0.9 = 4.5
  let sum = 0;
  for(const v of offers){
    sum += Math.sqrt(Math.max(0, v)) * 0.9;
  }
  return sum;
}

function computeValue(art){
  const offerImpact = computeOfferImpact(art.offers);
  const value = art.base + art.likes * 0.45 + art.views * 0.02 + offerImpact;
  // Arrotondamento "da mercato" (2 decimali)
  return Math.round(value * 100) / 100;
}

function computeTrend(art){
  // Trend = differenza tra ultimo e penultimo valore nello storico
  const h = art.history || [];
  if(h.length < 2) return 0;
  return Math.round((h[h.length - 1] - h[h.length - 2]) * 100) / 100;
}

function pushHistory(art){
  // Ogni azione aggiorna lo storico con il nuovo valore
  const v = computeValue(art);
  if(!Array.isArray(art.history)) art.history = [];
  art.history.push(v);

  // Limite: teniamo max 18 punti per grafici/sparklines snelli
  if(art.history.length > 18) art.history = art.history.slice(-18);
}

/* ---------------------------------------------------------
   4) HELPERS UI
   --------------------------------------------------------- */
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

function fmt(n){
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(n);
}
function money(n){
  return `${fmt(n)} ${CURRENCY_SYMBOL}`;
}
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2100);
}
function scrollToId(id){
  document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
}
function nowTag(){
  const d = new Date();
  return d.toLocaleString("it-IT", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}

function requireLogin(){
  if(state.user.username) return true;
  toast("Fai login per continuare (demo).");
  scrollToId("profile");
  return false;
}

function addActivity(type, detail){
  if(!state.user.username) return;
  state.user.activity.unshift({
    at: nowTag(),
    type,
    detail
  });
  // limite log
  state.user.activity = state.user.activity.slice(0, 20);
}

/* ---------------------------------------------------------
   5) RENDER: HERO STATS
   --------------------------------------------------------- */
function renderHeroStats(){
  $("#statArtworks").textContent = state.artworks.length;

  let volume = 0;
  let interactions = 0;
  for(const a of state.artworks){
    volume += computeValue(a);
    interactions += a.likes + a.views + a.offers.length;
  }
  $("#statVolume").textContent = fmt(volume);
  $("#statInteractions").textContent = fmt(interactions);

  // mini live widget in hero
  $("#heroLiveValue").textContent = money(computeValue(state.artworks[0]));
}

/* ---------------------------------------------------------
   6) RENDER: GALLERY
   --------------------------------------------------------- */
function getGalleryList(){
  const q = ($("#searchInput").value || "").trim().toLowerCase();
  const sort = $("#sortSelect").value;

  let list = state.artworks.slice();

  // search
  if(q){
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q)
    );
  }

  // sort
  if(sort === "value_desc"){
    list.sort((a,b) => computeValue(b) - computeValue(a));
  }else if(sort === "likes_desc"){
    list.sort((a,b) => b.likes - a.likes);
  }else if(sort === "views_desc"){
    list.sort((a,b) => b.views - a.views);
  }else{
    // trending: mix valore + trend + likes
    list.sort((a,b) => {
      const sa = computeValue(a) + computeTrend(a) * 4 + a.likes * 0.1;
      const sb = computeValue(b) + computeTrend(b) * 4 + b.likes * 0.1;
      return sb - sa;
    });
  }

  return list;
}

function renderGallery(){
  const grid = $("#galleryGrid");
  grid.innerHTML = "";

  const list = getGalleryList();
  if(list.length === 0){
    grid.innerHTML = `<div class="muted" style="grid-column:1/-1;">Nessun risultato.</div>`;
    return;
  }

  for(const art of list){
    const value = computeValue(art);

    const card = document.createElement("article");
    card.className = "card art";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Apri opera ${art.title}`);

    card.innerHTML = `
      <div class="art__img" style="background-image:url('${art.img}')"></div>
      <div class="art__body">
        <div class="art__top">
          <div>
            <h3 class="art__title">${escapeHtml(art.title)}</h3>
            <div class="art__artist">${escapeHtml(art.artist)}</div>
          </div>
          <div class="art__value">${money(value)}</div>
        </div>

        <div class="art__meta">
          <span>❤ ${fmt(art.likes)}</span>
          <span>👁 ${fmt(art.views)}</span>
          <span>⟠ ${fmt(art.offers.length)} offerte</span>
        </div>

        <div class="art__actions">
          <button class="btn btn--ghost" data-act="view" data-id="${art.id}" type="button">Osserva</button>
          <button class="btn btn--ghost" data-act="like" data-id="${art.id}" type="button">Metti like</button>
          <button class="btn btn--primary" data-act="offer" data-id="${art.id}" type="button">Fai offerta</button>
        </div>
      </div>
    `;

    // click card opens modal (view)
    card.addEventListener("click", (e)=>{
      // se clicco bottone gestito sotto, evito doppio
      if(e.target?.matches?.("button")) return;
      openArtwork(art.id, { countView: true });
    });
    card.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openArtwork(art.id, { countView: true });
      }
    });

    grid.appendChild(card);
  }
}

/* ---------------------------------------------------------
   7) RENDER: MARKET (tabs)
   --------------------------------------------------------- */
let marketMode = "popular";

function getMarketList(){
  const list = state.artworks.slice();
  if(marketMode === "views"){
    list.sort((a,b) => b.views - a.views);
  }else if(marketMode === "gainers"){
    // crescita: trend + (ultimo - primo nello storico)
    list.sort((a,b)=>{
      const ga = growthScore(a);
      const gb = growthScore(b);
      return gb - ga;
    });
  }else{
    // popular: mix likes+views+offers
    list.sort((a,b)=>{
      const pa = a.likes*1.2 + a.views*0.08 + a.offers.length*6;
      const pb = b.likes*1.2 + b.views*0.08 + b.offers.length*6;
      return pb - pa;
    });
  }
  return list.slice(0, 6);
}

function growthScore(a){
  const h = a.history || [];
  if(h.length < 2) return 0;
  const first = h[0];
  const last = h[h.length-1];
  return (last-first) + computeTrend(a)*2;
}

function renderMarket(){
  const grid = $("#marketGrid");
  grid.innerHTML = "";

  const list = getMarketList();
  for(const art of list){
    const v = computeValue(art);
    const t = computeTrend(art);
    const isUp = t >= 0;

    const card = document.createElement("div");
    card.className = "mcard";
    card.innerHTML = `
      <div class="mcard__top">
        <div>
          <h3 class="mcard__name">${escapeHtml(art.title)}</h3>
          <div class="mcard__mini">${escapeHtml(art.artist)}</div>
        </div>
        <div class="mcard__price">${money(v)}</div>
      </div>

      <div class="trend ${isUp ? "up":"down"}">
        <span>${isUp ? "▲" : "▼"}</span>
        <span>${fmt(Math.abs(t))} ${CURRENCY_SYMBOL}</span>
        <span class="muted">/ tick</span>
      </div>

      <canvas class="spark" width="360" height="76" data-spark="${art.id}" aria-hidden="true"></canvas>

      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn--ghost" data-act="view" data-id="${art.id}" type="button">Dettagli</button>
        <button class="btn btn--primary" data-act="offer" data-id="${art.id}" type="button">Offerta</button>
      </div>
    `;
    grid.appendChild(card);
  }

  // disegna sparklines
  for(const a of list){
    const c = $(`canvas[data-spark="${a.id}"]`);
    if(c) drawSparkline(c, a.history || []);
  }
}

/* ---------------------------------------------------------
   8) SPARKLINES (mini grafico veloce su canvas)
   --------------------------------------------------------- */
function drawSparkline(canvas, values){
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  if(!values || values.length < 2){
    // fallback: linea piatta
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(0, h/2, w, 1);
    ctx.globalAlpha = 1;
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 10;

  const xStep = (w - pad*2) / (values.length - 1);
  const yMap = (v) => {
    const t = (v - min) / (max - min || 1);
    return (h - pad) - t * (h - pad*2);
  };

  // sfondo soft
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0,0,w,h);

  // area glow
  ctx.beginPath();
  values.forEach((v,i)=>{
    const x = pad + i*xStep;
    const y = yMap(v);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.lineTo(pad + (values.length-1)*xStep, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  ctx.fillStyle = "rgba(34,211,238,.08)";
  ctx.fill();

  // linea
  ctx.beginPath();
  values.forEach((v,i)=>{
    const x = pad + i*xStep;
    const y = yMap(v);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(34,211,238,.55)";
  ctx.stroke();

  // punto ultimo
  const lx = pad + (values.length-1)*xStep;
  const ly = yMap(values[values.length-1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 3.2, 0, Math.PI*2);
  ctx.fillStyle = "rgba(124,58,237,.65)";
  ctx.fill();
}

/* ---------------------------------------------------------
   9) MODAL + CHART.JS
   --------------------------------------------------------- */
let chart = null;

function openArtwork(id, opts={ countView:false }){
  const art = state.artworks.find(a=>a.id===id);
  if(!art) return;
  currentArtworkId = id;

  if(opts.countView){
    art.views += 1;
    pushHistory(art);
    saveState();
  }

  $("#modalImg").src = art.img;
  $("#modalImg").alt = art.title;

  $("#modalTitle").textContent = art.title;
  $("#modalArtist").textContent = art.artist;
  $("#modalDesc").textContent = art.desc;

  $("#modalLikes").textContent = fmt(art.likes);
  $("#modalViews").textContent = fmt(art.views);
  $("#modalOffers").textContent = fmt(art.offers.length);

  const v = computeValue(art);
  $("#modalValuePill").textContent = `Valore: ${money(v)}`;

  const t = computeTrend(art);
  const isUp = t >= 0;
  $("#modalTrendPill").textContent = `${isUp ? "▲" : "▼"} Trend: ${fmt(Math.abs(t))} ${CURRENCY_SYMBOL}`;

  // follow/like buttons label
  $("#btnLike").textContent = state.user.likes[id] ? "Like aggiunto ✓" : "Metti like";
  $("#btnFollow").textContent = state.user.followed.includes(id) ? "Segui ✓" : "Segui";

  // reset offer input
  $("#offerInput").value = "";

  // show modal
  const modal = $("#artModal");
  modal.hidden = false;
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";

  // chart
  renderChart(art);

  // wow small toast on view
  if(opts.countView) toast("Visualizzazione registrata • valore aggiornato");
}

function closeModal(){
  const modal = $("#artModal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  currentArtworkId = null;
}

function renderChart(art){
  const ctx = $("#valueChart");
  const data = (art.history || []).slice(-14);
  const labels = data.map((_,i)=> `${i+1}`);

  // distruggi chart precedente
  if(chart){
    chart.destroy();
    chart = null;
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Valore (${CURRENCY_SYMBOL})`,
        data,
        tension: 0.35,
        fill: true,
        borderColor: "rgba(34,211,238,.85)",
        backgroundColor: "rgba(34,211,238,.10)",
        pointRadius: 2.2,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${money(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.06)" },
          ticks: { color: "rgba(255,255,255,.55)" }
        },
        y: {
          grid: { color: "rgba(255,255,255,.06)" },
          ticks: { color: "rgba(255,255,255,.55)" }
        }
      }
    }
  });
}

/* ---------------------------------------------------------
   10) AZIONI: LIKE / FOLLOW / OFFER / SHARE
   --------------------------------------------------------- */
function likeCurrent(){
  const id = currentArtworkId;
  if(!id) return;
  if(!requireLogin()) return;

  if(state.user.likes[id]){
    toast("Hai già messo like (demo).");
    return;
  }
  const art = state.artworks.find(a=>a.id===id);
  if(!art) return;

  state.user.likes[id] = true;
  art.likes += 1;

  pushHistory(art);
  addActivity("LIKE", `Hai messo like a "${art.title}"`);

  saveState();
  openArtwork(id, { countView:false }); // refresh modal UI
  renderAll();
  toast("Like registrato • valore aggiornato");
}

function followCurrent(){
  const id = currentArtworkId;
  if(!id) return;
  if(!requireLogin()) return;

  const i = state.user.followed.indexOf(id);
  const art = state.artworks.find(a=>a.id===id);
  if(!art) return;

  if(i >= 0){
    state.user.followed.splice(i,1);
    addActivity("UNFOLLOW", `Hai smesso di seguire "${art.title}"`);
    toast("Non segui più questa opera.");
  }else{
    state.user.followed.push(id);
    addActivity("FOLLOW", `Stai seguendo "${art.title}"`);
    toast("Ora segui questa opera.");
  }
  saveState();
  openArtwork(id, { countView:false });
  renderProfile();
}

function offerCurrent(){
  const id = currentArtworkId;
  if(!id) return;
  if(!requireLogin()) return;

  const art = state.artworks.find(a=>a.id===id);
  if(!art) return;

  const raw = $("#offerInput").value;
  const offer = Math.floor(Number(raw));
  if(!offer || offer <= 0){
    toast("Inserisci un’offerta valida (numero > 0).");
    return;
  }

  if(state.user.balance < offer){
    toast("Saldo insufficiente (demo).");
    return;
  }

  // aggiorna saldo e offerte
  state.user.balance -= offer;
  art.offers.push(offer);

  pushHistory(art);
  addActivity("OFFER", `Offerta ${offer} ${CURRENCY_SYMBOL} su "${art.title}"`);

  saveState();
  openArtwork(id, { countView:false });
  renderAll();
  toast("Offerta registrata • valore aggiornato");
}

async function shareCurrent(){
  const id = currentArtworkId;
  const art = state.artworks.find(a=>a.id===id);
  if(!art) return;

  const text = `Meta Museum — ${art.title} (${money(computeValue(art))})`;
  try{
    if(navigator.share){
      await navigator.share({ title:"Meta Museum", text });
    }else{
      await navigator.clipboard.writeText(text);
      toast("Copiato negli appunti.");
    }
  }catch{
    toast("Condivisione annullata.");
  }
}

/* ---------------------------------------------------------
   11) LOGIN / LOGOUT
   --------------------------------------------------------- */
function renderNavUser(){
  $("#navUserLabel").textContent = state.user.username ? state.user.username : "Login";
}

function renderProfile(){
  $("#profileName").textContent = state.user.username ? state.user.username : "—";
  $("#profileBalance").textContent = state.user.username ? fmt(state.user.balance) : "—";

  // followed list
  const followed = $("#followedList");
  followed.innerHTML = "";
  if(!state.user.username){
    followed.innerHTML = `<div class="muted small">Fai login per vedere profilo.</div>`;
  }else if(state.user.followed.length === 0){
    followed.innerHTML = `<div class="muted small">Nessuna opera seguita.</div>`;
  }else{
    for(const id of state.user.followed){
      const art = state.artworks.find(a=>a.id===id);
      if(!art) continue;
      const row = document.createElement("div");
      row.className = "mini-item";
      row.innerHTML = `
        <div>
          <div style="font-weight:700;">${escapeHtml(art.title)}</div>
          <div class="muted small">${money(computeValue(art))}</div>
        </div>
        <button class="btn btn--ghost" type="button" data-open="${art.id}">Apri</button>
      `;
      row.querySelector("button").addEventListener("click", ()=> openArtwork(art.id, { countView:true }));
      followed.appendChild(row);
    }
  }

  // activity
  const activity = $("#activityList");
  activity.innerHTML = "";
  if(!state.user.username){
    activity.innerHTML = `<div class="muted small">—</div>`;
  }else if(state.user.activity.length === 0){
    activity.innerHTML = `<div class="muted small">Nessuna attività.</div>`;
  }else{
    for(const a of state.user.activity){
      const row = document.createElement("div");
      row.className = "mini-item";
      row.innerHTML = `
        <div>
          <div style="font-weight:700;">${escapeHtml(a.type)}</div>
          <div class="muted small">${escapeHtml(a.detail)}</div>
        </div>
        <div class="muted small">${escapeHtml(a.at)}</div>
      `;
      activity.appendChild(row);
    }
  }

  // enable/disable logout
  $("#btnLogout").disabled = !state.user.username;
}

function login(username){
  state.user.username = username;
  // saldo iniziale demo
  if(!state.user.balance || state.user.balance <= 0) state.user.balance = 1500;
  addActivity("LOGIN", `Accesso demo come ${username}`);
  saveState();
  renderNavUser();
  renderProfile();
  toast(`Benvenuto ${username} • saldo ${fmt(state.user.balance)} ${CURRENCY_SYMBOL}`);
}

function logout(){
  if(!state.user.username) return;
  const old = state.user.username;
  state.user.username = null;
  // NON resettiamo tutto: lasciamo demo viva, ma l'utente diventa anonimo
  saveState();
  renderNavUser();
  renderProfile();
  toast(`Logout: ${old}`);
}

/* ---------------------------------------------------------
   12) EVENTI UI
   --------------------------------------------------------- */
function bindEvents(){
  // nav buttons
  $("#btnEnterMuseum").addEventListener("click", ()=> scrollToId("gallery"));
  $("#btnScrollGallery").addEventListener("click", ()=> scrollToId("gallery"));
  $("#btnScrollMarket").addEventListener("click", ()=> scrollToId("market"));
  $("#btnOpenProfile").addEventListener("click", ()=> scrollToId("profile"));

  // mobile menu
  const menu = $("#mobileMenu");
  $("#btnMobileMenu").addEventListener("click", ()=>{
    const isHidden = menu.hidden;
    menu.hidden = !isHidden;
  });
  $("#btnMobileProfile").addEventListener("click", ()=>{
    menu.hidden = true;
    scrollToId("profile");
  });

  // gallery toolbar
  $("#searchInput").addEventListener("input", ()=> renderGallery());
  $("#sortSelect").addEventListener("change", ()=> renderGallery());

  // reset demo
  $("#btnResetDemo").addEventListener("click", ()=>{
    localStorage.removeItem(LS_KEY);
    state = loadState();
    renderAll();
    toast("Demo resettata.");
  });

  // delegated actions for gallery + market
  document.body.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    if(!id) return;

    if(act === "view"){
      openArtwork(id, { countView:true });
    }else if(act === "like"){
      if(!requireLogin()) return;
      // like senza aprire modal: apriamo e facciamo like
      openArtwork(id, { countView:false });
      likeCurrent();
    }else if(act === "offer"){
      if(!requireLogin()) return;
      openArtwork(id, { countView:false });
      $("#offerInput").focus();
    }
  });

  // market tabs
  $$(".chip").forEach(ch=>{
    ch.addEventListener("click", ()=>{
      $$(".chip").forEach(x=>x.classList.remove("is-active"));
      ch.classList.add("is-active");
      marketMode = ch.dataset.market;
      renderMarket();
    });
  });

  // modal close
  $("#artModal").addEventListener("click", (e)=>{
    if(e.target?.dataset?.close) closeModal();
  });
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && !$("#artModal").hidden) closeModal();
  });

  // modal actions
  $("#btnLike").addEventListener("click", likeCurrent);
  $("#btnFollow").addEventListener("click", followCurrent);
  $("#btnOffer").addEventListener("click", offerCurrent);
  $("#btnShare").addEventListener("click", shareCurrent);

  // login form
  $("#loginForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const raw = ($("#usernameInput").value || "").trim();
    const username = raw.replace(/\s+/g, "").slice(0,18);
    if(username.length < 2){
      toast("Username troppo corto.");
      return;
    }
    login(username);
  });
  $("#btnLogout").addEventListener("click", logout);
}

/* ---------------------------------------------------------
   13) ANIMAZIONI WOW: GSAP + SCROLL + PARALLAX
   --------------------------------------------------------- */
function initGSAP(){
  if(!window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);

  // reveal on load
  gsap.to(".reveal", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.06,
    delay: 0.05
  });

  // parallax orbs
  gsap.to(".orb--1", { x: 28, y: 16, duration: 6, repeat:-1, yoyo:true, ease:"sine.inOut" });
  gsap.to(".orb--2", { x: -22, y: 18, duration: 7, repeat:-1, yoyo:true, ease:"sine.inOut" });
  gsap.to(".orb--3", { x: 18, y: -22, duration: 8, repeat:-1, yoyo:true, ease:"sine.inOut" });

  // scroll depth sections
  gsap.utils.toArray(".section").forEach((sec)=>{
    gsap.fromTo(sec, { filter:"brightness(0.92)" }, {
      filter:"brightness(1)",
      scrollTrigger: {
        trigger: sec,
        start:"top 80%",
        end:"top 20%",
        scrub: true
      }
    });
  });

  // subtle hero parallax on mouse move
  const showcase = $("#heroShowcase");
  window.addEventListener("mousemove", (e)=>{
    const r = showcase.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = (e.clientX - cx) / r.width;
    const dy = (e.clientY - cy) / r.height;
    gsap.to(showcase, { rotateY: dx*6, rotateX: -dy*6, transformPerspective: 800, duration: 0.5, ease:"power2.out" });
  }, { passive:true });
}

/* ---------------------------------------------------------
   14) HERO CANVAS (particelle semplici = wow facile)
   --------------------------------------------------------- */
function initHeroCanvas(){
  const canvas = $("#heroCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let particles = [];

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // rigenera particelle
    particles = Array.from({length: 70}, ()=>({
      x: Math.random()*w,
      y: Math.random()*h,
      r: 0.8 + Math.random()*2.2,
      vx: (-0.18 + Math.random()*0.36),
      vy: (-0.12 + Math.random()*0.24),
      a: 0.25 + Math.random()*0.45
    }));
  }

  function tick(){
    ctx.clearRect(0,0,w,h);

    // gradient "aurora"
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "rgba(124,58,237,.14)");
    g.addColorStop(0.5, "rgba(34,211,238,.10)");
    g.addColorStop(1, "rgba(59,130,246,.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // particelle + link lines
    for(const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -30) p.x = w+30;
      if(p.x > w+30) p.x = -30;
      if(p.y < -30) p.y = h+30;
      if(p.y > h+30) p.y = -30;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
    }

    // lines
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if(d < 120){
          const alpha = (1 - d/120) * 0.12;
          ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
}

/* ---------------------------------------------------------
   15) HERO SPARK CANVAS
   --------------------------------------------------------- */
function initHeroSpark(){
  const c = $("#heroSpark");
  const ctx = c.getContext("2d");
  const w = c.width, h = c.height;

  function draw(){
    ctx.clearRect(0,0,w,h);
    // dati finti in loop
    const values = [];
    let v = 10;
    for(let i=0;i<22;i++){
      v += (Math.random()-0.45)*0.8;
      values.push(v);
    }
    drawSparkline(c, values);
  }
  draw();
  setInterval(draw, 2200);
}

/* ---------------------------------------------------------
   16) MAIN RENDER
   --------------------------------------------------------- */
function renderAll(){
  renderNavUser();
  renderHeroStats();
  renderGallery();
  renderMarket();
  renderProfile();
}

/* ---------------------------------------------------------
   17) SECURITY: basic escape (demo)
   --------------------------------------------------------- */
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
bindEvents();
renderAll();
initHeroCanvas();
initHeroSpark();
initGSAP();
