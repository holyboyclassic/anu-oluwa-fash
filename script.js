const THEME_KEY = 'aanu-theme';
const CART_KEY = 'aanu-cart';

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function createCartMessage(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 0 ? 15000 : 0;
  const total = subtotal + delivery;

  const lines = items.map((item) => `${item.name} x${item.quantity} - ${formatMoney(item.price * item.quantity)}`);
  const list = lines.length ? lines.join('\n') : 'No items added';

  return `Hello Àánú-Olúwa, I would like to place this order.\n\n${list}\n\nSubtotal: ${formatMoney(subtotal)}\nDelivery: ${formatMoney(delivery)}\nTotal: ${formatMoney(total)}`;
}

function applyTheme(theme) {
  const resolvedTheme = theme === 'light' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', resolvedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = resolvedTheme === 'light' ? 'Dark mode' : 'Light mode';
  }
}

function renderCart() {
  const items = getCart();
  const cartItems = document.getElementById('cartItems');
  const subtotalValue = document.getElementById('subtotalValue');
  const deliveryValue = document.getElementById('deliveryValue');
  const totalValue = document.getElementById('totalValue');
  const cartCount = document.getElementById('cartCount');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 0 ? 15000 : 0;
  const total = subtotal + delivery;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  if (subtotalValue) subtotalValue.textContent = formatMoney(subtotal);
  if (deliveryValue) deliveryValue.textContent = formatMoney(delivery);
  if (totalValue) totalValue.textContent = formatMoney(total);
  if (cartCount) cartCount.textContent = String(count);

  if (!cartItems) return;

  if (!items.length) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item" data-name="${item.name}">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <small>${formatMoney(item.price)} each</small>
          </div>
          <div class="cart-item-actions">
            <button class="quantity-btn decrease" data-name="${item.name}" type="button" aria-label="Decrease quantity">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn increase" data-name="${item.name}" type="button" aria-label="Increase quantity">+</button>
          </div>
        </div>
      `
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.navlinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const needle = document.getElementById('tapeNeedle');
  const readout = document.getElementById('tapeReadout');
  const ticks = document.getElementById('tapeTicks');

  function updateTape() {
    if (!needle || !readout || !ticks) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    const railHeight = ticks.clientHeight;

    needle.style.top = `${pct * railHeight}px`;
    readout.textContent = `${Math.round(pct * 320)} inches MEASURED`;
  }

  window.addEventListener('scroll', updateTape, { passive: true });
  window.addEventListener('resize', updateTape);
  updateTape();

  renderCart();

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (!card) return;

      const name = card.dataset.name;
      const price = Number(card.dataset.price || 0);
      const items = getCart();
      const existingItem = items.find((item) => item.name === name);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        items.push({ name, price, quantity: 1 });
      }

      saveCart(items);
      renderCart();
    });
  });

  const cartItemsContainer = document.getElementById('cartItems');
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (event) => {
      const targetButton = event.target.closest('.quantity-btn');
      if (!targetButton) return;

      const name = targetButton.dataset.name;
      const items = getCart();
      const item = items.find((entry) => entry.name === name);

      if (!item) return;

      if (targetButton.classList.contains('increase')) {
        item.quantity += 1;
      } else {
        item.quantity -= 1;
      }

      const remainingItems = item.quantity <= 0
        ? items.filter((entry) => entry.name !== name)
        : items;

      saveCart(remainingItems);
      renderCart();
    });
  }

  const clearCartButton = document.querySelector('.clear-cart');
  if (clearCartButton) {
    clearCartButton.addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
  }

  const checkoutButton = document.querySelector('.checkout-btn');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      const items = getCart();

      if (!items.length) {
        alert('Your cart is empty. Add a product before checking out.');
        return;
      }

      const whatsappNumber = '2347048902618';
      const message = encodeURIComponent(createCartMessage(items));
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    });
  }

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = document.getElementById('clientName')?.value.trim();
      const phone = document.getElementById('clientPhone')?.value.trim();
      const garment = document.getElementById('garmentType')?.value.trim();
      const occasionDate = document.getElementById('occasionDate')?.value.trim();

      if (!name || !phone || !garment || !occasionDate) {
        alert('Please complete all booking form fields before sending your request.');
        return;
      }

      const whatsappNumber = '2347048902618';
      const message = encodeURIComponent(
        `Hello Àánú-Olúwa, I would like to request a consultation.\n\nName: ${name}\nPhone: ${phone}\nGarment: ${garment}\nOccasion date: ${occasionDate}`
      );

      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    });
  }
});
