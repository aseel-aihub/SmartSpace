/* ============================================================================
   orders.js — SmartSpace as the intermediary between the user and the stores
   (To-Be: "Place order and pay" → "Process payment and send order to stores"
   → store "Receive order and check availability" → "Prepare and deliver
   order" or "Notify unavailable items" → "Suggest alternatives").

   Prototype only: no real payment is made and no card data is stored.
   ========================================================================= */

const ITEM_STEPS = ["sent", "preparing", "delivered"];
const STATUS_LABEL = {
  sent: "Sent to store", preparing: "Preparing", delivered: "Delivered",
  unavailable: "Unavailable", refunded: "Refunded",
};

const orderTotal = o => o.items.filter(i => i.status !== "refunded").reduce((s, i) => s + i.price, 0);
const newOrderId = () => "SS-" + Date.now().toString(36).toUpperCase().slice(-6);

function updateOrder(order) {
  const all = loadOrders().map(o => o.id === order.id ? order : o);
  saveOrders(all);
}

/** Create the order after a (simulated) successful payment. */
function createOrder(design, customer, payment) {
  const order = {
    id: newOrderId(), createdAt: new Date().toISOString(),
    customer, payment,
    ctx: design.ctx,
    items: design.items.map(i => ({ ...i, status: "sent", note: "" })),
    paid: design.items.reduce((s, i) => s + i.price, 0),
  };
  saveOrders([order, ...loadOrders()].slice(0, 30));
  return order;
}

/* ------------------------------ user: order status ------------------------------ */
function overallStatus(o) {
  const live = o.items.filter(i => i.status !== "refunded");
  if (live.some(i => i.status === "unavailable")) return "Action needed";
  if (live.length && live.every(i => i.status === "delivered")) return "Delivered";
  if (live.some(i => i.status === "preparing" || i.status === "delivered")) return "In progress";
  return "Paid, sent to stores";
}

function groupByStore(items) {
  const g = {};
  items.forEach(i => { (g[i.store] = g[i.store] || []).push(i); });
  return g;
}

function trackFor(items) {
  const live = items.filter(i => i.status !== "refunded" && i.status !== "unavailable");
  const reached = live.length ? Math.min(...live.map(i => ITEM_STEPS.indexOf(i.status))) : -1;
  return ["Paid", ...ITEM_STEPS.map(s => STATUS_LABEL[s])]
    .map((label, k) => `<span class="${k === 0 || k - 1 <= reached ? "on" : ""}">${label}</span>`).join("");
}

function renderOrderView(order) {
  const body = $("orderBody");
  if (!order) {
    $("orderMeta").textContent = "";
    body.innerHTML = `<p class="empty">You have no orders yet. Approve a design and place an order to see it here.</p>`;
    return;
  }
  const paidWith = { card: `Mada / Card ending ${order.payment.last4}`, apple: "Apple Pay", cod: "Cash on delivery" }[order.payment.method];
  $("orderMeta").innerHTML = `Order <span class="order-id">${order.id}</span> · ${overallStatus(order)} · ${paidWith}`;
  const groups = groupByStore(order.items);
  const unavailable = order.items.filter(i => i.status === "unavailable");
  body.innerHTML = `
    ${unavailable.length ? `<div class="notice">${unavailable.length} item${unavailable.length > 1 ? "s are" : " is"} not available at the store. Choose an alternative or get a refund for ${unavailable.length > 1 ? "them" : "it"}.</div>` : ""}
    ${Object.entries(groups).map(([sid, items]) => `
      <div class="store-group">
        <h3><span>${storeOf(sid).name}</span><span class="track">${trackFor(items)}</span></h3>
        <table class="shop-table"><tbody>
          ${items.map(i => `
            <tr>
              <td><strong>${i.name}</strong>${i.note ? `<br><span class="muted small">${i.note}</span>` : ""}</td>
              <td><span class="status ${i.status}">${STATUS_LABEL[i.status]}</span></td>
              <td class="num">${fmt(i.price)}</td>
              <td class="num">${i.status === "unavailable" ? `
                <button class="mini-btn" data-alt="${i.uid}">Choose alternative</button>
                <button class="mini-btn warn" data-refund="${i.uid}">Refund</button>` : ""}</td>
            </tr>`).join("")}
        </tbody></table>
      </div>`).join("")}
    <div class="sum-row"><span>Paid</span><span>${fmt(order.paid)}</span></div>
    <div class="sum-row total"><span>Current order total</span><span>${fmt(orderTotal(order))}</span></div>
    <p class="muted small" style="margin-top:.6rem">Ship to ${order.customer.name}, ${order.customer.city}. Status updates come from each store through the Store portal.</p>`;

  body.querySelectorAll("[data-refund]").forEach(b => b.addEventListener("click", () => {
    const it = order.items.find(i => String(i.uid) === b.dataset.refund);
    it.status = "refunded"; it.note = `Refund of ${fmt(it.price)} issued (simulated).`;
    updateOrder(order); renderOrderView(order); toast("Refund issued");
  }));
  body.querySelectorAll("[data-alt]").forEach(b => b.addEventListener("click", () => {
    const it = order.items.find(i => String(i.uid) === b.dataset.alt);
    openOrderAlternatives(order, it);
  }));
}

function openOrderAlternatives(order, item) {
  const alts = suggestAlternatives(state.catalog, item, order.ctx, orderTotal(order));
  $("altTitle").textContent = `Alternatives for ${item.category.toLowerCase()}`;
  $("altNote").textContent = alts.length
    ? `${item.name} is not available. These fit your room and keep the order within ${fmt(order.ctx.budget)}.`
    : `No other ${item.category.toLowerCase()} fits your room and budget. You can refund this item instead.`;
  $("altList").innerHTML = alts.map(a => `
    <li><button data-id="${a.id}">
      <span class="sw" style="width:12px;height:12px;border-radius:50%;background:${a.color}"></span>
      <span><strong>${a.name}</strong><br><span class="muted small">${storeOf(a.store).name}, ${a.w} × ${a.d} cm</span></span>
      <strong>${fmt(a.price)}</strong>
    </button></li>`).join("");
  $("altList").onclick = e => {
    const btn = e.target.closest("button[data-id]"); if (!btn) return;
    const alt = alts.find(a => a.id === btn.dataset.id);
    const diff = alt.price - item.price;
    const idx = order.items.findIndex(i => i.uid === item.uid);
    order.items[idx] = { ...alt, uid: item.uid, x: item.x, y: item.y, status: "sent",
      note: `Replaces ${item.name}. ${diff > 0 ? `Extra ${fmt(diff)} charged` : diff < 0 ? `${fmt(-diff)} refunded` : "Same price"} (simulated).` };
    order.paid += Math.max(0, diff);
    updateOrder(order);
    $("altDialog").close();
    renderOrderView(order);
    toast("Alternative ordered and sent to the store");
  };
  $("altDialog").showModal();
}

/* ------------------------------ store portal ------------------------------ */
function renderStorePortal(storeId) {
  const box = $("storeOrders");
  const orders = loadOrders().filter(o => o.items.some(i => i.store === storeId));
  if (!orders.length) { box.innerHTML = `<p class="empty">No orders for this store yet.</p>`; return; }
  box.innerHTML = orders.map(o => {
    const mine = o.items.filter(i => i.store === storeId);
    const canConfirm = mine.some(i => i.status === "sent");
    const canDeliver = mine.some(i => i.status === "preparing");
    return `
      <div class="store-group" data-order="${o.id}">
        <h3><span>Order <span class="order-id">${o.id}</span> · ${o.customer.city}</span>
          <span class="row-btns">
            ${canConfirm ? `<button class="mini-btn" data-act="confirm">Confirm available items</button>` : ""}
            ${canDeliver ? `<button class="mini-btn" data-act="deliver">Mark as delivered</button>` : ""}
          </span></h3>
        <table class="shop-table"><tbody>
          ${mine.map(i => `
            <tr>
              <td><strong>${i.name}</strong><br><span class="muted small">${i.category}, ${i.w} × ${i.d} cm</span></td>
              <td><span class="status ${i.status}">${STATUS_LABEL[i.status]}</span></td>
              <td class="num">${fmt(i.price)}</td>
              <td class="num">${i.status === "sent" ? `<button class="mini-btn warn" data-unav="${i.uid}">Not available</button>` : ""}</td>
            </tr>`).join("")}
        </tbody></table>
      </div>`;
  }).join("");

  box.querySelectorAll(".store-group").forEach(g => {
    const order = loadOrders().find(o => o.id === g.dataset.order);
    const save = msg => { updateOrder(order); renderStorePortal(storeId); toast(msg); };
    g.querySelectorAll("[data-act=confirm]").forEach(b => b.addEventListener("click", () => {
      order.items.forEach(i => { if (i.store === storeId && i.status === "sent") i.status = "preparing"; });
      save("Items confirmed. The customer has been notified");
    }));
    g.querySelectorAll("[data-act=deliver]").forEach(b => b.addEventListener("click", () => {
      order.items.forEach(i => { if (i.store === storeId && i.status === "preparing") i.status = "delivered"; });
      save("Marked as delivered. The customer has been notified");
    }));
    g.querySelectorAll("[data-unav]").forEach(b => b.addEventListener("click", () => {
      const it = order.items.find(i => String(i.uid) === b.dataset.unav);
      it.status = "unavailable";
      save("SmartSpace has been notified and will suggest alternatives");
    }));
  });
}
