// assets/js/customer_pos.js — Xử lý logic Giỏ hàng & Modal đặt món cho khách hàng

// Hàm lấy danh sách sản phẩm từ API
async function fetchProducts() {
    try {
        const res = await fetch('/cafe-pos/api/products.php');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('Lỗi khi tải danh sách sản phẩm:', e);
        return [];
    }
}

// Hàm định dạng tiền tệ sang VND (vi-VN)
function formatVND(n) { return new Intl.NumberFormat('vi-VN').format(n); }

// Hiệu ứng lan tỏa (Ripple effect) khi nhấp chuột vào các nút
function createRipple(el, ev, color) {
    if (!el) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    const circle = document.createElement('span');
    circle.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    circle.style.width = circle.style.height = size + 'px';
    const cx = (ev && ev.clientX) ? ev.clientX : (rect.left + rect.width / 2);
    const cy = (ev && ev.clientY) ? ev.clientY : (rect.top + rect.height / 2);
    circle.style.left = (cx - rect.left - size / 2) + 'px';
    circle.style.top = (cy - rect.top - size / 2) + 'px';
    if (color) circle.style.background = color;
    el.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
    setTimeout(() => { try { circle.remove(); } catch (e) {} }, 700);
}

// Khởi tạo mảng giỏ hàng toàn cục
let CART = [];
// Khóa lưu trữ giỏ hàng trong LocalStorage
function cartKey() { return 'cafe_pos_cart_guest'; }

// Tải dữ liệu giỏ hàng từ bộ nhớ trình duyệt
function loadCartFromStorage() {
    const key = cartKey();
    const stored = localStorage.getItem(key);
    if (stored) { try { CART = JSON.parse(stored); } catch (e) { CART = []; } }
}

// Lưu dữ liệu giỏ hàng hiện tại vào bộ nhớ trình duyệt
function saveCartToStorage() { localStorage.setItem(cartKey(), JSON.stringify(CART)); }

// Hàm khởi tạo ứng dụng khi trang web tải xong
async function init() {
    loadCartFromStorage(); // Nạp giỏ hàng cũ (nếu có)
    await loadProducts(); // Tải sản phẩm từ Server
    // Cập nhật số lượng đơn hàng đang chờ trên badge (nếu hàm tồn tại)
    try { if (typeof updatePendingBadge === 'function') updatePendingBadge(); } catch (e) { console.error(e); }
    if (document.getElementById('cart-items')) renderCart(); // Hiển thị giỏ hàng lên UI
    
    // Xử lý Tìm kiếm & Lọc sản phẩm
    let currentCategory = '';
    function applyFilters() {
        const q = document.getElementById('search').value.trim().toLowerCase();
        let filtered = window.ALL_PRODUCTS;
        // Lọc theo tên sản phẩm
        if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
        // Lọc theo danh mục sản phẩm
        if (currentCategory) filtered = filtered.filter(p => p.category === currentCategory);
        renderProducts(filtered);
    }
    
    // Gắn sự kiện khi nhập từ khóa tìm kiếm
    const s = document.getElementById('search');
    if (s) s.addEventListener('input', applyFilters);
    
    // Gắn sự kiện cho bộ lọc danh mục (custom select)
    const cf = document.getElementById('category-filter');
    if (cf) {
        const selected = cf.querySelector('.select-selected');
        const options = cf.querySelector('.select-options');
        selected.addEventListener('click', () => cf.classList.toggle('open'));
        options.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                currentCategory = e.target.dataset.value;
                selected.textContent = e.target.textContent;
                cf.classList.remove('open');
                applyFilters();
            }
        });
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (e) => { if (!cf.contains(e.target)) cf.classList.remove('open'); });
    }

    // Xử lý menu Cá nhân hóa giao diện
    const personalizeBtn = document.getElementById('personalize-btn');
    const personalizeMenu = document.getElementById('personalize-menu');
    if (personalizeBtn && personalizeMenu) {
        personalizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = personalizeMenu.style.display !== 'none';
            if (isVisible) {
                personalizeMenu.style.opacity = '0';
                personalizeMenu.style.transform = 'scale(0.9)';
                setTimeout(() => personalizeMenu.style.display = 'none', 200);
            } else {
                personalizeMenu.style.display = 'block';
                setTimeout(() => { personalizeMenu.style.opacity = '1'; personalizeMenu.style.transform = 'scale(1)'; }, 10);
            }
        });
        document.addEventListener('click', (e) => {
            if (!personalizeBtn.contains(e.target) && !personalizeMenu.contains(e.target)) {
                personalizeMenu.style.opacity = '0';
                personalizeMenu.style.transform = 'scale(0.9)';
                setTimeout(() => personalizeMenu.style.display = 'none', 200);
            }
        });
    }

    // Chuyển đổi Chế độ Sáng/Tối (Theme toggle)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
            themeToggle.innerHTML = '☀️ Chế độ sáng';
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.innerHTML = isDark ? '☀️ Chế độ sáng' : '🌙 Chế độ tối';
        });
    }

    // Xử lý thay đổi màu nền chủ đạo
    document.querySelectorAll('.bg-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const bg = btn.dataset.bg;
            let gradient;
            if (bg === 'default') gradient = 'linear-gradient(135deg, #faf8ff 0%, #f3e8ff 100%)';
            else if (bg === 'blue') gradient = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
            else if (bg === 'green') gradient = 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
            document.body.style.setProperty('--bg', gradient);
            localStorage.setItem('bg', bg);
        });
    });
    // Khôi phục màu nền đã lưu
    const savedBg = localStorage.getItem('bg') || 'default';
    const bgEl = document.querySelector(`.bg-option[data-bg="${savedBg}"]`);
    if(bgEl) bgEl.click();

    // Gắn sự kiện cho nút thanh toán chính
    const payBtn = document.getElementById('pay');
    if(payBtn) payBtn.onclick = pay;

    // Hiển thị trang web mượt mà sau khi nạp xong
    setTimeout(() => document.body.classList.add('loaded'), 100);
}

// Hàm tải và lưu trữ sản phẩm toàn cục
async function loadProducts() {
    const products = await fetchProducts();
    window.ALL_PRODUCTS = products;
    updateCartFromProducts(products); // Đồng bộ lại giá/tên trong giỏ hàng
    renderProducts(products); // Hiển thị sản phẩm lên UI
}

// Cập nhật số đơn hàng đang chờ (Badge) hiển thị trên thanh điều hướng
async function updatePendingBadge() {
    const badge = document.getElementById('status-badge');
    if (!badge) return;
    try {
        const res = await fetch('/cafe-pos/api/report.php?status=pending');
        if (!res.ok) return;
        const d = await res.json();
        const n = (d.orders && Array.isArray(d.orders)) ? d.orders.length : 0;
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : n;
            badge.style.display = 'inline-flex';
            if (n >= 10) badge.classList.add('small'); else badge.classList.remove('small');
            try { badge.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 240 }); } catch (e) {}
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {}
}

// Cập nhật thông tin giỏ hàng nếu dữ liệu sản phẩm từ Server thay đổi
function updateCartFromProducts(products) {
    CART.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) {
            item.name = p.name + (item.size ? ` (${item.size})` : '');
            item.price = p.price;
        }
    });
    if (document.getElementById('cart-items')) renderCart();
}

// Hiển thị danh sách thẻ sản phẩm lên màn hình
function renderProducts(list) {
    const container = document.getElementById('products');
    container.innerHTML = '';
    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Xử lý hiển thị ảnh mặc định nếu không có ảnh sản phẩm
        const imageHTML = p.image ? `<div style="width:100%;height:100px;background:url('${p.image}');background-size:cover;background-position:center;border-radius:8px 8px 0 0;"></div>` : `<div style="width:100%;height:100px;background:#f0f0f0;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:#999;font-size:32px;">🖼️</div>`;
        const isOutOfStock = p.stock <= 0;
        
        // Chuẩn bị dữ liệu JSON để truyền vào Modal khi click
        const pJson = JSON.stringify({id: p.id, name: p.name, price: p.price, stock: p.stock, description: p.description, category: p.category, size: p.size}).replace(/"/g, "&quot;");
        
        // Kiểm tra tình trạng kho để hiển thị nút tương ứng
        const buttonHTML = isOutOfStock ?
            `<button class="btn-buy out-of-stock" disabled>Hết hàng</button>`
            : `<button class="btn-buy" onclick="showOrderModal(event, ${pJson})">🛒 Chọn món</button>`;
        
        card.innerHTML = `
            ${imageHTML}
            <div style="padding:12px;">
              <div><strong>${p.name}${p.size ? ` (${p.size})` : ''}</strong></div>
              <div style="font-size:13px;color:#666;margin:4px 0 8px 0;">${formatVND(p.price)} VND</div>
              <div style="font-size:12px;color:#999;margin-bottom:10px;">Kho: ${p.stock}</div>
              ${buttonHTML}
            </div>
          `;
        container.appendChild(card);
    });
}

// Hàm thêm một sản phẩm vào mảng giỏ hàng
function addToCart(p) {
    const size = p.size || null;
    const item = CART.find(x => x.id === p.id && (x.size || null) === size);
    if (item) item.qty++;
    else CART.push({id: p.id, name: p.name, price: parseFloat(p.price), qty: 1, size: size, checked: true});
    renderCart();
}

// Hiển thị Modal chi tiết để khách hàng chọn số lượng và size
function showOrderModal(event, p) {
  const modal = document.createElement('div');
  modal.id = 'order-modal';
  modal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;opacity:0;transition:opacity 0.3s ease;`;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `background:white;border-radius:16px;padding:32px;max-width:500px;width:90%;box-shadow:0 20px 25px rgba(0,0,0,0.15);max-height:calc(100vh - 100px);overflow-y:auto;position:relative;`;
  
  dialog.innerHTML = `
    <h2 style="margin-top:0;color:#1f2937;">${p.name}</h2>
    <div style="background:#f3f4f6;padding:16px;border-radius:10px;margin-bottom:20px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Giá</div>
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${formatVND(p.price)} VND</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Mô tả</div>
      <div style="padding:12px;background:#f9f9f9;border-radius:8px;border-left:4px solid #6366f1;font-size:14px;color:#4b5563;line-height:1.6;">${p.description || 'Chưa có mô tả'}</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Kho còn: <strong style="color:#10b981;">${p.stock}</strong></div>
    </div>
    <div style="margin-bottom:20px;">
      <label style="font-size:14px;font-weight:600;color:#6b7280;display:block;margin-bottom:8px;">Số lượng</label>
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="qty-minus" style="padding:8px 12px;background:#fef3c7;border:none;border-radius:6px;cursor:pointer;font-weight:600;">-</button>
        <input id="qty-input" type="number" value="1" min="1" max="${p.stock}" style="width:60px;padding:8px;border:2px solid #e5e7eb;border-radius:6px;text-align:center;font-weight:600;">
        <button id="qty-plus" style="padding:8px 12px;background:#d1fae5;border:none;border-radius:6px;cursor:pointer;font-weight:600;">+</button>
      </div>
    </div>
    ${p.category === 'coffee' || p.category === 'milktea' ? `
    <div style="margin-bottom:20px;">
      <label style="font-size:14px;font-weight:600;color:#6b7280;display:block;margin-bottom:8px;">Size</label>
      <div class="size-wrap" style="position:relative;">
        <input type="hidden" id="size-select" value="M">
        <div class="custom-size-select">
          <button type="button" class="custom-size-selected">M (Vừa)</button>
          <ul class="custom-size-options">
            <li data-value="S">S (Nhỏ)</li>
            <li data-value="M" class="selected">M (Vừa)</li>
            <li data-value="L">L (Lớn)</li>
          </ul>
        </div>
      </div>
    </div>` : ''}
    <div style="display:flex;gap:12px;">
      <button id="btn-add" style="flex:1;padding:12px;background:linear-gradient(135deg, #6366f1 0%, #818cf8 100%);color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:16px;">Thêm vào giỏ</button>
      <button id="btn-close" style="flex:1;padding:12px;background:#f3f4f6;border:2px solid #e5e7eb;border-radius:10px;font-weight:600;cursor:pointer;font-size:16px;">Đóng</button>
    </div>
  `;
  
  modal.appendChild(dialog);
  document.body.appendChild(modal);
  setTimeout(() => modal.style.opacity = '1', 10);

  // Gắn các sự kiện điều khiển trong Modal
  const btnAdd = document.getElementById('btn-add');
  const qtyInput = document.getElementById('qty-input');
  if (p.stock <= 0) { btnAdd.disabled = true; qtyInput.disabled = true; }
  document.getElementById('qty-minus').onclick = () => { if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1; };
  document.getElementById('qty-plus').onclick = () => { if (parseInt(qtyInput.value) < p.stock) qtyInput.value = parseInt(qtyInput.value) + 1; };
  document.getElementById('btn-close').onclick = () => { modal.style.opacity = '0'; setTimeout(() => document.body.removeChild(modal), 300); };
  
  // Xử lý khi nhấn "Thêm vào giỏ"
  btnAdd.onclick = () => {
      const qty = parseInt(qtyInput.value);
      if (qty > p.stock) return alert('Không đủ hàng!');
      const sizeEl = document.getElementById('size-select');
      const size = sizeEl ? sizeEl.value : null;
      const itemName = size ? `${p.name} (${size})` : p.name;
      // Thêm sản phẩm vào mảng CART theo số lượng đã chọn
      for (let i = 0; i < qty; i++) addToCart({id: p.id, name: itemName, price: p.price, size: size});
      modal.style.opacity = '0'; 
      setTimeout(() => document.body.removeChild(modal), 300);
  };
  // Đóng modal khi click ra vùng ngoài
  modal.onclick = (e) => { if (e.target === modal) document.getElementById('btn-close').click(); };
  
  // Logic xử lý UI cho dropdown Size tùy chỉnh
  setTimeout(() => {
      const hidden = document.getElementById('size-select');
      const custom = dialog.querySelector('.custom-size-select');
      if (hidden && custom) {
          const btn = custom.querySelector('.custom-size-selected');
          const opts = custom.querySelector('.custom-size-options');
          btn.onclick = (e) => { e.stopPropagation(); opts.style.maxHeight = opts.style.maxHeight === '200px' ? '0' : '200px'; opts.style.opacity = opts.style.opacity === '1' ? '0' : '1'; };
          opts.querySelectorAll('li').forEach(li => {
              li.onclick = () => { hidden.value = li.dataset.value; btn.textContent = li.textContent; opts.style.maxHeight = '0'; opts.style.opacity = '0'; };
          });
      }
  }, 50);
}

// Cập nhật giao diện danh sách giỏ hàng
function renderCart() {
  const ul = document.getElementById('cart-items');
  ul.innerHTML = '';
  let total = 0;
  
  CART.forEach((i, idx) => {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f9f9f9;border-radius:6px;margin-bottom:6px;transition: opacity 0.3s ease;';
    
    // Checkbox để chọn/bỏ chọn sản phẩm khi thanh toán
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = i.checked;
    checkbox.style.cssText = 'margin-right:8px;';
    checkbox.onchange = () => {
      i.checked = checkbox.checked;
      renderCart();
    };
    
    const info = document.createElement('span');
    let displayName = i.name || '';
    if (i.size && !displayName.includes('(' + i.size + ')')) displayName = (displayName ? displayName : '') + ` (${i.size})`;
    info.textContent = `${displayName} x ${i.qty} = ${formatVND(i.price * i.qty)} VND`;
    info.style.cssText = i.checked ? '' : 'opacity:0.5;text-decoration:line-through;';
    
    // Nút tăng/giảm/xóa trong giỏ hàng
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:4px;';
    
    const btnMinus = document.createElement('button');
    btnMinus.textContent = '-';
    btnMinus.style.cssText = 'padding:4px 8px;border:none;border-radius:4px;background:#fbbf24;cursor:pointer;font-size:12px;';
    btnMinus.onclick = () => {
      i.qty--;
      if(i.qty <= 0) {
        li.animate([{opacity: 1}, {opacity: 0}], {duration: 300}).addEventListener('finish', () => {
          CART.splice(idx, 1);
          renderCart();
        });
      } else {
        renderCart();
      }
    };
    
    const btnPlus = document.createElement('button');
    btnPlus.textContent = '+';

    // Kiểm tra tồn kho thời gian thực khi nhấn dấu + trong giỏ hàng
    const prod = window.ALL_PRODUCTS ? window.ALL_PRODUCTS.find(p => Number(p.id) === Number(i.id)) : null;
    const totalQtyForProduct = CART.reduce((sum, it) => (Number(it.id) === Number(i.id) ? sum + Number(it.qty) : sum), 0);
    const prodStock = prod ? Number(prod.stock) || 0 : 0;
    const available = prodStock - totalQtyForProduct;
    const canIncrease = prod && available > 0;
    
    btnPlus.style.cssText = `padding:4px 8px;border:none;border-radius:4px;background:#34d399;cursor:${canIncrease ? 'pointer' : 'not-allowed'};font-size:12px;opacity:${canIncrease ? 1 : 0.5};`;
    btnPlus.disabled = !canIncrease;
    btnPlus.onclick = () => {
      if (available <= 0) return alert('Hết hàng trong kho!');
      i.qty++;
      renderCart();
    };
    
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Xóa';
    btnDel.style.cssText = 'padding:4px 8px;border:none;border-radius:4px;background:#ef4444;cursor:pointer;font-size:12px;';
    btnDel.onclick = () => {
      li.animate([{opacity: 1}, {opacity: 0}], {duration: 300}).addEventListener('finish', () => {
        CART.splice(idx, 1);
        renderCart();
      });
    };
    
    buttons.appendChild(btnMinus);
    buttons.appendChild(btnPlus);
    buttons.appendChild(btnDel);
    
    li.appendChild(checkbox);
    li.appendChild(info);
    li.appendChild(buttons);
    ul.appendChild(li);
    
    // Cộng dồn tổng tiền nếu sản phẩm được tick chọn
    if (i.checked) total += i.price * i.qty;
  });
  
  document.getElementById('total').textContent = formatVND(total);
  
  // Hiệu ứng nhấp nháy cho nút thanh toán nếu có món được chọn
  const payBtn = document.getElementById('pay');
  const hasChecked = CART.some(i => i.checked);
  if (hasChecked) {
    payBtn.classList.add('pulse');
  } else {
    payBtn.classList.remove('pulse');
  }
  
  saveCartToStorage(); // Đồng bộ giỏ hàng vào LocalStorage
}

// Hàm bổ trợ để làm mới UI giỏ hàng
function updateCartDisplay() { renderCart(); }

// Xử lý quy trình Thanh toán / Đặt món
async function pay() {
  const checkedItems = CART.filter(i => i.checked);
  if (checkedItems.length === 0) return alert('Chưa chọn sản phẩm nào để thanh toán');

  // Tạo Modal xác nhận thông tin khách hàng
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;';
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:520px;width:92%;box-shadow:0 20px 40px rgba(0,0,0,0.2);';

  dialog.innerHTML = `
    <h3 style="margin-top:0;margin-bottom:8px">Xác nhận đặt món</h3>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <div style="flex:1;">
        <label style="font-size:13px;color:#6b7280;display:block;margin-bottom:6px">Tên khách hàng <span style="color:var(--danger);font-weight:700;margin-left:6px">*</span></label>
        <input id="pm_name" type="text" placeholder="Tên khách (bắt buộc)" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px;">
      </div>
      <div style="width:160px;">
        <label style="font-size:13px;color:#6b7280;display:block;margin-bottom:6px">SĐT <span style="color:var(--danger);font-weight:700;margin-left:6px">*</span></label>
        <input id="pm_phone" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="SĐT (bắt buộc, chỉ chữ số)" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px;">
      </div>
    </div>
    <div id="pm_msg" class="pm-error" style="display:none;margin-top:6px;"></div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
      <button id="pm_cancel" class="btn-secondary btn-danger" style="padding:10px 14px;color:white;">Hủy</button>
      <button id="pm_confirm" class="btn-primary" style="padding:10px 14px;">Xác nhận đặt ngay</button>
    </div>
  `;

  modal.appendChild(dialog);
  document.body.appendChild(modal);

  // Hiệu ứng Modal hiện lên
  setTimeout(()=>{ dialog.style.transition = 'all 180ms ease'; dialog.style.transform = 'scale(1)'; dialog.style.opacity = '1'; }, 10);

  const pmCancelBtn = dialog.querySelector('#pm_cancel');
  pmCancelBtn.addEventListener('click', (ev)=>{ createRipple(pmCancelBtn, ev, 'rgba(0,0,0,0.06)'); setTimeout(()=> document.body.removeChild(modal), 160); });
  const pmConfirmBtn = dialog.querySelector('#pm_confirm');
  const nameInput = dialog.querySelector('#pm_name');
  const phoneInput = dialog.querySelector('#pm_phone');
  const pmMsg = dialog.querySelector('#pm_msg');

  // Hàm kiểm tra tính hợp lệ của Form (Tên và SĐT)
  const validateForm = () => {
    const n = (nameInput.value || '').trim();
    const p = (phoneInput.value || '').trim();
    if (!n || !p) { pmMsg.style.display='block'; pmMsg.textContent='Vui lòng nhập tên và số điện thoại.'; nameInput.classList.toggle('input-error',!n); phoneInput.classList.toggle('input-error',!p); pmConfirmBtn.disabled=true; pmConfirmBtn.classList.remove('pulse'); return false; }
    if (!/^\d+$/.test(p)) { pmMsg.style.display='block'; pmMsg.textContent='Số điện thoại không hợp lệ.'; nameInput.classList.remove('input-error'); phoneInput.classList.add('input-error'); pmConfirmBtn.disabled=true; pmConfirmBtn.classList.remove('pulse'); return false; }
    pmMsg.style.display='none'; nameInput.classList.remove('input-error'); phoneInput.classList.remove('input-error'); pmConfirmBtn.disabled=false; pmConfirmBtn.classList.add('pulse'); return true;
  }; 
  pmConfirmBtn.disabled = true;
  nameInput.addEventListener('input', validateForm);
  // Chỉ cho phép nhập số vào ô SĐT
  phoneInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); validateForm(); });

  // Gửi đơn hàng lên Server khi nhấn Xác nhận
  pmConfirmBtn.addEventListener('click', async (ev)=>{
    createRipple(pmConfirmBtn, ev, 'rgba(255,255,255,0.14)');
    if (!validateForm()) return;
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const table_number = 0; // Mặc định là đơn mang về / không bàn

    try{
      const res = await fetch('/cafe-pos/api/orders.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ items: checkedItems, customer_name: name, customer_phone: phone, table_number: table_number }) });
      if(res.ok) {
          const data = await res.json();
          // Xóa các món đã đặt khỏi giỏ hàng
          CART = CART.filter(i => !i.checked);
          renderCart();
          document.body.removeChild(modal);
          alert('Đặt món thành công! Mã: ' + data.code);
          // Chuyển hướng khách hàng sang trang theo dõi đơn hàng
          window.location.href = '/cafe-pos/public/customer_status.php';
      } else {
          const err = await res.json();
          alert('Lỗi: ' + (err.error || 'Không thể gửi đơn'));
      }
    } catch(e) { alert('Lỗi kết nối'); }
  });
}

// Lắng nghe sự kiện tải trang hoàn tất để khởi chạy ứng dụng
window.addEventListener('DOMContentLoaded', init);