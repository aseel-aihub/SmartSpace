/* ============================================================================
   data.js — Prototype catalog and store data.

   IMPORTANT: every store, product, price, and link in this file is FICTIONAL.
   It stands in for the store data that, in the full system, is provided by
   furniture stores and imported by the administrator (use case: Store Data
   Sources). Prices are illustrative SAR values.
   ========================================================================= */

const DEFAULT_STORES = [
  { id: "s_cozy",   name: "CozyCraft Workshop", type: "Local",      city: "Riyadh",   source: "Product file (CSV)",  url: "https://cozycraft.example",   updated: "2026-10-20" },
  { id: "s_manzil", name: "Al-Manzil Home",     type: "Local",      city: "Jeddah",   source: "Product file (CSV)",  url: "https://almanzil.example",    updated: "2026-10-18" },
  { id: "s_nest",   name: "UrbanNest Studio",   type: "Local",      city: "Riyadh",   source: "Product file (JSON)", url: "https://urbannest.example",   updated: "2026-10-22" },
  { id: "s_nordic", name: "NordicLine",         type: "Commercial", city: "National", source: "API",                 url: "https://nordicline.example",  updated: "2026-10-29" },
  { id: "s_maison", name: "Maison Grande",      type: "Commercial", city: "National", source: "API",                 url: "https://maisongrande.example", updated: "2026-10-29" },
  { id: "s_diwan",  name: "Diwan Furnishings",  type: "Local",      city: "Dammam",   source: "Product file (CSV)",  url: "https://diwan.example",       updated: "2026-10-15" },
];

/* Product: footprint in cm (w × d), price in SAR, main colour, style tags. */
const DEFAULT_CATALOG = [
  // Bed
  { id:"bed_01", category:"Bed", name:"Haven Platform Bed (Queen)", w:160, d:200, price:1490, store:"s_manzil", color:"#8c9a8c", style:["modern","minimalist"] },
  { id:"bed_02", category:"Bed", name:"Simplea Bed Frame (Single)", w:100, d:200, price:690,  store:"s_cozy",   color:"#d8d1c4", style:["minimalist"] },
  { id:"bed_03", category:"Bed", name:"Chesterton Bed (Queen)",     w:165, d:210, price:2890, store:"s_maison", color:"#4a3527", style:["classic"] },
  { id:"bed_04", category:"Bed", name:"Najd Carved Bed (Queen)",    w:170, d:210, price:2390, store:"s_diwan",  color:"#7a4e2d", style:["gulf","classic"] },
  // Wardrobe
  { id:"wrd_01", category:"Wardrobe", name:"Slim 2-Door Wardrobe",  w:100, d:55, price:890,  store:"s_manzil", color:"#e6e1d8", style:["minimalist","modern"] },
  { id:"wrd_02", category:"Wardrobe", name:"Grand 3-Door Wardrobe", w:150, d:60, price:2190, store:"s_maison", color:"#4a3527", style:["classic"] },
  { id:"wrd_03", category:"Wardrobe", name:"Mashrabiya Wardrobe",   w:120, d:58, price:1790, store:"s_diwan",  color:"#8a5a34", style:["gulf"] },
  // Sofa
  { id:"sof_01", category:"Sofa", name:"Drift 2-Seater Sofa",       w:160, d:85, price:1290, store:"s_nest",   color:"#8fa3ad", style:["modern","minimalist"] },
  { id:"sof_02", category:"Sofa", name:"Nordika 3-Seater",          w:210, d:88, price:2590, store:"s_nordic", color:"#dcd6c9", style:["modern"] },
  { id:"sof_03", category:"Sofa", name:"Velvet Chesterfield Sofa",  w:200, d:90, price:3190, store:"s_maison", color:"#5b3a4a", style:["classic"] },
  { id:"sof_04", category:"Sofa", name:"Majlis Floor Seating Set",  w:240, d:80, price:1890, store:"s_diwan",  color:"#a3362f", style:["gulf"] },
  { id:"sof_05", category:"Sofa", name:"Compact Loveseat",          w:130, d:80, price:790,  store:"s_cozy",   color:"#5c6b73", style:["minimalist","modern"] },
  // Coffee table
  { id:"ctb_01", category:"Coffee Table", name:"Orbit Round Coffee Table", w:70,  d:70, price:349, store:"s_cozy",   color:"#c9a876", style:["minimalist","modern"] },
  { id:"ctb_02", category:"Coffee Table", name:"Marble-Top Coffee Table",  w:100, d:55, price:990, store:"s_maison", color:"#e9e6e1", style:["classic","modern"] },
  { id:"ctb_03", category:"Coffee Table", name:"Brass Tray Table",         w:65,  d:65, price:590, store:"s_diwan",  color:"#b88a3e", style:["gulf"] },
  // Chair
  { id:"chr_01", category:"Chair", name:"Bentwood Accent Chair", w:55, d:55, price:329, store:"s_cozy",   color:"#c9a876", style:["minimalist","modern"] },
  { id:"chr_02", category:"Chair", name:"Velvet Armchair",       w:70, d:75, price:990, store:"s_maison", color:"#6b4e34", style:["classic"] },
  { id:"chr_03", category:"Chair", name:"Mesh Task Chair",       w:60, d:60, price:590, store:"s_nordic", color:"#2b2f36", style:["modern"] },
  { id:"chr_04", category:"Chair", name:"Sadu Accent Chair",     w:65, d:65, price:690, store:"s_diwan",  color:"#9b3b2e", style:["gulf"] },
  // Desk
  { id:"dsk_01", category:"Desk", name:"Linea Compact Desk", w:100, d:55, price:429,  store:"s_cozy",   color:"#c9a876", style:["minimalist"] },
  { id:"dsk_02", category:"Desk", name:"Study Writing Desk", w:110, d:60, price:690,  store:"s_nordic", color:"#e8e2d6", style:["modern","minimalist"] },
  { id:"dsk_03", category:"Desk", name:"Executive Oak Desk", w:140, d:70, price:1690, store:"s_maison", color:"#7a5c3e", style:["classic"] },
  { id:"dsk_04", category:"Desk", name:"Carved Writing Desk", w:120, d:60, price:1190, store:"s_diwan", color:"#8a5a34", style:["gulf"] },
  // Dining
  { id:"dtb_01", category:"Dining Table", name:"Nordic Dining Table (4 seats)", w:130, d:80, price:1390, store:"s_nordic", color:"#e6ded2", style:["modern","minimalist"] },
  { id:"dtb_02", category:"Dining Table", name:"Farmhouse Table (6 seats)",     w:180, d:90, price:1990, store:"s_manzil", color:"#7a5c3e", style:["classic"] },
  { id:"dtb_03", category:"Dining Table", name:"Low Sufra Table",               w:150, d:90, price:990,  store:"s_diwan",  color:"#8a5a34", style:["gulf"] },
  { id:"dch_01", category:"Dining Chairs", name:"Dining Chairs (set of 4)",      w:100, d:50, price:890,  store:"s_nordic", color:"#d8d1c4", style:["modern","minimalist"] },
  { id:"dch_02", category:"Dining Chairs", name:"Upholstered Chairs (set of 4)", w:110, d:55, price:1590, store:"s_maison", color:"#6b4e34", style:["classic"] },
  { id:"dch_03", category:"Dining Chairs", name:"Floor Cushions (set of 6)",     w:120, d:60, price:690,  store:"s_diwan",  color:"#a3362f", style:["gulf"] },
  // Storage
  { id:"shf_01", category:"Bookshelf", name:"Ladder Shelf Unit",      w:70,  d:30, price:399,  store:"s_cozy",   color:"#d8d1c4", style:["minimalist","modern"] },
  { id:"shf_02", category:"Bookshelf", name:"Heritage Bookcase",      w:100, d:40, price:1290, store:"s_maison", color:"#4a3527", style:["classic"] },
  { id:"shf_03", category:"Bookshelf", name:"Arched Display Cabinet", w:90,  d:40, price:1090, store:"s_diwan",  color:"#8a5a34", style:["gulf"] },
  // Lighting
  { id:"lmp_01", category:"Lamp", name:"Arc Floor Lamp",     w:30, d:30, price:259, store:"s_nest",   color:"#2b2f36", style:["modern"] },
  { id:"lmp_02", category:"Lamp", name:"Paper Globe Lamp",   w:35, d:35, price:159, store:"s_nest",   color:"#e8e2d6", style:["minimalist"] },
  { id:"lmp_03", category:"Lamp", name:"Brass Reading Lamp", w:25, d:25, price:449, store:"s_maison", color:"#c9a876", style:["classic"] },
  { id:"lmp_04", category:"Lamp", name:"Fanoos Lantern",     w:30, d:30, price:329, store:"s_diwan",  color:"#b88a3e", style:["gulf"] },
  // Rug
  { id:"rug_01", category:"Rug", name:"Minimal Grey Rug",    w:160, d:230, price:559,  store:"s_nordic", color:"#b7b0a3", style:["minimalist","modern"] },
  { id:"rug_02", category:"Rug", name:"Persian Pattern Rug", w:170, d:240, price:1290, store:"s_maison", color:"#7a2e2e", style:["classic","gulf"] },
  { id:"rug_03", category:"Rug", name:"Sadu Woven Rug",      w:160, d:230, price:790,  store:"s_diwan",  color:"#9b3b2e", style:["gulf"] },
  // Plant
  { id:"plt_01", category:"Plant", name:"Potted Monstera", w:40, d:40, price:129, store:"s_nest",   color:"#4a7a4a", style:["modern","minimalist"] },
  { id:"plt_02", category:"Plant", name:"Olive Tree",      w:45, d:45, price:259, store:"s_manzil", color:"#6b7f4a", style:["classic","gulf"] },
];

/* Furniture needed for each room type, in priority order. */
const ROOM_TYPES = {
  bedroom: { label: "Bedroom",     categories: ["Bed", "Wardrobe", "Desk", "Chair", "Rug", "Lamp", "Plant"] },
  living:  { label: "Living room", categories: ["Sofa", "Coffee Table", "Chair", "Rug", "Bookshelf", "Lamp", "Plant"] },
  office:  { label: "Home office", categories: ["Desk", "Chair", "Bookshelf", "Lamp", "Rug", "Plant"] },
  dining:  { label: "Dining room", categories: ["Dining Table", "Dining Chairs", "Rug", "Lamp", "Plant"] },
};

/* Styles offered to the user — the same options used in the questionnaire. */
const STYLES = {
  modern:     "Modern",
  gulf:       "Gulf Arabic",
  classic:    "Classic",
  minimalist: "Minimalist",
};

/* Floor-covering categories may sit under other furniture without counting as overlap. */
const FLOOR_LAYERS = ["Rug"];
