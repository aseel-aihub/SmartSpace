/* ============================================================================
   layout.js — 2D room plan (To-Be: "Build 2D layout and check fit and total
   cost"). Furniture keeps its real cm size and is scaled with the room.
   ========================================================================= */

let PX_PER_CM = 1;

/** Pick a scale so the whole room fits the available frame. */
function setScale(roomWcm, roomLcm, frameW, frameH) {
  PX_PER_CM = Math.max(0.6, Math.min(frameW / roomWcm, frameH / roomLcm));
  return PX_PER_CM;
}
const cm = v => v * PX_PER_CM;

/**
 * Place items: floor layers (rugs) in the middle, everything else packed
 * along the walls row by row. Positions are stored in cm so they survive
 * resizing. Sets .x/.y (cm) and .fits on each item.
 */
function autoPlace(items, roomW, roomL) {
  const PAD = 10;
  items.filter(i => FLOOR_LAYERS.includes(i.category)).forEach(r => {
    r.x = Math.max(0, (roomW - r.w) / 2);
    r.y = Math.max(0, (roomL - r.d) / 2);
    r.fits = r.w <= roomW && r.d <= roomL;
  });
  let x = PAD, y = PAD, rowMax = 0;
  items.filter(i => !FLOOR_LAYERS.includes(i.category)).forEach(i => {
    if (x + i.w + PAD > roomW) { x = PAD; y += rowMax + PAD; rowMax = 0; }
    if (y + i.d + PAD > roomL) { i.fits = false; i.x = PAD; i.y = PAD; return; }
    i.fits = true; i.x = x; i.y = y;
    x += i.w + PAD; rowMax = Math.max(rowMax, i.d);
  });
  return items;
}

function overlaps(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.d <= b.y || b.y + b.d <= a.y);
}

/** Flag furniture that overlaps other furniture or sits outside the room. */
function checkLayout(items, roomW, roomL) {
  const solid = items.filter(i => !FLOOR_LAYERS.includes(i.category));
  items.forEach(i => {
    i._clash = false;
    i._outside = i.x < 0 || i.y < 0 || i.x + i.w > roomW + 0.5 || i.y + i.d > roomL + 0.5;
  });
  for (let a = 0; a < solid.length; a++)
    for (let b = a + 1; b < solid.length; b++)
      if (overlaps(solid[a], solid[b])) { solid[a]._clash = true; solid[b]._clash = true; }
  return items.filter(i => i._clash || i._outside).length;
}

/** Pointer dragging, clamped to the room, reported in cm. */
function makeDraggable(el, item, roomW, roomL, onMove) {
  let sx, sy, ox, oy, on = false;
  el.addEventListener("pointerdown", e => {
    on = true; el.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; ox = item.x; oy = item.y;
    el.classList.add("dragging");
  });
  el.addEventListener("pointermove", e => {
    if (!on) return;
    item.x = Math.min(Math.max(ox + (e.clientX - sx) / PX_PER_CM, 0), Math.max(0, roomW - item.w));
    item.y = Math.min(Math.max(oy + (e.clientY - sy) / PX_PER_CM, 0), Math.max(0, roomL - item.d));
    el.style.left = cm(item.x) + "px"; el.style.top = cm(item.y) + "px";
    onMove(false);
  });
  const end = e => { if (!on) return; on = false; el.classList.remove("dragging"); el.releasePointerCapture(e.pointerId); onMove(true); };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  // Keyboard nudging for accessibility (arrow keys move 10 cm).
  el.addEventListener("keydown", e => {
    const step = 10, k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!k) return;
    e.preventDefault();
    item.x = Math.min(Math.max(item.x + k[0], 0), Math.max(0, roomW - item.w));
    item.y = Math.min(Math.max(item.y + k[1], 0), Math.max(0, roomL - item.d));
    el.style.left = cm(item.x) + "px"; el.style.top = cm(item.y) + "px";
    onMove(true);
  });
}
