// app.js — lógica del catálogo, carrito y armado del pedido por WhatsApp
(function () {
  "use strict";

  const CART_KEY = "tulugarfit_cart_v1";
  const state = {
    query: "",
    categoria: "Todos",
    cart: loadCart(), // { [productId]: qty }
  };

  const el = {
    grid: document.getElementById("productGrid"),
    noResults: document.getElementById("noResults"),
    resultsCount: document.getElementById("resultsCount"),
    searchInput: document.getElementById("searchInput"),
    chips: document.getElementById("categoryChips"),
    cartFab: document.getElementById("cartFab"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartClose: document.getElementById("cartClose"),
    cartItems: document.getElementById("cartItems"),
    cartEmptyMsg: document.getElementById("cartEmptyMsg"),
    cartSummaryTotal: document.getElementById("cartSummaryTotal"),
    cartForm: document.getElementById("cartForm"),
    productCardTemplate: document.getElementById("productCardTemplate"),
    cartItemTemplate: document.getElementById("cartItemTemplate"),
  };

  const productsById = new Map(PRODUCTOS.map((p) => [p.id, p]));

  function money(n) {
    return "$" + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (e) {
      /* ignorar si localStorage no está disponible */
    }
  }

  function unitLabel(unidad) {
    if (unidad === "par") return "Precio por par";
    if (unidad === "unidad") return "Precio por unidad";
    return null;
  }

  // ---------- Header / footer / config ----------
  function initConfig() {
    document.title = `${CONFIG.nombreNegocio} — Equipamiento de gimnasio y artículos deportivos`;

    const waMsgDefault = encodeURIComponent(
      `¡Hola! Vi el catálogo de ${CONFIG.nombreNegocio} y quería consultar por unos productos.`
    );
    document.getElementById(
      "headerWhatsapp"
    ).href = `https://wa.me/${CONFIG.whatsappPrincipal}?text=${waMsgDefault}`;

    const wa1 = document.getElementById("footerWhatsapp1");
    wa1.href = `https://wa.me/${CONFIG.whatsappPrincipal}`;
    document.getElementById("wa1Display").textContent = CONFIG.whatsappPrincipalDisplay;

    const wa2 = document.getElementById("footerWhatsapp2");
    wa2.href = `https://wa.me/${CONFIG.whatsappSecundario}`;
    document.getElementById("wa2Display").textContent = CONFIG.whatsappSecundarioDisplay;

    const ig = document.getElementById("footerInstagram");
    ig.href = CONFIG.instagramUrl;
    document.getElementById("igDisplay").textContent = "@" + CONFIG.instagram;

    document.getElementById("priceDisclaimer").textContent = CONFIG.avisoPrecios;
  }

  // ---------- Chips de categoría ----------
  function initChips() {
    const cats = ["Todos", ...CATEGORIAS];
    el.chips.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="chip${c === state.categoria ? " active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join("");

    el.chips.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".chip");
      if (!btn) return;
      state.categoria = btn.dataset.cat;
      el.chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
      renderGrid();
    });
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------- Grilla de productos ----------
  function getFilteredProducts() {
    const q = state.query.trim().toLowerCase();
    return PRODUCTOS.filter((p) => {
      const matchesCat = state.categoria === "Todos" || p.categoria === state.categoria;
      const matchesQuery = !q || p.nombre.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }

  function renderGrid() {
    const list = getFilteredProducts();
    el.resultsCount.textContent = `${list.length} producto${list.length === 1 ? "" : "s"}`;
    el.grid.innerHTML = "";
    el.noResults.hidden = list.length !== 0;

    const frag = document.createDocumentFragment();
    for (const p of list) {
      frag.appendChild(buildProductCard(p));
    }
    el.grid.appendChild(frag);
  }

  function buildProductCard(p) {
    const node = el.productCardTemplate.content.firstElementChild.cloneNode(true);
    const img = node.querySelector(".product-image");
    img.src = p.imagen;
    img.alt = p.nombre;

    node.querySelector(".product-name").textContent = p.nombre;
    node.querySelector(".product-price").textContent = money(p.precio);

    const badge = node.querySelector(".product-unit-badge");
    const label = unitLabel(p.unidad);
    if (label) {
      badge.textContent = label;
      badge.hidden = false;
    }

    const qtyValue = node.querySelector(".qty-value");
    const minusBtn = node.querySelector(".qty-minus");
    const plusBtn = node.querySelector(".qty-plus");
    let qty = 1;

    minusBtn.addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      qtyValue.textContent = qty;
    });
    plusBtn.addEventListener("click", () => {
      qty = Math.min(99, qty + 1);
      qtyValue.textContent = qty;
    });

    node.querySelector(".btn-add").addEventListener("click", () => {
      addToCart(p.id, qty);
      qty = 1;
      qtyValue.textContent = qty;
    });

    return node;
  }

  // ---------- Carrito ----------
  function addToCart(id, qty) {
    state.cart[id] = (state.cart[id] || 0) + qty;
    saveCart();
    updateCartUI();
  }

  function setQty(id, qty) {
    if (qty <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = qty;
    }
    saveCart();
    updateCartUI();
  }

  function removeFromCart(id) {
    delete state.cart[id];
    saveCart();
    updateCartUI();
  }

  function cartEntries() {
    return Object.entries(state.cart)
      .map(([id, qty]) => ({ product: productsById.get(Number(id)), qty }))
      .filter((e) => e.product);
  }

  function cartTotalAmount() {
    return cartEntries().reduce((sum, e) => sum + e.product.precio * e.qty, 0);
  }

  function cartTotalItems() {
    return Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
  }

  function updateCartUI() {
    const totalItems = cartTotalItems();
    const totalAmount = cartTotalAmount();

    el.cartCount.textContent = totalItems;
    el.cartTotal.textContent = money(totalAmount);
    el.cartFab.classList.toggle("visible", totalItems > 0);
    el.cartSummaryTotal.textContent = money(totalAmount);

    const entries = cartEntries();
    el.cartItems.innerHTML = "";
    if (entries.length === 0) {
      el.cartItems.appendChild(el.cartEmptyMsg);
      el.cartEmptyMsg.hidden = false;
      return;
    }
    el.cartEmptyMsg.hidden = true;

    const frag = document.createDocumentFragment();
    for (const { product, qty } of entries) {
      frag.appendChild(buildCartItem(product, qty));
    }
    el.cartItems.appendChild(frag);
  }

  function buildCartItem(product, qty) {
    const node = el.cartItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".cart-item-image").src = product.imagen;
    node.querySelector(".cart-item-image").alt = product.nombre;
    node.querySelector(".cart-item-name").textContent = product.nombre;
    node.querySelector(".cart-item-unit-price").textContent = money(product.precio) + " c/u";

    const qtyValue = node.querySelector(".qty-value");
    qtyValue.textContent = qty;
    node.querySelector(".qty-minus").addEventListener("click", () => setQty(product.id, qty - 1));
    node.querySelector(".qty-plus").addEventListener("click", () => setQty(product.id, qty + 1));
    node.querySelector(".cart-item-subtotal").textContent = money(product.precio * qty);
    node.querySelector(".cart-item-remove").addEventListener("click", () => removeFromCart(product.id));

    return node;
  }

  // ---------- Abrir/cerrar carrito ----------
  function openCart() {
    el.cartOverlay.classList.add("open");
    el.cartDrawer.classList.add("open");
    el.cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    el.cartOverlay.classList.remove("open");
    el.cartDrawer.classList.remove("open");
    el.cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // ---------- Armar mensaje de WhatsApp ----------
  function buildWhatsappMessage(nombre, zona, comentario) {
    const entries = cartEntries();
    const lineas = entries.map(({ product, qty }) => {
      const subtotal = money(product.precio * qty);
      return `• ${product.nombre} x${qty} — ${subtotal}`;
    });

    let msg = `¡Hola! Quiero hacer un pedido en ${CONFIG.nombreNegocio} 🏋️\n\n`;
    msg += lineas.join("\n");
    msg += `\n\nTotal: ${money(cartTotalAmount())}\n\n`;
    msg += `Nombre: ${nombre}\n`;
    if (zona) msg += `Zona: ${zona}\n`;
    if (comentario) msg += `Comentario: ${comentario}\n`;
    return msg;
  }

  function initCartEvents() {
    el.cartFab.addEventListener("click", openCart);
    el.cartClose.addEventListener("click", closeCart);
    el.cartOverlay.addEventListener("click", closeCart);

    el.cartForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (cartTotalItems() === 0) return;

      const nombre = document.getElementById("clienteNombre").value.trim();
      const zona = document.getElementById("clienteZona").value.trim();
      const comentario = document.getElementById("clienteComentario").value.trim();

      if (!nombre) {
        document.getElementById("clienteNombre").focus();
        return;
      }

      const mensaje = buildWhatsappMessage(nombre, zona, comentario);
      const url = `https://wa.me/${CONFIG.whatsappPrincipal}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  // ---------- Búsqueda ----------
  function initSearch() {
    let timer = null;
    el.searchInput.addEventListener("input", (ev) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.query = ev.target.value;
        renderGrid();
      }, 120);
    });
  }

  // ---------- Init ----------
  function init() {
    initConfig();
    initChips();
    initSearch();
    initCartEvents();
    renderGrid();
    updateCartUI();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
