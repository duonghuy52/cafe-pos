<?php
// public/customer_index.php - Trang hiển thị menu dành cho khách hàng
require_once __DIR__ . '/../config.php';
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Menu Khách Hàng - Cafe POS</title>
  <link rel="stylesheet" href="/assets/css/style.css">
  <style>
    /* Các tùy chỉnh giao diện bổ sung dành riêng cho trang khách hàng */
    .topbar { justify-content: space-between; }
    .nav-links { display: flex; gap: 10px; }
    /* Ẩn các class chỉ dành cho admin nếu có */
    .admin-only { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <div style="flex: 2; display: flex; flex-direction: column;">
      <header class="brand">
        <img src="/ảnh/logo.jpg" alt="logo" class="logo" onerror="this.style.display='none'">
        <div class="brand-text">
          <div class="title">Xin chào Quý Khách</div>
          <div class="subtitle">Vui lòng chọn món tại đây</div>
        </div>
        <button id="personalize-btn" style="background:#6366f1;color:white;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600;margin-right:16px;">Cá nhân hóa</button>
      </header>

      <div class="topbar">
        <input id="search" placeholder="🔍 Tìm món ăn, đồ uống..." style="flex:1">
        
        <div class="custom-select" id="category-filter">
          <div class="select-selected">Tất cả danh mục</div>
          <ul class="select-options">
            <li data-value="">Tất cả danh mục</li>
            <li data-value="coffee">Cà phê</li>
            <li data-value="milktea">Trà sữa</li>
            <li data-value="cake">Bánh ngọt</li>
            <li data-value="snack">Đồ ăn kèm</li>
          </ul>
        </div>
        <div class="nav-links">
            <a id="status-link" href="/public/customer_status.php">
              Trạng thái <span id="status-badge" class="status-badge" style="display:none">0</span>
          </a>
        </div>
      </div>
      <div id="products"></div>
    </div>

    <div id="cart">
      <h2>Giỏ hàng của bạn</h2>
      <ul id="cart-items"></ul>
      <div>Tổng: <span id="total">0</span> VND</div>
      <button id="pay">Đặt món ngay</button>
    </div>
  </div>

  <div id="personalize-menu" style="display:none;position:fixed;top:80px;right:20px;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);z-index:1000;min-width:200px;opacity:0;transform:scale(0.9);transition:opacity 0.2s ease, transform 0.2s ease;">
    <div style="font-weight:600;margin-bottom:12px;color:#374151;">Tùy chỉnh</div>
    <button id="theme-toggle" style="width:100%;background:#f3f4f6;border:none;border-radius:8px;padding:10px;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s;">
      Chế độ tối
    </button>
    <div style="font-weight:500;margin-bottom:8px;color:#6b7280;">Màu nền</div>
    <div style="display:flex;gap:8px;">
      <button class="bg-option" data-bg="default" style="flex:1;background:linear-gradient(135deg,#faf8ff 0%,#f3e8ff 100%);border:2px solid #6366f1;border-radius:8px;padding:20px;cursor:pointer;"></button>
      <button class="bg-option" data-bg="blue" style="flex:1;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border:2px solid transparent;border-radius:8px;padding:20px;cursor:pointer;"></button>
      <button class="bg-option" data-bg="green" style="flex:1;background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%);border:2px solid transparent;border-radius:8px;padding:20px;cursor:pointer;"></button>
    </div>
  </div>

  <script>

    window.CAFE_POS_USER = { id: 0, username: 'guest', role: 'customer' };
  </script>
  <script src="/assets/js/customer_pos.js"></script>
</body>
</html>
