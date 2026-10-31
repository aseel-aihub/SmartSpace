/* ============================================================================
   match.js — Recommendation engine (To-Be: "Generate full-room
   recommendations", "Match items with products from multiple stores",
   "Suggest alternatives within budget and room size").

   A transparent, explainable weighted score is used instead of a trained
   model, in line with the report's scope (pre-trained models / simple rules
   in the prototype).
   ========================================================================= */

const WEIGHTS = { style: 0.6, color: 0.4 };

const STYLE_NEIGHBOURS = {
  modern:     ["minimalist"],
  minimalist: ["modern"],
  classic:    ["gulf"],
  gulf:       ["classic"],
};

/** Does a product footprint fit inside the room (either orientation)? */
function fitsRoom(p, roomWcm, roomLcm) {
  return (p.w <= roomWcm && p.d <= roomLcm) || (p.d <= roomWcm && p.w <= roomLcm);
}

/** Score 0..1 for one product against the chosen style and the room palette. */
function scoreProduct(p, styleTag, palette) {
  const styleScore = p.style.includes(styleTag) ? 1
    : (STYLE_NEIGHBOURS[styleTag] || []).some(s => p.style.includes(s)) ? 0.45 : 0;
  const dist = palette && palette.length ? Math.min(...palette.map(hex => colorDistance(hex, p.color))) : 200;
  const colorScore = Math.max(0, 1 - dist / 300);
  return styleScore * WEIGHTS.style + colorScore * WEIGHTS.color;
}

/** Ranked candidates for one category that physically fit the room. */
function rankCategory(catalog, category, ctx) {
  return catalog
    .filter(p => p.category === category && fitsRoom(p, ctx.roomW, ctx.roomL))
    .map(p => ({ ...p, _score: scoreProduct(p, ctx.styleTag, ctx.palette) }))
    .sort((a, b) => b._score - a._score);
}

/**
 * Build a full-room recommendation inside an exact budget.
 * 1. Take the best-scoring product for every needed category.
 * 2. While over budget, downgrade the item whose cheaper option loses the
 *    least score per riyal saved; if nothing can be downgraded, drop the
 *    lowest-priority category.
 * 3. Drop items until the furniture footprint is no more than 55% of the floor.
 * Returns { items, dropped: [{category, reason}] }.
 */
function buildRecommendation(catalog, ctx) {
  const categories = ROOM_TYPES[ctx.roomType].categories;
  const ranked = {};
  const dropped = [];
  let chosen = [];

  categories.forEach(cat => {
    const list = rankCategory(catalog, cat, ctx);
    if (!list.length) { dropped.push({ category: cat, reason: "no product fits the room size" }); return; }
    ranked[cat] = list;
    chosen.push({ cat, idx: 0 });
  });

  const total = () => chosen.reduce((s, c) => s + ranked[c.cat][c.idx].price, 0);

  while (total() > ctx.budget && chosen.length) {
    let best = null;
    chosen.forEach(c => {
      const cur = ranked[c.cat][c.idx];
      ranked[c.cat].forEach((alt, j) => {
        if (alt.price >= cur.price) return;
        const saved = cur.price - alt.price;
        const loss = cur._score - alt._score;
        const cost = loss / saved;
        if (!best || cost < best.cost) best = { c, j, cost };
      });
    });
    if (best) { best.c.idx = best.j; continue; }
    const removed = chosen.pop();
    dropped.push({ category: removed.cat, reason: "not enough budget left" });
  }

  const floor = ctx.roomW * ctx.roomL;
  const area = () => chosen.reduce((s, c) => {
    const p = ranked[c.cat][c.idx];
    return FLOOR_LAYERS.includes(p.category) ? s : s + p.w * p.d;
  }, 0);
  while (area() > floor * 0.55 && chosen.length > 1) {
    // Remove the lowest-priority piece that takes floor space (rugs can stay under furniture).
    let k = chosen.length - 1;
    while (k > 0 && FLOOR_LAYERS.includes(chosen[k].cat)) k--;
    if (k === 0) break;
    const [removed] = chosen.splice(k, 1);
    dropped.push({ category: removed.cat, reason: "not enough floor space" });
  }

  return { items: chosen.map(c => ranked[c.cat][c.idx]), dropped };
}

/**
 * Alternatives for one placed item: same category, fits the room, and keeps
 * the total cost within the budget once swapped in.
 */
function suggestAlternatives(catalog, item, ctx, currentTotal) {
  const roomLeft = ctx.budget - (currentTotal - item.price);
  return rankCategory(catalog, item.category, ctx)
    .filter(p => p.id !== item.id && p.price <= roomLeft)
    .slice(0, 4);
}
