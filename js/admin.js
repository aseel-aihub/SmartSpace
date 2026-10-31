/* ============================================================================
   admin.js — Administrator use cases: "Manage Furniture Catalog" and
   "Store Data Sources" (product data provided by stores and imported here).
   ========================================================================= */

function initAdmin(ctx) {
  const $ = id => document.getElementById(id);
  const categories = [...new Set(DEFAULT_CATALOG.map(p => p.category))];

  // Tabs
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t === tab)));
    $("tab-catalog").hidden = tab.dataset.tab !== "catalog";
    $("tab-stores").hidden = tab.dataset.tab !== "stores";
  }));

  const form = $("addProduct"), F = form.elements;
  function fillSelects() {
    F.category.innerHTML = categories.map(c => `<option>${c}</option>`).join("");
    F.style.innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    const opts = ctx.stores().map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    F.store.innerHTML = opts;
    $("importStore").innerHTML = opts;
  }

  function renderCatalog() {
    const stores = ctx.stores();
    $("catalogRows").innerHTML = ctx.catalog().map(p => `
      <tr>
        <td><span class="sw-inline" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:.5rem"></span>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.w} × ${p.d}</td>
        <td>${p.style.map(s => STYLES[s] || s).join(", ")}</td>
        <td>${(stores.find(s => s.id === p.store) || {}).name || "—"}</td>
        <td class="num"><input class="price" type="number" min="1" value="${p.price}" data-id="${p.id}" aria-label="Price of ${p.name}"></td>
        <td class="num"><button class="del" data-id="${p.id}">Remove</button></td>
      </tr>`).join("");
  }

  function renderStores() {
    const cat = ctx.catalog();
    $("storeRows").innerHTML = ctx.stores().map(s => `
      <tr>
        <td>${s.name}</td><td>${s.type}</td><td>${s.city}</td><td>${s.source}</td>
        <td class="num">${cat.filter(p => p.store === s.id).length}</td><td>${s.updated}</td>
      </tr>`).join("");
  }

  $("catalogRows").addEventListener("change", e => {
    if (!e.target.classList.contains("price")) return;
    const v = Number(e.target.value);
    if (!(v > 0)) { e.target.value = ctx.catalog().find(p => p.id === e.target.dataset.id).price; return; }
    ctx.updateCatalog(ctx.catalog().map(p => p.id === e.target.dataset.id ? { ...p, price: v } : p));
    ctx.toast("Price updated");
  });
  $("catalogRows").addEventListener("click", e => {
    if (!e.target.classList.contains("del")) return;
    ctx.updateCatalog(ctx.catalog().filter(p => p.id !== e.target.dataset.id));
    renderCatalog(); renderStores(); ctx.toast("Product removed");
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const p = {
      id: "p_" + Date.now().toString(36), name: F.name.value.trim(), category: F.category.value,
      w: Number(F.w.value), d: Number(F.d.value), price: Number(F.price.value),
      store: F.store.value, color: F.color.value, style: [F.style.value],
    };
    ctx.updateCatalog([p, ...ctx.catalog()]);
    form.reset(); fillSelects(); F.color.value = "#b6a2f0"; renderCatalog(); renderStores();
    ctx.toast("Product added");
  });

  // Store data import: JSON array or CSV with header name,category,w,d,price,style,color
  $("importBtn").addEventListener("click", () => {
    const file = $("importFile").files[0], msg = $("importMsg");
    msg.hidden = true;
    if (!file) { msg.textContent = "Choose a JSON or CSV product file first."; msg.hidden = false; return; }
    const storeId = $("importStore").value;
    const reader = new FileReader();
    reader.onload = () => {
      let rows = [];
      try {
        if (file.name.toLowerCase().endsWith(".json")) rows = JSON.parse(reader.result);
        else {
          const lines = reader.result.trim().split(/\r?\n/);
          const head = lines.shift().split(",").map(h => h.trim().toLowerCase());
          rows = lines.map(l => { const v = l.split(","); return Object.fromEntries(head.map((h, i) => [h, (v[i] || "").trim()])); });
        }
      } catch { msg.textContent = "The file could not be read. Check that it is valid JSON or CSV."; msg.hidden = false; return; }
      const valid = rows.filter(r => r.name && categories.includes(r.category) && Number(r.w) > 0 && Number(r.d) > 0 && Number(r.price) > 0)
        .map((r, i) => ({ id: `imp_${Date.now().toString(36)}_${i}`, name: r.name, category: r.category, w: +r.w, d: +r.d, price: +r.price,
          store: storeId, color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#b6a2f0", style: [STYLES[r.style] ? r.style : "modern"] }));
      if (!valid.length) { msg.textContent = "No valid products found. Required columns: name, category, w, d, price."; msg.hidden = false; return; }
      ctx.updateCatalog([...valid, ...ctx.catalog()]);
      ctx.updateStores(ctx.stores().map(s => s.id === storeId ? { ...s, updated: new Date().toISOString().slice(0, 10) } : s));
      renderCatalog(); renderStores();
      ctx.toast(`${valid.length} products imported`);
    };
    reader.readAsText(file);
  });

  $("resetData").addEventListener("click", () => {
    ctx.updateCatalog(DEFAULT_CATALOG.map(p => ({ ...p })));
    ctx.updateStores(DEFAULT_STORES.map(s => ({ ...s })));
    fillSelects(); renderCatalog(); renderStores(); ctx.toast("Demo data restored");
  });

  return { open() { fillSelects(); renderCatalog(); renderStores(); } };
}
