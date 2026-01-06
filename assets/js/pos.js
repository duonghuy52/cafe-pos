// pos.js — Logic xử lý giao diện Frontend cơ bản cho hệ thống POS
// Hàm lấy danh sách sản phẩm từ API
async function fetchProducts() {
    try {
        const res = await fetch('/api/products.php');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('Fetch products failed:', e);
        alert('Lỗi tải sản phẩm: ' + e.message);
        return [];
    }
}

// Định dạng số thành tiền tệ VND
function formatVND(n) { return new Intl.NumberFormat('vi-VN').format(n); }

// Hiển thị thông báo Toast (thông báo tạm thời phía dưới màn hình)
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 3000);
}

// Hàm hỗ trợ tạo hiệu ứng lan tỏa (ripple) khi nhấp chuột
function createRipple(el, ev, color) {
    if (!el) return;
    // Đảm bảo phần tử cha có thuộc tính position để chứa hiệu ứng
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    const circle = document.createElement('span');
    circle.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    circle.style.width = circle.style.height = size + 'px';
    const cx = (ev && ev.clientX) ? ev.clientX : (rect.left + rect.width / 2);
    const cy = (ev && ev.clientY) ? ev.clientY : (rect.top + rect.height / 2);
    const x = cx - rect.left - size / 2;
    const y = cy - rect.top - size / 2;
    circle.style.left = x + 'px';
    circle.style.top = y + 'px';
    if (color) circle.style.background = color;
    el.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
    // Xóa an toàn sau khi kết thúc hiệu ứng
    setTimeout(() => { try { circle.remove(); } catch (e) {} }, 700);
}

// Khởi tạo biến giỏ hàng toàn cục
let CART = [];

// Tạo khóa định danh cho giỏ hàng trong LocalStorage dựa trên người dùng
function cartKey() {
    try {
        const user = window.CAFE_POS_USER && window.CAFE_POS_USER.username ? window.CAFE_POS_USER.username : 'anon';
        return 'cafe_pos_cart_' + user;
    } catch (e) {
        return 'cafe_pos_cart_anon';
    }
}

// Tải dữ liệu giỏ hàng đã lưu từ LocalStorage
function loadCartFromStorage() {
    const key = cartKey();
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            CART = JSON.parse(stored);
        } catch (e) {
            CART = [];
        }
    }
}

// Lưu trạng thái giỏ hàng hiện tại vào LocalStorage
function saveCartToStorage() {
    const key = cartKey();
    localStorage.setItem(key, JSON.stringify(CART));
}

// Hàm khởi tạo chính của ứng dụng
async function init() {
    loadCartFromStorage();
    await loadProducts();
    // Cập nhật các huy hiệu (badge) thông báo đơn hàng chờ và hàng hết kho
    try { if (typeof updatePendingBadge === 'function') updatePendingBadge(); if (typeof updateAdminBadge === 'function') updateAdminBadge(); } catch (e) { console.error(e); }
    if (document.getElementById('cart-items')) renderCart();
    
    // Xử lý tìm kiếm và lọc danh mục
    let currentCategory = '';

    function applyFilters() {
        const q = document.getElementById('search').value.trim().toLowerCase();
        const cat = currentCategory;
        console.log('Filter - query:', q, 'category:', cat); // Debug
        let filtered = window.ALL_PRODUCTS;
        if (q) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
        }
        if (cat) {
            filtered = filtered.filter(p => p.category === cat);
            console.log('Filtered by category:', filtered); // Debug
        }
        renderProducts(filtered);
    }
    const s = document.getElementById('search');
    if (s) {
        s.addEventListener('input', applyFilters);
    }
    const cf = document.getElementById('category-filter');
    if (cf) {
        const selected = cf.querySelector('.select-selected');
        const options = cf.querySelector('.select-options');

        selected.addEventListener('click', () => {
            cf.classList.toggle('open');
        });

        options.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                currentCategory = e.target.dataset.value;
                selected.textContent = e.target.textContent;
                cf.classList.remove('open');
                applyFilters();
            }
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!cf.contains(e.target)) {
                cf.classList.remove('open');
            }
        });
    }

    // Tự động làm mới dữ liệu khi cửa sổ trình duyệt nhận lại tiêu điểm (ví dụ: khi quay lại từ trang quản trị)
    window.addEventListener('focus', async() => {
        await loadProducts();
        applyFilters();
        try { if (typeof updatePendingBadge === 'function') updatePendingBadge(); if (typeof updateAdminBadge === 'function') updateAdminBadge(); } catch (e) { console.error(e); }
    });

    // Các thiết lập cá nhân hóa (Menu Cá nhân hóa)
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
                setTimeout(() => {
                    personalizeMenu.style.opacity = '1';
                    personalizeMenu.style.transform = 'scale(1)';
                }, 10);
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

    // Chuyển đổi giao diện Sáng/Tối
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

    // Lựa chọn màu nền (Background options)
    document.querySelectorAll('.bg-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const bg = btn.dataset.bg;
            let gradient;
            if (bg === 'default') gradient = 'linear-gradient(135deg, #faf8ff 0%, #f3e8ff 100%)';
            else if (bg === 'blue') gradient = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
            else if (bg === 'green') gradient = 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
            document.body.style.setProperty('--bg', gradient);
            localStorage.setItem('bg', bg);
            // Cập nhật trạng thái active cho nút màu
            document.querySelectorAll('.bg-option').forEach(b => b.style.borderColor = 'transparent');
            btn.style.borderColor = '#6366f1';
        });
        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    });

    // Tải màu nền đã lưu
    const savedBg = localStorage.getItem('bg') || 'default';
    const bgEl = document.querySelector(`.bg-option[data-bg="${savedBg}"]`);
    if (bgEl) bgEl.click();

    // Hiệu ứng mờ dần (Fade out) khi chuyển trang qua các liên kết
    document.querySelectorAll('.topbar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        });
    });

    document.getElementById('pay').onclick = pay;

    // Hiển thị giao diện mượt mà sau khi tải xong
    setTimeout(() => document.body.classList.add('loaded'), 100);
}

// Hàm tải sản phẩm và bộ nhớ đệm (cache)
async function loadProducts() {
    const products = await fetchProducts();
    console.log('Products:', products); // Debug
    window.ALL_PRODUCTS = products; // lưu bộ nhớ đệm
    updateCartFromProducts(products);
    renderProducts(products);
}

// Cập nhật huy hiệu số đơn hàng đang chờ duyệt trên thanh điều hướng
async function updatePendingBadge() {
    const badge = document.getElementById('status-badge');
    if (!badge) return;
    try {
        const res = await fetch('/api/report.php?status=pending');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        const n = (d.orders && Array.isArray(d.orders)) ? d.orders.length : 0;
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : n;
            badge.style.display = 'inline-flex';
            if (n >= 10) badge.classList.add('small');
            else badge.classList.remove('small');
            try { badge.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 240 }); } catch (e) {}
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to update pending badge', e);
    }
}

// Cập nhật huy hiệu thông báo các sản phẩm hết hàng cho Admin
async function updateAdminBadge() {
    const badge = document.getElementById('admin-badge');
    if (!badge) return;
    try {
        let products = window.ALL_PRODUCTS;
        if (!products) {
            const res = await fetch('/api/products.php');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            products = await res.json();
            window.ALL_PRODUCTS = products;
        }
        const n = (products || []).filter(p => Number(p.stock) <= 0).length;
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : n;
            badge.style.display = 'inline-flex';
            if (n >= 10) badge.classList.add('small');
            else badge.classList.remove('small');
            try { badge.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 240 }); } catch (e) {}
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to update admin badge', e);
    }
}

// Đồng bộ hóa giỏ hàng dựa trên dữ liệu sản phẩm mới nhất
function updateCartFromProducts(products) {
    CART.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) {
            // Giữ lại phần hậu tố kích thước (size) nếu món hàng đã được chọn size
            item.name = p.name + (item.size ? ` (${item.size})` : '');
            item.price = p.price;
        }
    });
    if (document.getElementById('cart-items')) renderCart();
}

// Hàm hiển thị danh sách sản phẩm lên giao diện
function renderProducts(list) {
    const container = document.getElementById('products');
    container.classList.add('fade');
    setTimeout(() => {
        container.innerHTML = '';
        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const imageHTML = p.image ? `<div style="width:100%;height:100px;background:url('${p.image}');background-size:cover;background-position:center;border-radius:8px 8px 0 0;"></div>` : `<div style="width:100%;height:100px;background:#f0f0f0;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:#999;font-size:32px;">🖼️</div>`;
            const isOutOfStock = p.stock <= 0;
            const buttonHTML = isOutOfStock ?
                `<button class="btn-buy out-of-stock" onclick="showOrderModal(event, {id: ${p.id}, name: '${(p.name + (p.size ? ` (${p.size})` : '')).replace(/'/g, "\\'")}', price: ${p.price}, stock: ${p.stock}, description: '${(p.description || '').replace(/'/g, "\\'")}', category: '${p.category}'})">Hết hàng</button>`
                : `<button class="btn-buy" onclick="showOrderModal(event, {id: ${p.id}, name: '${(p.name + (p.size ? ` (${p.size})` : '')).replace(/'/g, "\\'")}', price: ${p.price}, stock: ${p.stock}, description: '${(p.description || '').replace(/'/g, "\\'")}', category: '${p.category}'})">🛒 Chọn món</button>`;
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
        container.classList.remove('fade');
    }, 150);
}

// Thêm sản phẩm vào giỏ hàng
function addToCart(p) {
    const size = p.size || null;
    const item = CART.find(x => x.id === p.id && (x.size || null) === size);
    if (item) item.qty++;
    else CART.push({ id: p.id, name: p.name, price: parseFloat(p.price), qty: 1, size: size, checked: true });
    renderCart();
}

// Hiển thị cửa sổ (modal) chọn chi tiết món ăn
function showOrderModal(event, p) {
    const card = event.target.closest('.product-card');
    // ... phần còn lại của hàm
    // Tạo modal HTML
    const modal = document.createElement('div');
    modal.id = 'order-modal';
    modal.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    z-index:1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
    background:white;
    border-radius:16px;
    padding:32px;
    max-width:500px;
    width:90%;
    box-shadow:0 20px 25px rgba(0,0,0,0.15);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  `;
    // Đảm bảo các phần tử con tuyệt đối được đặt theo dialog
    dialog.style.position = 'relative';

    dialog.innerHTML = `
    <h2 style="margin-top:0;color:#1f2937;">${p.name}</h2>
    
    <div style="background:#f3f4f6;padding:16px;border-radius:10px;margin-bottom:20px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Giá</div>
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${formatVND(p.price)} VND</div>
    </div>
    
    <div style="margin-bottom:20px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Mô tả</div>
      <div style="padding:12px;background:#f9f9f9;border-radius:8px;border-left:4px solid #6366f1;font-size:14px;color:#4b5563;line-height:1.6;">
        ${p.description || 'Chưa có mô tả'}
      </div>
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
    </div>
    ` : ''}
    
    <div style="display:flex;gap:12px;">
      <button id="btn-add" style="flex:1;padding:12px;background:linear-gradient(135deg, #6366f1 0%, #818cf8 100%);color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:16px;">Thêm vào giỏ</button>
      <button id="btn-close" style="flex:1;padding:12px;background:#f3f4f6;border:2px solid #e5e7eb;border-radius:10px;font-weight:600;cursor:pointer;font-size:16px;">Đóng</button>
    </div>
  `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // Hiệu ứng hiện ra
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);

    // Thiết lập bộ chọn kích thước tùy chỉnh (có hiệu ứng)
    setTimeout(() => {
        const hiddenSizeInput = document.getElementById('size-select'); // input ẩn lưu giá trị hiện tại
        const custom = dialog.querySelector('.custom-size-select');
        if (hiddenSizeInput && custom) {
            const btn = custom.querySelector('.custom-size-selected');
            const opts = custom.querySelector('.custom-size-options');
            let overlay = null;

            const removeOverlay = () => {
                if (overlay) {
                    const menu = overlay.querySelector('.size-overlay-list');
                    if (menu) {
                        menu.style.opacity = '0';
                        menu.style.transform = 'scale(0.9) translateY(-10px)';
                        setTimeout(() => {
                            try { document.body.removeChild(overlay); } catch (e) {}
                            overlay = null;
                        }, 200);
                    } else {
                        try { document.body.removeChild(overlay); } catch (e) {}
                        overlay = null;
                    }
                }
            };

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (overlay) { removeOverlay(); return; }
                // Xây dựng lớp phủ
                overlay = document.createElement('div');
                overlay.className = 'size-overlay';
                overlay.style.position = 'fixed';
                overlay.style.zIndex = 5000;
                overlay.style.left = '0';
                overlay.style.top = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.pointerEvents = 'auto';
                // Menu bên trong
                const menu = document.createElement('ul');
                menu.className = 'size-overlay-list';
                menu.style.listStyle = 'none';
                menu.style.margin = '0';
                menu.style.padding = '6px 4px';
                menu.style.background = 'white';
                menu.style.border = '2px solid #e5e7eb';
                menu.style.borderRadius = '8px';
                menu.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                menu.style.opacity = '0';
                menu.style.transform = 'scale(0.9) translateY(-10px)';
                menu.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                // Đổ dữ liệu từ các phần tử li có sẵn
                const items = Array.from(opts.querySelectorAll('li'));
                items.forEach(li => {
                    const it = document.createElement('li');
                    it.textContent = li.textContent;
                    it.dataset.value = li.dataset.value;
                    it.style.padding = '10px 12px';
                    it.style.cursor = 'pointer';
                    it.style.transition = 'background-color 0.15s ease';
                    it.addEventListener('mouseenter', () => it.style.backgroundColor = '#f3f4f6');
                    it.addEventListener('mouseleave', () => it.style.backgroundColor = 'transparent');
                    it.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        hiddenSizeInput.value = it.dataset.value;
                        btn.textContent = it.textContent;
                        // Hiệu ứng bao quanh ngắn gọn
                        const wrap = custom.closest('.size-wrap');
                        if (wrap) {
                            wrap.classList.add('size-open');
                            setTimeout(() => wrap.classList.remove('size-open'), 420);
                        }
                        removeOverlay();
                    });
                    menu.appendChild(it);
                });
                menu.style.position = 'fixed';
                overlay.appendChild(menu);
                document.body.appendChild(overlay);
                // Định vị menu dựa trên vị trí nút bấm
                const rect = btn.getBoundingClientRect();
                menu.style.left = rect.left + 'px';
                menu.style.top = (rect.bottom + 6) + 'px';
                menu.style.width = rect.width + 'px';
                menu.style.maxHeight = Math.min(200, window.innerHeight - rect.bottom - 16) + 'px';
                menu.style.overflow = 'auto';
                // Hiệu ứng hiện ra
                setTimeout(() => {
                    menu.style.opacity = '1';
                    menu.style.transform = 'scale(1) translateY(0)';
                }, 10);
                // Đóng khi nhấp bên ngoài/thay đổi kích thước/cuộn
                const outside = (ev) => { if (!menu.contains(ev.target)) removeOverlay(); };
                setTimeout(() => document.addEventListener('click', outside), 10);
                window.addEventListener('resize', removeOverlay);
                window.addEventListener('scroll', removeOverlay, true);
            });
            // Đảm bảo lớp phủ biến mất khi đóng modal
            const btnClose = document.getElementById('btn-close');
            if (btnClose) btnClose.addEventListener('click', () => removeOverlay());
        }
    }, 50);

    // Kiểm tra kho và vô hiệu hóa nút thêm nếu hết hàng
    const btnAdd = document.getElementById('btn-add');
    const qtyInput = document.getElementById('qty-input');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    if (p.stock <= 0) {
        btnAdd.textContent = 'Không thể thêm';
        btnAdd.style.background = '#ef4444';
        btnAdd.style.borderColor = '#ef4444';
        btnAdd.disabled = true;
        btnAdd.style.cursor = 'not-allowed';
        qtyInput.disabled = true;
        qtyMinus.disabled = true;
        qtyPlus.disabled = true;
    }

    // Các trình xử lý sự kiện số lượng
    document.getElementById('qty-minus').onclick = () => {
        if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    };
    document.getElementById('qty-plus').onclick = () => {
        if (parseInt(qtyInput.value) < p.stock) qtyInput.value = parseInt(qtyInput.value) + 1;
    };

    document.getElementById('btn-add').onclick = () => {
        if (p.stock <= 0) return alert('Sản phẩm đã hết hàng!');
        const qty = parseInt(qtyInput.value);
        if (qty > p.stock) return alert('Không đủ hàng trong kho!');
        const sizeEl = document.getElementById('size-select');
        const size = sizeEl ? sizeEl.value : null;
        const totalQtyForProduct = CART.reduce((sum, i) => i.id === p.id ? sum + i.qty : sum, 0);
        const available = p.stock - totalQtyForProduct;
        if (available <= 0) return alert('Đã có đủ số lượng sản phẩm này trong giỏ, không thể thêm nữa!');
        let actualQty = qty;
        if (actualQty > available) {
            actualQty = available;
            qtyInput.value = actualQty;
            alert(`Chỉ có thể thêm ${available} sản phẩm nữa.`);
        }
        const itemName = size ? `${p.name} (${size})` : p.name;
        for (let i = 0; i < actualQty; i++) {
            addToCart({ id: p.id, name: itemName, price: p.price, size: size });
        }
        // Đóng modal lặng lẽ (giỏ hàng đã được cập nhật qua addToCart)
        modal.style.opacity = '0';
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    document.getElementById('btn-close').onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => document.body.removeChild(modal), 300);
        }
    };
}

// Cập nhật hiển thị giỏ hàng
function renderCart() {
    const ul = document.getElementById('cart-items');
    ul.innerHTML = '';
    let total = 0;
    CART.forEach((i, idx) => {
        const li = document.createElement('li');
        li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f9f9f9;border-radius:6px;margin-bottom:6px;transition: opacity 0.3s ease;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = i.checked;
        checkbox.style.cssText = 'margin-right:8px;';
        checkbox.onchange = () => {
            i.checked = checkbox.checked;
            renderCart();
        };

        const info = document.createElement('span');
        // hiển thị size rõ ràng
        let displayName = i.name || '';
        if (i.size && !displayName.includes('(' + i.size + ')')) displayName = (displayName ? displayName : '') + ` (${i.size})`;
        info.textContent = `${displayName} x ${i.qty} = ${formatVND(i.price * i.qty)} VND`;
        info.style.cssText = i.checked ? '' : 'opacity:0.5;text-decoration:line-through;';

        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:4px;';

        const btnMinus = document.createElement('button');
        btnMinus.textContent = '-';
        btnMinus.style.cssText = 'padding:4px 8px;border:none;border-radius:4px;background:#fbbf24;cursor:pointer;font-size:12px;';
        btnMinus.onclick = () => {
            i.qty--;
            if (i.qty <= 0) {
                li.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).addEventListener('finish', () => {
                    CART.splice(idx, 1);
                    renderCart();
                });
            } else {
                renderCart();
            }
        };

        const btnPlus = document.createElement('button');
        btnPlus.textContent = '+';
        // tìm sản phẩm tương ứng (ép kiểu id về số)
        const prod = window.ALL_PRODUCTS.find(p => Number(p.id) === Number(i.id));
        // tính tổng số lượng của sản phẩm này đã có trong giỏ (tất cả các size)
        const totalQtyForProduct = CART.reduce((sum, it) => (Number(it.id) === Number(i.id) ? sum + Number(it.qty) : sum), 0);
        const prodStock = prod ? Number(prod.stock) || 0 : 0;
        const available = prodStock - totalQtyForProduct;
        const canIncrease = prod && available > 0;
        
        btnPlus.style.cssText = `padding:4px 8px;border:none;border-radius:4px;background:#34d399;cursor:${canIncrease ? 'pointer' : 'not-allowed'};font-size:12px;opacity:${canIncrease ? 1 : 0.5};`;
        // chỉ vô hiệu hóa khi biết chắc sản phẩm tồn tại và hết kho
        btnPlus.disabled = !!(prod && available <= 0);
        btnPlus.onclick = (e) => {
            // luôn kiểm tra lại dữ liệu mới nhất
            const prodNow = window.ALL_PRODUCTS.find(p => Number(p.id) === Number(i.id));
            const totalNow = CART.reduce((sum, it) => (Number(it.id) === Number(i.id) ? sum + Number(it.qty) : sum), 0);
            const prodStockNow = prodNow ? Number(prodNow.stock) || 0 : 0;
            const availableNow = prodStockNow - totalNow;
            console.debug('btnPlus click', { prodId: i.id, totalNow, stock: prodStockNow, availableNow });
            if (!prodNow) {
                alert('Thông tin sản phẩm chưa tải xong, thử lại sau.');
                return;
            }
            if (availableNow <= 0) {
                alert('Không thể thêm nữa, đã đạt giới hạn kho.');
                renderCart();
                return;
            }
            i.qty++;
            renderCart();
        };

        const btnDel = document.createElement('button');
        btnDel.textContent = 'Xóa';
        btnDel.style.cssText = 'padding:4px 8px;border:none;border-radius:4px;background:#ef4444;cursor:pointer;font-size:12px;';
        btnDel.onclick = () => {
            li.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).addEventListener('finish', () => {
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
        if (i.checked) total += i.price * i.qty;
    });
    document.getElementById('total').textContent = formatVND(total);
    // Hiệu ứng nhấp nháy cho nút thanh toán nếu giỏ hàng có mục được chọn
    const payBtn = document.getElementById('pay');
    const hasChecked = CART.some(i => i.checked);
    if (hasChecked) {
        payBtn.classList.add('pulse');
    } else {
        payBtn.classList.remove('pulse');
    }
    saveCartToStorage();
}

// Hàm làm mới tổng tiền và trạng thái nút thanh toán
function updateCartDisplay() {
    let total = 0;
    CART.forEach(i => {
        if (i.checked) total += i.price * i.qty;
    });
    document.getElementById('total').textContent = formatVND(total);
    const payBtn = document.getElementById('pay');
    const hasChecked = CART.some(i => i.checked);
    if (hasChecked) {
        payBtn.classList.add('pulse');
    } else {
        payBtn.classList.remove('pulse');
    }
    saveCartToStorage();
}

// Xử lý sự kiện thanh toán
async function pay() {
    const checkedItems = CART.filter(i => i.checked);
    if (checkedItems.length === 0) return alert('Chưa chọn sản phẩm nào để thanh toán');

    // Xây dựng modal xác nhận
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;';
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:520px;width:92%;box-shadow:0 20px 40px rgba(0,0,0,0.2);';

    dialog.innerHTML = `
    <h3 style="margin-top:0;margin-bottom:8px">Thanh toán — xác nhận chờ duyệt</h3>
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

    <div style="margin-bottom:10px;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;font-weight:600">Chọn bàn chờ</div>
      <div id="tableWrap" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">
      </div>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
      <button id="pm_cancel" class="btn-secondary btn-danger" style="padding:10px 14px;color:white;">Hủy</button>
      <button id="pm_confirm" class="btn-primary" style="padding:10px 14px;">Xác nhận</button>
    </div>
  `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const tableWrap = dialog.querySelector('#tableWrap');
    let selectedTable = null;

    // Đánh dấu nút bàn được chọn
    const markSelected = (btn, on) => {
        if (!btn) return;
        if (on) {
            btn.setAttribute('aria-checked', 'true');
            btn.classList.add('table-selected');
        } else {
            btn.removeAttribute('aria-checked');
            btn.classList.remove('table-selected');
        }
    };

    // Tạo 10 bàn
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = i;
        b.dataset.table = i;
        b.className = 'table-btn';
        b.style.cssText = 'padding:14px 0;font-weight:700;cursor:pointer;position:relative;overflow:hidden;';
        b.addEventListener('mouseenter', () => b.classList.add('table-hover'));
        b.addEventListener('mouseleave', () => b.classList.remove('table-hover'));
        b.addEventListener('click', (ev) => {
            createRipple(b, ev, 'rgba(255,255,255,0.18)');
            if (b.disabled) return; // bàn đã đặt
            if (selectedTable === b) { selectedTable = null; markSelected(b, false); }
            else {
                const prev = tableWrap.querySelector('button[aria-checked="true"]');
                if (prev) { markSelected(prev, false); }
                selectedTable = b;
                markSelected(b, true);
            }
        });
        tableWrap.appendChild(b);
    }

    // Lấy danh sách bàn đã được đặt từ API
    try {
        const tr = await fetch('/api/tables.php');
        if (tr.ok) {
            const td = await tr.json();
            const reserved = new Set((td.reserved || []).map(Number));
            tableWrap.querySelectorAll('button.table-btn').forEach(btn => {
                const n = Number(btn.dataset.table);
                if (reserved.has(n)) {
                    btn.classList.add('table-reserved');
                    btn.disabled = true;
                    btn.title = 'Bàn đang chờ duyệt';
                    btn.style.cursor = 'not-allowed';
                }
            });
        }
    } catch (e) {
        console.error('Failed to load reserved tables', e);
    }

    // Hiệu ứng hiện dialog
    dialog.style.transform = 'scale(0.96)';
    dialog.style.opacity = '0';
    setTimeout(() => { dialog.style.transition = 'all 180ms ease'; dialog.style.transform = 'scale(1)'; dialog.style.opacity = '1'; }, 10);

    const pmCancelBtn = dialog.querySelector('#pm_cancel');
    pmCancelBtn.addEventListener('click', (ev) => { createRipple(pmCancelBtn, ev, 'rgba(0,0,0,0.06)'); setTimeout(() => document.body.removeChild(modal), 160); });
    const pmConfirmBtn = dialog.querySelector('#pm_confirm');

    const nameInput = dialog.querySelector('#pm_name');
    const phoneInput = dialog.querySelector('#pm_phone');
    const pmMsg = dialog.querySelector('#pm_msg');

    // Kiểm tra tính hợp lệ của biểu mẫu
    const validateForm = () => {
        const n = (nameInput.value || '').trim();
        const p = (phoneInput.value || '').trim();
        const phoneOk = /^\d+$/.test(p);
        if (!n || !p) {
            pmMsg.style.display = 'block';
            pmMsg.textContent = 'Vui lòng nhập tên khách và số điện thoại.';
            nameInput.classList.toggle('input-error', !n);
            phoneInput.classList.toggle('input-error', !p);
            pmConfirmBtn.disabled = true;
            pmConfirmBtn.classList.remove('pulse');
            return false;
        }
        if (!phoneOk) {
            pmMsg.style.display = 'block';
            pmMsg.textContent = 'Số điện thoại không hợp lệ. Vui lòng chỉ nhập chữ số.';
            nameInput.classList.remove('input-error');
            phoneInput.classList.add('input-error');
            pmConfirmBtn.disabled = true;
            pmConfirmBtn.classList.remove('pulse');
            return false;
        }
        pmMsg.style.display = 'none';
        nameInput.classList.remove('input-error');
        phoneInput.classList.remove('input-error');
        pmConfirmBtn.disabled = false;
        pmConfirmBtn.classList.add('pulse');
        return true;
    };

    pmConfirmBtn.disabled = true;
    pmConfirmBtn.classList.remove('pulse');

    nameInput.addEventListener('input', validateForm);
    phoneInput.addEventListener('input', (e) => {
        const cleaned = (phoneInput.value || '').replace(/\D/g, '');
        if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
        validateForm();
    });

    pmConfirmBtn.addEventListener('click', async (ev) => {
        createRipple(pmConfirmBtn, ev, 'rgba(255,255,255,0.14)');
        if (!validateForm()) {
            pmMsg.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
            return;
        }
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const table_number = selectedTable ? Number(selectedTable.dataset.table) : null;

        // Gửi đơn hàng chờ duyệt tới API
        try {
            const res = await fetch('/api/orders.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: checkedItems, customer_name: name, customer_phone: phone, table_number: table_number }) });
            if (res.ok) {
                const data = await res.json();
                CART = CART.filter(i => !i.checked);
                updateCartDisplay();
                document.body.removeChild(modal);
                alert('Đã xác nhận, vào trạng thái để xem thêm chi tiết');
                try { if (typeof updatePendingBadge === 'function') updatePendingBadge(); } catch (e) { console.error(e); }
                try { loadProducts(); } catch (e) { try { if (typeof updateAdminBadge === 'function') updateAdminBadge(); } catch (e) {} }
            } else {
                const err = await res.json();
                alert('Lỗi khi tạo đơn: ' + (err.error || JSON.stringify(err)));
            }
        } catch (e) {
            alert('Lỗi kết nối: ' + e.message);
        }
    });
}

// Khởi chạy khi tài liệu đã sẵn sàng
window.addEventListener('DOMContentLoaded', init);
