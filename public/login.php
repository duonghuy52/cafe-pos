<?php
// public/login.php - trang đăng nhập
session_start();

// Nếu đã đăng nhập, chuyển hướng đến trang chính
if (isset($_SESSION['user'])) {
    header('Location: /cafe-pos/public/index.php');
    exit;
}
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Đăng nhập - Cafe POS</title>
  <link rel="stylesheet" href="/cafe-pos/assets/css/login.css">
</head>
<body>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="/cafe-pos/ảnh/logo.jpg" alt="logo" class="login-logo">
        <h1>Cafe POS</h1>
        <p>Hệ thống bán hàng chuyên nghiệp</p>
      </div>

      <form id="login-form">
        <div class="form-group">
          <label for="username">Tên đăng nhập</label>
          <input type="text" id="username" name="username" placeholder="username" required>
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required>
        </div>

        <button type="submit" class="btn-login">Đăng nhập</button>

        <div id="error-message" class="error-message"></div>
      </form>

      <div class="login-footer">
        <div style="display:flex;gap:8px;justify-content:center;align-items:center">
          <button id="btn-register" class="btn-register" type="button">Đăng ký</button>
        </div>
      </div>
    </div>

    <div class="login-bg"></div>
  </div>

  <script src="/cafe-pos/assets/js/login.js"></script>
</body>
</html>
