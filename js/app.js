/* ============================================================================
   app.js — SmartSpace controller. The screens follow the To-Be process:
   sign in → room photo, dimensions and type → style, colors and exact budget
   → system analysis, recommendations, store matching, 2D layout and checks
   → review → (approve → save/export → open store link) or
              (request alternatives → select item → suggestions) or exit.
   ========================================================================= */

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString("en-US") + " SAR";
const ORDER = ["room", "prefs", "design", "list"];

const COLOR_SETS = {
  room:    null,
  warm:    ["#b5754f", "#c9a876", "#a3362f", "#8a5a34"],
  cool:    ["#8fa3ad", "#5c6b73", "#2b2f36", "#dcd6c9"],
  neutral: ["#e6e1d8", "#d8d1c4", "#b7b0a3", "#e9e6e1"],
};

const state = {
  profile: null, img: null, imgUrl: null,
  roomType: "bedroom", analysis: null,
  style: "room", colors: "room", budget: null,
  items: [], dropped: [], selecting: false, current: "room",
  catalog: loadCatalog(), stores: loadStores(),
};

/* ------------------------------ helpers ------------------------------ */
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
const storeOf = id => state.stores.find(s => s.id === id) || { name: "Unknown store", url: "" };
const total = () => state.items.reduce((s, i) => s + i.price, 0);
const roomCm = () => ({ w: Number($("roomW").value) * 100, l: Number($("roomL").value) * 100 });
function showError(id, msg) { const el = $(id); el.textContent = msg; el.hidden = !msg; }

function goTo(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
  if (ORDER.includes(view)) {
    state.current = view;
    document.querySelectorAll(".stepper li").forEach(li => {
      const i = ORDER.indexOf(li.dataset.step), c = ORDER.indexOf(view);
      li.classList.toggle("done", i < c);
      li.classList.toggle("current", i === c);
      li.toggleAttribute("aria-current", i === c);
    });
  }
  window.scrollTo({ top: 0 });
  if (view === "design") renderDesign();
}

/* ------------------------------ sign in ------------------------------ */
(function makeSky() {
  const sky = $("sky"), small = window.innerWidth < 600, R = (a, b) => a + Math.random() * (b - a);
  const pos = () => `left:${R(0, 100).toFixed(2)}%;top:${R(0, 100).toFixed(2)}%;`;
  // Large glows and sparkles stay at the sides so the logo and form stay readable.
  const side = () => `left:${(Math.random() < .5 ? R(3, 30) : R(70, 97)).toFixed(2)}%;top:${R(5, 95).toFixed(2)}%;`;
  const time = (a, b) => `--d:${R(a, b).toFixed(2)}s;--delay:${(-R(0, 8)).toFixed(2)}s;`;
  // Halo colours seen in the logo background: white, lavender, violet, periwinkle blue.
  const COLORS = [
    ["#ffffff", "rgb(235 228 255 / .8)", "rgb(200 185 255 / .3)"],
    ["#f1e8ff", "rgb(200 165 255 / .75)", "rgb(160 115 255 / .28)"],
    ["#e9d6ff", "rgb(178 120 255 / .75)", "rgb(140 80 240 / .3)"],
    ["#e4e9ff", "rgb(150 168 255 / .75)", "rgb(110 128 255 / .3)"],
  ];
  let html = "";
  // 1. tiny sharp dots
  for (let i = 0; i < (small ? 35 : 60); i++)
    html += `<i class="p" style="${pos()}--s:${(Math.random() < .6 ? R(.7, 1.3) : R(1.4, 2.2)).toFixed(1)}px;--a:${R(.45, .9).toFixed(2)};${time(2, 6)}"></i>`;
  // 2. soft out-of-focus discs
  for (let i = 0; i < (small ? 6 : 12); i++)
    html += `<i class="b" style="${pos()}--h:${R(18, 60).toFixed(0)}px;${time(6, 12)}"></i>`;
  // 3. glowing points of different sizes (a few large blue/violet halos)
  for (let i = 0; i < (small ? 12 : 24); i++) {
    const big = i < (small ? 1 : 3), c = big ? COLORS[3 - (i % 2)] : COLORS[Math.floor(R(0, 4))];
    html += `<i class="g" style="${big ? side() : pos()}--h:${(big ? R(60, 95) : (Math.random() < .5 ? R(8, 16) : R(18, 34))).toFixed(0)}px;--c0:${c[0]};--c1:${c[1]};--c2:${c[2]};${time(3, 7)}"></i>`;
  }
  // 4. sparkle stars: long thin cross rays, short diagonal rays, bright core and halo
  for (let i = 0; i < (small ? 1 : 3); i++) {
    const id = "st" + i;
    html += `<span class="star" style="${side()}--h:${R(44, 78).toFixed(0)}px;${time(4, 7)}"><svg viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="${id}h"><stop offset="0" stop-color="#b9a4ff" stop-opacity=".45"/><stop offset="1" stop-color="#b9a4ff" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}x"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}c"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#e8dcff"/><stop offset="1" stop-color="#c7b0ff" stop-opacity="0"/></radialGradient>
      </defs>
      <circle r="55" fill="url(#${id}h)"/>
      <rect x="-100" y="-0.9" width="200" height="1.8" fill="url(#${id}x)"/>
      <rect x="-0.9" y="-100" width="1.8" height="200" fill="url(#${id}y)"/>
      <g transform="rotate(45)"><rect x="-22" y="-0.7" width="44" height="1.4" fill="url(#${id}x)"/><rect x="-0.7" y="-22" width="1.4" height="44" fill="url(#${id}y)"/></g>
      <circle r="9" fill="url(#${id}c)"/>
    </svg></span>`;
  }
  sky.innerHTML = html;
})();
function enterApp() {
  $("signin").hidden = true; $("app").hidden = false;
  $("avatarInitial").textContent = (state.profile.name[0] || "S").toUpperCase();
  goTo("room");
}
$("signinForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("siName").value.trim(), email = $("siEmail").value.trim();
  if (!name) return showError("siError", "Enter your name to continue.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("siError", "Enter a valid email, for example name@example.com.");
  showError("siError", "");
  state.profile = { name, email }; saveProfile(state.profile); enterApp();
});
$("signOut").addEventListener("click", () => {
  clearProfile(); state.profile = null;
  $("app").hidden = true; $("signin").hidden = false;
});
$("brandHome").addEventListener("click", e => { e.preventDefault(); goTo(state.current); });

/* ------------------------------ step 1: room ------------------------------ */
$("roomTypes").innerHTML = Object.entries(ROOM_TYPES)
  .map(([k, v]) => `<button type="button" data-type="${k}" aria-pressed="${k === state.roomType}">${v.label}</button>`).join("");
$("roomTypes").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.roomType = b.dataset.type; state.items = [];
  $("roomTypes").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
});

const dz = $("dropzone"), fileIn = $("photoInput");
dz.addEventListener("click", () => fileIn.click());
dz.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } });
["dragover", "dragenter"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
dz.addEventListener("drop", e => e.dataTransfer.files[0] && loadPhoto(e.dataTransfer.files[0]));
fileIn.addEventListener("change", e => e.target.files[0] && loadPhoto(e.target.files[0]));

function loadPhoto(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return showError("roomError", "Use a JPG, PNG, or WebP photo.");
  const r = new FileReader();
  r.onload = ev => {
    state.imgUrl = ev.target.result;
    const img = new Image();
    img.onload = () => { state.img = img; state.items = []; };
    img.src = state.imgUrl;
    $("roomPreview").src = state.imgUrl; $("roomPreview").hidden = false;
    $("dzEmpty").hidden = true; $("changePhoto").hidden = false;
    showError("roomError", "");
  };
  r.readAsDataURL(file);
}

$("analyzeBtn").addEventListener("click", () => {
  const w = Number($("roomW").value), l = Number($("roomL").value), h = Number($("roomH").value);
  if (!state.img) return showError("roomError", "Upload a photo of the room first.");
  if (!(w >= 2 && w <= 10 && l >= 2 && l <= 10)) return showError("roomError", "Width and length must be between 2 and 10 meters.");
  if (!(h >= 2.2 && h <= 5)) return showError("roomError", "Height must be between 2.2 and 5 meters.");
  const a = analyzeRoomImage(state.img);
  if (!a) return showError("roomError", "This photo could not be analyzed. Try a clearer photo of the room.");
  state.analysis = a;
  renderPrefs();
  goTo("prefs");
});

/* ------------------------------ step 2: preferences ------------------------------ */
function renderPrefs() {
  const a = state.analysis;
  $("analysisPhoto").src = state.imgUrl;
  $("detectedStyle").textContent = a.styleLabel;
  $("palette").innerHTML = a.palette.map(hex => `<span style="background:${hex}" title="${hex}"></span>`).join("");
  $("analysisStats").textContent = `${a.warmth[0].toUpperCase() + a.warmth.slice(1)} tones, ${a.avgSat}% saturation, ${a.avgLight}% lightness`;

  const styles = [["room", "Match my room", a.styleLabel], ...Object.entries(STYLES).map(([k, v]) => [k, v, ""])];
  $("styleChoices").innerHTML = styles.map(([k, v, sub]) =>
    `<button type="button" data-v="${k}" aria-pressed="${k === state.style}"><span>${v}</span>${sub ? `<small>${sub}</small>` : ""}</button>`).join("");
  const colors = [["room", "Room palette"], ["warm", "Warm"], ["cool", "Cool"], ["neutral", "Neutral"]];
  $("colorChoices").innerHTML = colors.map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${k === state.colors}">${v}</button>`).join("");
}
function pressGroup(groupId, key) {
  $(groupId).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    state[key] = b.dataset.v;
    $(groupId).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });
}
pressGroup("styleChoices", "style");
pressGroup("colorChoices", "colors");
$("budgetQuick").innerHTML = [5000, 10000, 15000].map(v => `<button type="button" data-v="${v}">${v.toLocaleString("en-US")} SAR</button>`).join("");
$("budgetQuick").addEventListener("click", e => { const b = e.target.closest("button"); if (b) $("budget").value = b.dataset.v; });

$("generateBtn").addEventListener("click", () => {
  const budget = Number($("budget").value);
  if (!(budget >= 500)) return showError("prefsError", "Enter your budget in SAR (at least 500).");
  showError("prefsError", "");
  state.budget = budget;
  generateDesign();
  goTo("design");
});

function designContext() {
  const { w, l } = roomCm();
  return {
    roomW: w, roomL: l, roomType: state.roomType, budget: state.budget,
    styleTag: state.style === "room" ? state.analysis.styleTag : state.style,
    palette: COLOR_SETS[state.colors] || state.analysis.palette,
  };
}

function generateDesign() {
  const ctx = designContext();
  const { items, dropped } = buildRecommendation(state.catalog, ctx);
  const placed = autoPlace(items.map((p, i) => ({ ...p, uid: i + 1 })), ctx.roomW, ctx.roomL);
  state.items = placed.filter(i => i.fits);
  state.dropped = [...dropped, ...placed.filter(i => !i.fits).map(i => ({ category: i.category, reason: "not enough floor space" }))];
}

/* ------------------------------ step 3: design ------------------------------ */
function renderDesign() {
  const ctx = designContext();
  $("designTitle").textContent = `${ROOM_TYPES[state.roomType].label}, ${STYLES[ctx.styleTag]}`;
  $("designMeta").textContent = `${(ctx.roomW / 100).toFixed(1)} m × ${(ctx.roomL / 100).toFixed(1)} m, budget ${fmt(ctx.budget)}`;

  const frame = $("planFrame"), plan = $("plan");
  const fw = Math.max(260, frame.clientWidth - 64);
  const fh = Math.min(560, Math.max(300, window.innerHeight * 0.6));
  setScale(ctx.roomW, ctx.roomL, fw, fh);
  plan.style.width = cm(ctx.roomW) + "px";
  plan.style.height = cm(ctx.roomL) + "px";
  plan.style.backgroundSize = `${cm(50)}px ${cm(50)}px`;
  plan.innerHTML = `<span class="dim w">${(ctx.roomW / 100).toFixed(1)} m</span><span class="dim l">${(ctx.roomL / 100).toFixed(1)} m</span>`;

  state.items.forEach(item => {
    const el = document.createElement("div");
    el.className = "piece" + (FLOOR_LAYERS.includes(item.category) ? " rug" : "");
    el.dataset.uid = item.uid;
    el.tabIndex = 0;
    el.setAttribute("aria-label", `${item.name}, use arrow keys to move`);
    el.style.cssText = `left:${cm(item.x)}px;top:${cm(item.y)}px;width:${cm(item.w)}px;height:${cm(item.d)}px;--swatch:${item.color}`;
    el.textContent = cm(item.w) > 60 && cm(item.d) > 26 ? item.category : "";
    el.title = `${item.name} (${item.w} × ${item.d} cm)`;
    makeDraggable(el, item, ctx.roomW, ctx.roomL, () => refreshChecks());
    el.addEventListener("click", () => { if (state.selecting) openAlternatives(item); });
    el.addEventListener("keydown", e => { if (state.selecting && e.key === "Enter") { e.preventDefault(); openAlternatives(item); } });
    plan.appendChild(el);
  });

  renderSide();
  refreshChecks();
  setSelecting(state.selecting);
}

function renderSide() {
  const t = total(), b = state.budget;
  $("totalText").textContent = fmt(t);
  const fill = $("meterFill");
  fill.style.width = Math.min(100, (t / b) * 100) + "%";
  fill.classList.toggle("over", t > b);
  $("budgetLeft").textContent = t <= b ? `${fmt(b - t)} left of ${fmt(b)}` : `${fmt(t - b)} over your budget`;
  $("itemList").innerHTML = state.items.map(i => `
    <li data-uid="${i.uid}" tabindex="0">
      <span class="sw" style="background:${i.color}"></span>
      <span><span class="nm">${i.name}</span><br><span class="st">${storeOf(i.store).name}, ${i.w} × ${i.d} cm</span></span>
      <span class="pr">${fmt(i.price)}</span>
    </li>`).join("");
  const dn = $("droppedNote");
  dn.hidden = !state.dropped.length;
  dn.textContent = state.dropped.length ? "Not included: " + state.dropped.map(d => `${d.category} (${d.reason})`).join("; ") + "." : "";
}

function refreshChecks() {
  const ctx = designContext();
  const issues = checkLayout(state.items, ctx.roomW, ctx.roomL);
  document.querySelectorAll(".piece").forEach(el => {
    const it = state.items.find(i => String(i.uid) === el.dataset.uid);
    el.classList.toggle("bad", !!(it && (it._clash || it._outside)));
  });
  const overBudget = total() > state.budget;
  const badge = $("fitBadge");
  if (!issues && !overBudget) { badge.textContent = "Fits the room and budget"; badge.className = "fit-badge ok"; }
  else { badge.textContent = issues ? `${issues} item${issues > 1 ? "s" : ""} need moving` : "Over budget"; badge.className = "fit-badge bad"; }
  return { issues, overBudget };
}

function pickFromList(e) {
  if (!state.selecting) return;
  if (e.type === "keydown" && e.key !== "Enter") return;
  const li = e.target.closest("li"); if (!li) return;
  e.preventDefault();
  openAlternatives(state.items.find(i => String(i.uid) === li.dataset.uid));
}
$("itemList").addEventListener("click", pickFromList);
$("itemList").addEventListener("keydown", pickFromList);

/* Design approved? */
$("approveBtn").addEventListener("click", () => {
  const { issues, overBudget } = refreshChecks();
  if (issues) return toast("Move the items outlined in red before approving");
  if (overBudget) return toast("The design is over budget. Request alternatives first");
  setSelecting(false);
  renderList();
  goTo("list");
});

/* No → request suggested alternatives? */
function setSelecting(on) {
  state.selecting = on;
  $("selectBanner").hidden = !on;
  $("alternativesBtn").hidden = on;
  document.querySelectorAll(".piece, #itemList li").forEach(el => el.classList.toggle("selectable", on));
}
$("alternativesBtn").addEventListener("click", () => setSelecting(true));
$("cancelSelect").addEventListener("click", () => setSelecting(false));

function openAlternatives(item) {
  const ctx = designContext();
  const alts = suggestAlternatives(state.catalog, item, ctx, total());
  $("altTitle").textContent = `Alternatives for ${item.category.toLowerCase()}`;
  if (!alts.length) {
    $("altNote").textContent = `No other ${item.category.toLowerCase()} fits the room and the remaining budget, so the current item is kept.`;
    $("altList").innerHTML = "";
  } else {
    $("altNote").textContent = `Current: ${item.name}, ${fmt(item.price)}. These fit your room and keep the total within ${fmt(ctx.budget)}.`;
    $("altList").innerHTML = alts.map(a => `
      <li><button data-id="${a.id}">
        <span class="sw" style="width:12px;height:12px;border-radius:50%;background:${a.color}"></span>
        <span><strong>${a.name}</strong><br><span class="muted small">${storeOf(a.store).name}, ${a.w} × ${a.d} cm</span></span>
        <strong>${fmt(a.price)}</strong>
      </button></li>`).join("");
  }
  $("altList").onclick = e => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    const alt = alts.find(a => a.id === b.dataset.id);
    const keep = { uid: item.uid, x: item.x, y: item.y };
    const idx = state.items.findIndex(i => i.uid === item.uid);
    const next = { ...alt, ...keep };
    next.x = Math.min(next.x, Math.max(0, ctx.roomW - next.w));
    next.y = Math.min(next.y, Math.max(0, ctx.roomL - next.d));
    state.items[idx] = next;
    $("altDialog").close();
    setSelecting(false);
    renderDesign();
    toast("Item replaced. Review the updated design");
  };
  $("altDialog").showModal();
}

/* No alternatives → exit */
$("exitBtn").addEventListener("click", () => $("exitDialog").showModal());
$("confirmExit").addEventListener("click", () => { $("exitDialog").close(); resetDesign(); });

function resetDesign() {
  Object.assign(state, { img: null, imgUrl: null, analysis: null, items: [], dropped: [], selecting: false, budget: null, style: "room", colors: "room" });
  $("roomPreview").hidden = true; $("dzEmpty").hidden = false; $("changePhoto").hidden = true;
  $("photoInput").value = ""; $("budget").value = "";
  goTo("room");
}

/* ------------------------------ step 4: shopping list ------------------------------ */
function renderList() {
  $("listMeta").textContent = `${ROOM_TYPES[state.roomType].label}, ${state.items.length} items, budget ${fmt(state.budget)}`;
  $("shopRows").innerHTML = state.items.map(i => `
    <tr>
      <td><strong>${i.name}</strong><br><span class="muted small">${i.category}, ${i.w} × ${i.d} cm</span></td>
      <td>${storeOf(i.store).name}</td>
      <td class="num">${fmt(i.price)}</td>
      <td class="num"><button class="open" data-id="${i.id}">Open in store</button></td>
    </tr>`).join("");
  $("shopTotal").textContent = fmt(total());
}
$("shopRows").addEventListener("click", e => {
  const b = e.target.closest(".open"); if (!b) return;
  const item = state.items.find(i => i.id === b.dataset.id), s = storeOf(item.store);
  $("redirectText").textContent = `You would now be redirected to ${s.name} (${s.url}) to buy “${item.name}”.`;
  $("redirectDialog").showModal();
});
const currentDesign = () => ({ roomType: state.roomType, room: roomCm(), budget: state.budget, style: designContext().styleTag, items: state.items });
$("saveBtn").addEventListener("click", () => toast(saveDesign(currentDesign()) ? "Design saved" : "Could not save. Browser storage is unavailable"));
$("exportBtn").addEventListener("click", () => { exportShoppingCSV(currentDesign(), state.stores); toast("Shopping list exported"); });
$("printBtn").addEventListener("click", () => {
  $("printArea").innerHTML = `<h1>SmartSpace shopping list</h1><p>${$("listMeta").textContent}</p>
    <table><thead><tr><th>Item</th><th>Store</th><th>Price</th></tr></thead><tbody>
    ${state.items.map(i => `<tr><td>${i.name}</td><td>${storeOf(i.store).name}</td><td>${fmt(i.price)}</td></tr>`).join("")}
    </tbody><tfoot><tr><td colspan="2">Total</td><td>${fmt(total())}</td></tr></tfoot></table>
    <p>Prototype data: stores and prices are fictional.</p>`;
  window.print();
});
$("newDesignBtn").addEventListener("click", resetDesign);

/* ------------------------------ back navigation ------------------------------ */
$("backToRoom").addEventListener("click", () => goTo("room"));
$("backToPrefs").addEventListener("click", () => { setSelecting(false); goTo("prefs"); });
$("backToDesign").addEventListener("click", () => goTo("design"));
document.querySelectorAll(".stepper li").forEach(li => li.addEventListener("click", () => {
  if (!li.classList.contains("done")) return;
  if (li.dataset.step === "design" && !state.items.length) return;
  setSelecting(false); goTo(li.dataset.step);
}));
// Changing the room after analysis needs a new analysis before generating again.
["roomW", "roomL", "roomH"].forEach(id => $(id).addEventListener("change", () => { state.items = []; }));

/* ------------------------------ admin ------------------------------ */
const admin = initAdmin({
  catalog: () => state.catalog, stores: () => state.stores, toast,
  updateCatalog: c => { state.catalog = c; saveCatalog(c); },
  updateStores: s => { state.stores = s; saveStores(s); },
});
$("openAdmin").addEventListener("click", () => { admin.open(); goTo("admin"); });
$("closeAdmin").addEventListener("click", () => goTo(state.current));

/* ------------------------------ dialogs & boot ------------------------------ */
document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => {
  if (e.target.closest("[data-close]") || e.target === d) d.close();
}));
let rT; window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { if (state.current === "design" && $("view-design").classList.contains("active")) renderDesign(); }, 150); });

state.profile = loadProfile();
if (state.profile) enterApp();
