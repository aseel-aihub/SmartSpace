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
const storeOf = id => state.stores.find(s => s.id === id) || { name: "Unknown store" };
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
  // Larger glows and stars stay at the sides so the logo and the form stay readable.
  const side = () => `left:${(Math.random() < .5 ? R(3, 30) : R(70, 97)).toFixed(2)}%;top:${R(5, 95).toFixed(2)}%;`;
  const time = (a, b) => `--d:${R(a, b).toFixed(2)}s;--delay:${(-R(0, 6)).toFixed(2)}s;`;
  const COLORS = [
    ["#ffffff", "rgb(238 232 255 / .9)", "rgb(205 190 255 / .38)"],
    ["#f3ebff", "rgb(205 170 255 / .85)", "rgb(165 120 255 / .35)"],
    ["#ecdcff", "rgb(182 125 255 / .85)", "rgb(145 85 245 / .36)"],
    ["#e6ebff", "rgb(155 172 255 / .85)", "rgb(112 130 255 / .36)"],
  ];
  let html = "";
  // 1. tiny sharp dots (0.7–2.2 px)
  for (let i = 0; i < (small ? 35 : 60); i++)
    html += `<i class="p" style="${pos()}--s:${(Math.random() < .6 ? R(.7, 1.3) : R(1.4, 2.2)).toFixed(1)}px;--a:${R(.55, 1).toFixed(2)};${time(1.4, 3.2)}"></i>`;
  // 2. soft out-of-focus discs
  for (let i = 0; i < (small ? 5 : 10); i++)
    html += `<i class="b" style="${pos()}--h:${R(18, 56).toFixed(0)}px;${time(4, 8)}"></i>`;
  // 3. glowing points, small to medium, with a few larger halos at the sides
  for (let i = 0; i < (small ? 12 : 24); i++) {
    const big = i < (small ? 1 : 3), c = big ? COLORS[3 - (i % 2)] : COLORS[Math.floor(R(0, 4))];
    html += `<i class="g" style="${big ? side() : pos()}--h:${(big ? R(56, 85) : (Math.random() < .5 ? R(8, 16) : R(18, 32))).toFixed(0)}px;--c0:${c[0]};--c1:${c[1]};--c2:${c[2]};${time(2, 3.8)}"></i>`;
  }
  // 4. sparkle stars (many): long thin cross rays, short diagonal rays, bright core, soft halo
  const nStars = small ? 7 : 16;
  for (let i = 0; i < nStars; i++) {
    const id = "st" + i, large = i < (small ? 2 : 4);
    const size = large ? R(54, 78) : (Math.random() < .5 ? R(18, 30) : R(30, 46));
    html += `<span class="star" style="${large ? side() : pos()}--h:${size.toFixed(0)}px;${time(1.8, 3.4)}"><svg viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="${id}h"><stop offset="0" stop-color="#b9a4ff" stop-opacity=".5"/><stop offset="1" stop-color="#b9a4ff" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}x"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}c"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ece2ff"/><stop offset="1" stop-color="#c7b0ff" stop-opacity="0"/></radialGradient>
      </defs>
      <circle r="58" fill="url(#${id}h)"/>
      <rect x="-100" y="-1" width="200" height="2" fill="url(#${id}x)"/>
      <rect x="-1" y="-100" width="2" height="200" fill="url(#${id}y)"/>
      <g transform="rotate(45)"><rect x="-24" y="-0.8" width="48" height="1.6" fill="url(#${id}x)"/><rect x="-0.8" y="-24" width="1.6" height="48" fill="url(#${id}y)"/></g>
      <circle r="10" fill="url(#${id}c)"/>
    </svg></span>`;
  }
  // 5. shooting stars: each crosses part of the sky, then waits before the next pass
  for (let i = 0; i < (small ? 2 : 4); i++)
    html += `<i class="meteor" style="left:${R(10, 75).toFixed(1)}%;top:${R(2, 45).toFixed(1)}%;--len:${R(90, 160).toFixed(0)}px;` +
      `--travel:${R(260, 480).toFixed(0)}px;--ang:${R(18, 38).toFixed(0)}deg;--d:${R(6, 11).toFixed(1)}s;--delay:${(-R(0, 10)).toFixed(1)}s"></i>`;
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

/* ------------------------------ step 4: checkout (SmartSpace is the intermediary) ------------------------------ */
function renderList() {
  $("listMeta").textContent = `${ROOM_TYPES[state.roomType].label}, ${state.items.length} items, budget ${fmt(state.budget)}`;
  $("shopRows").innerHTML = state.items.map(i => `
    <tr>
      <td><strong>${i.name}</strong><br><span class="muted small">${i.category}, ${i.w} × ${i.d} cm</span></td>
      <td>${storeOf(i.store).name}</td>
      <td class="num">${fmt(i.price)}</td>
    </tr>`).join("");
  $("subTotal").textContent = fmt(total());
  $("shopTotal").textContent = fmt(total());
  $("payBtn").textContent = `Place order and pay ${fmt(total())}`;
  if (!$("coName").value && state.profile) $("coName").value = state.profile.name;
}
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

let payMethod = "card";
$("payMethods").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  payMethod = b.dataset.v;
  $("payMethods").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  $("cardFields").hidden = payMethod !== "card";
});
$("coCard").addEventListener("input", e => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = d.replace(/(.{4})/g, "$1 ").trim();
});
$("coExp").addEventListener("input", e => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
});

$("payForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("coName").value.trim(), phone = $("coPhone").value.replace(/\s/g, ""), address = $("coAddress").value.trim();
  if (!name) return showError("payError", "Enter the full name for delivery.");
  if (!/^05\d{8}$/.test(phone)) return showError("payError", "Enter a Saudi mobile number, for example 0512345678.");
  if (address.length < 8) return showError("payError", "Enter the delivery address (district, street, building).");
  let last4 = "";
  if (payMethod === "card") {
    const card = $("coCard").value.replace(/\s/g, ""), exp = $("coExp").value, cvv = $("coCvv").value;
    if (!/^\d{16}$/.test(card)) return showError("payError", "Enter the 16-digit card number.");
    const m = exp.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return showError("payError", "Enter the expiry date as MM/YY.");
    if (new Date(2000 + +m[2], +m[1]) < new Date()) return showError("payError", "This card has expired.");
    if (!/^\d{3,4}$/.test(cvv)) return showError("payError", "Enter the 3 or 4 digit CVV.");
    last4 = card.slice(-4);
  }
  showError("payError", "");
  // Card details are not kept: only the last four digits are shown on the order.
  $("coCard").value = ""; $("coExp").value = ""; $("coCvv").value = "";
  const design = { ...currentDesign(), ctx: designContext() };
  const order = createOrder(design, { name, phone, city: $("coCity").value, address }, { method: payMethod, last4 });
  state.lastOrder = order.id;
  showOrder(order.id);
  toast("Payment confirmed. Your order was sent to the stores");
});

function showOrder(id) {
  const orders = loadOrders();
  const order = (id && orders.find(o => o.id === id)) || orders[0] || null;
  renderOrderView(order);
  goTo("order");
}
$("openOrders").addEventListener("click", () => showOrder(state.lastOrder));
$("orderNewRoom").addEventListener("click", resetDesign);

/* Store portal (Furniture Store actor) */
function openStorePortal() {
  const sel = $("storeSelect");
  const prev = sel.value;
  sel.innerHTML = state.stores.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  const withOrders = loadOrders().flatMap(o => o.items.map(i => i.store));
  sel.value = prev || withOrders[0] || state.stores[0].id;
  renderStorePortal(sel.value);
  goTo("store");
}
$("openStore").addEventListener("click", openStorePortal);
$("storeSelect").addEventListener("change", e => renderStorePortal(e.target.value));
$("closeStore").addEventListener("click", () => goTo(state.current));

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

// The sign-in page is always the first page when the link is opened.
const saved = loadProfile();
if (saved) { $("siName").value = saved.name || ""; $("siEmail").value = saved.email || ""; }
