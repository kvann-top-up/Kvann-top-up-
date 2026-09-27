let state = {
  game: "freefire",
  packages: [],
  selectedPackage: null,
  payment: "khqr"
};

const $ = id => document.getElementById(id);

async function selectGame(game) {
  state.game = game;
  document.querySelectorAll(".game-card").forEach(c => c.classList.toggle("active", c.dataset.game === game));
  const data = await fetch(`/api/games`).then(r => r.json());
  $("checkoutGame").textContent = data[game].name;
  $("unitBadge").textContent = data[game].unit.toUpperCase();
  await loadPackages();
}

async function loadPackages() {
  const list = await fetch(`/api/packages/${state.game}`).then(r => r.json());
  state.packages = list;
  state.selectedPackage = list[0];
  renderPackages();
}

function renderPackages() {
  $("packages").innerHTML = state.packages.map((p, i) => `
    <button class="package ${i === 0 ? "active" : ""}" onclick="choosePackage('${p.id}')">
      <b>💎 ${p.amount.toLocaleString()}</b>
      <small>${p.currency} • $${p.price.toFixed(2)}</small>
    </button>
  `).join("");
  updateTotal();
}

function choosePackage(id) {
  state.selectedPackage = state.packages.find(p => p.id === id);
  document.querySelectorAll(".package").forEach((el, i) =>
    el.classList.toggle("active", state.packages[i].id === id)
  );
  updateTotal();
}

function updateTotal() {
  $("totalPrice").textContent = state.selectedPackage
    ? `$${state.selectedPackage.price.toFixed(2)}`
    : "$0.00";
}

document.querySelectorAll(".pay-method").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pay-method").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.payment = btn.dataset.pay;
  });
});

async function placeOrder() {
  const playerId = $("playerId").value.trim();
  if (!playerId) return alert("សូមបញ្ចូល Player ID ជាមុនសិន។");
  if (!state.selectedPackage) return alert("សូមជ្រើស Package។");

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      game: state.game,
      playerId,
      packageId: state.selectedPackage.id,
      paymentMethod: state.payment
    })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "មិនអាចបង្កើត Order បានទេ។");

  $("newOrderId").textContent = data.orderId;
  $("orderMessage").textContent =
    `${data.gameName} • ${data.package.amount.toLocaleString()} ${data.package.currency} • $${data.amount.toFixed(2)}`;
  $("orderDialog").showModal();
}

async function demoPay() {
  const id = $("newOrderId").textContent;
  const res = await fetch(`/api/orders/${id}/pay`, {method:"POST"});
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Payment failed");

  $("orderMessage").textContent =
    `Demo payment verified. Top-up status: ${data.topupStatus}`;
  setTimeout(() => trackById(id), 1300);
}

function openTrack() {
  $("trackDialog").showModal();
}

async function trackOrder() {
  const id = $("trackId").value.trim();
  await trackById(id);
}

async function trackById(id) {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
  const box = $("trackResult");
  if (!res.ok) {
    box.innerHTML = `<div class="status">❌ <b>រកមិនឃើញ Order</b><small>សូមពិនិត្យ Order ID ម្តងទៀត។</small></div>`;
    return;
  }
  const o = await res.json();
  box.innerHTML = `
    <div class="status">
      🎮 <b>${o.gameName}</b><br>
      💎 ${o.package.amount.toLocaleString()} ${o.package.currency}<br>
      🆔 ${o.playerId}<br>
      💳 ${o.status}<br>
      ⚡ Top-up: <b>${o.topupStatus}</b>
    </div>`;
}

selectGame("freefire");
