<?php
// public/admin.php - Giao diện quản lý sản phẩm hiện đại dành cho quản trị viên
session_start();

// Kiểm tra trạng thái đăng nhập của người dùng
if (!isset($_SESSION['user'])) {
    header('Location: /cafe-pos/public/login.php');
    exit;
}

// Kiểm tra quyền hạn (Chỉ cho phép tài khoản có role là 'admin' truy cập)
if ($_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Truy cập bị từ chối</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f3f4f6;margin:0}div{background:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,0.1)}h1{color:#ef4444;margin-top:0}p{color:#6b7280;margin-bottom:20px}a{color:#6366f1;text-decoration:none;font-weight:600}</style></head><body><div><h1>Truy cập bị từ chối</h1><p>Chỉ tài khoản admin mới có thể truy cập trang này.</p><a href="/cafe-pos/public/index.php">Quay lại POS</a></div></body></html>';
    exit;
}
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quản trị sản phẩm - Cafe POS</title>
  <link rel="stylesheet" href="/cafe-pos/assets/css/admin.css">
</head>
<body>
  <div class="admin-container">
    <div class="admin-header">
      <div>
        <h1>Quản trị sản phẩm</h1>
        <p class="header-subtitle">Quản lý kho hàng và giá cả</p>
      </div>
      <div class="user-info">
        <?php echo htmlspecialchars($_SESSION['user']['username']); ?>
        <a href="/cafe-pos/api/logout.php" class="logout-btn">Đăng xuất</a>
        <a href="/cafe-pos/public/index.php" class="back-btn">Về POS</a>
      </div>
    </div>

    <div class="controls">
      <input type="text" id="search" placeholder="Tìm kiếm sản phẩm..." style="flex:1;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;">
    </div>

    <div class="content-wrapper">
      <div class="form-section">
        <h3>Thêm/Sửa sản phẩm</h3>
        <div class="form">
          <input id="p-id" type="hidden">
          <div class="form-group">
            <label for="p-name">Tên sản phẩm</label>
            <input id="p-name" type="text" placeholder="VD: Cà phê đen">
          </div>
          <div class="form-group">
            <label for="p-price">Giá (VND)</label>
            <input id="p-price" type="number" placeholder="VD: 25000">
          </div>
          <div class="form-group">
            <label for="p-stock">Số lượng</label>
            <input id="p-stock" type="number" placeholder="VD: 50">
          </div>
          <div class="form-group">
            <label for="p-category">Danh mục</label>
            <select id="p-category" style="padding:12px 14px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;background:white;cursor:pointer;width:100%;">
              <option value="">-- Chọn danh mục --</option>
              <option value="coffee">Cà phê</option>
              <option value="milktea">Trà sữa</option>
              <option value="cake">Bánh ngọt</option>
              <option value="snack">Đồ ăn kèm</option>
            </select>
          </div>
          <div class="form-group">
            <label for="p-description">Mô tả chi tiết</label>
            <textarea id="p-description" placeholder="Mô tả sản phẩm..." style="padding:12px 14px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;font-family:inherit;min-height:100px;resize:vertical;transition:all 0.3s ease;" onfocus="this.style.borderColor='#6366f1';this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'" onblur="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'"></textarea>
          </div>
          <div class="form-group">
            <label for="p-image-select">Ảnh sản phẩm</label>
            <div style="display:flex;gap:8px;margin-bottom:8px;">
              <select id="p-image-select" style="flex:1;padding:12px 14px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;background:white;cursor:pointer;">
                <option value="">-- Không chọn ảnh --</option>
              </select>
              <input id="p-image-file" type="file" accept="image/*" style="display:none">
              <button type="button" class="btn-secondary" onclick="document.getElementById('p-image-file').click(); return false;" style="padding:12px 16px;">📁 Upload</button>
            </div>
            <div id="image-preview" style="margin-top:10px;"></div>
            <input id="p-image-path" type="hidden">
          </div>
          <div class="form-actions">
            <button id="save" class="btn-primary">💾 Lưu</button>
            <button id="reset" class="btn-secondary">🔄 Reset</button>
          </div>
        </div>
      </div>

      <div class="list-section">
        <div class="list-header">
          <h3>Danh sách sản phẩm</h3>
          <div class="list-controls">
            <div class="custom-select" id="filter-category">
              <div class="select-selected">Tất cả danh mục</div>
              <ul class="select-options">
                <li data-value="">Tất cả danh mục</li>
                <li data-value="coffee">Cà phê</li>
                <li data-value="milktea">Trà sữa</li>
                <li data-value="cake">Bánh ngọt</li>
                <li data-value="snack">Đồ ăn kèm</li>
              </ul>
            </div>
            <span class="product-count">Tổng: <strong id="count">0</strong> sản phẩm</span>
          </div>
        </div>
        <div id="list" class="product-list"></div>
      </div>
    </div>
  </div>
  <script src="/cafe-pos/assets/js/admin.js"></script>
</body>
</html>
