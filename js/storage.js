/* ============================================================================
   storage.js — Browser storage for the static prototype.
   localStorage stands in for the user account and the catalog database.
   Every call is guarded, because storage can be unavailable.
   ========================================================================= */

const KEYS = {
  profile: "ss_profile_v2",
  designs: "ss_designs_v2",
  catalog: "ss_catalog_v2",
  stores:  "ss_stores_v2",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

const loadProfile  = () => readJSON(KEYS.profile, null);
const saveProfile  = p => writeJSON(KEYS.profile, p);
const clearProfile = () => { try { localStorage.removeItem(KEYS.profile); } catch {} };

const loadCatalog = () => readJSON(KEYS.catalog, null) || DEFAULT_CATALOG.map(p => ({ ...p }));
const saveCatalog = c => writeJSON(KEYS.catalog, c);
const loadStores  = () => readJSON(KEYS.stores, null) || DEFAULT_STORES.map(s => ({ ...s }));
const saveStores  = s => writeJSON(KEYS.stores, s);

function saveDesign(design) {
  const all = readJSON(KEYS.designs, []);
  all.unshift({ ...design, savedAt: new Date().toISOString() });
  return writeJSON(KEYS.designs, all.slice(0, 20));
}
const loadDesigns = () => readJSON(KEYS.designs, []);

/** Download the shopping list as a CSV file (opens in Excel). */
function exportShoppingCSV(design, stores) {
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Category", "Product", "Size (cm)", "Store", "Price (SAR)", "Link"]];
  design.items.forEach(i => {
    const s = stores.find(x => x.id === i.store) || {};
    rows.push([i.category, i.name, `${i.w} x ${i.d}`, s.name || "", i.price, `${s.url || ""}/p/${i.id}`]);
  });
  rows.push(["", "", "", "Total", design.items.reduce((t, i) => t + i.price, 0), ""]);
  const csv = "\uFEFF" + rows.map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `smartspace-shopping-list-${Date.now()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
