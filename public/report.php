<?php
// public/report.php - Giao diện hiển thị báo cáo doanh thu và chi tiết đơn hàng
session_start();

// Kiểm tra trạng thái đăng nhập của người dùng
if (!isset($_SESSION['user'])) {
    header('Location: /cafe-pos/public/login.php');
    exit;
}

// Cho phép tất cả người dùng đã đăng nhập xem báo cáo 
// (quyền Admin sẽ được kiểm tra ở các hành động khác)
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Báo cáo - Cafe POS</title>
  <style>
    /* Thiết lập bảng màu và biến hệ thống cho giao diện báo cáo */
    :root {
      --primary: #8b5cf6;
      --accent: #fbbf24;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --muted: #6b7280;
      --light: #faf8ff;
      --dark: #3f3f46;
      --border: #e9d5ff;
      --shadow: 0 4px 6px rgba(139, 92, 246, 0.1), 0 10px 15px rgba(139, 92, 246, 0.15);
    }

    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      padding: 0;
      margin: 0;
      background: linear-gradient(135deg, #faf8ff 0%, #f3e8ff 100%);
      color: var(--dark);
      min-height: 100vh;
      transition: opacity 0.3s ease;
      /* Ban đầu ẩn body để tạo hiệu ứng mờ dần khi load xong */
      opacity: 0;
    }

    body.loaded {
      opacity: 1;
    }

    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
      animation: fadeInUp 0.8s ease-out 0.2s;
    }

    /* Tiêu đề trang báo cáo và khu vực người dùng */
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 24px;
      flex-wrap: wrap;
      animation: fadeInUp 0.8s ease-out 0.2s;
    }

    .report-header h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      color: var(--dark);
      background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      white-space: nowrap;
    }

    .logout-btn, .back-btn {
      text-decoration: none;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;
      font-weight: 600;
      display: inline-block;
    }

    .logout-btn { background: var(--danger); }
    .logout-btn:hover { background: #dc2626; transform: translateY(-2px); }

    .back-btn { background: var(--primary); }
    .back-btn:hover { background: #4f46e5; transform: translateY(-2px); }

    /* Khu vực bộ lọc: Chọn ngày và Tìm kiếm */
    .controls {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
      animation: fadeInUp 0.8s ease-out 0.3s;
    }

    .date-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .date-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .date-group input {
      padding: 10px 12px;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .date-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }

    .button-group {
      display: flex;
      gap: 10px;
    }

    /* Thiết kế cho ô tìm kiếm đơn hàng */
    .search-group input[type="search"] {
      transition: box-shadow 180ms ease, border-color 160ms ease, transform 120ms ease;
    }
    .search-group input[type="search"]:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 6px 18px rgba(139,92,246,0.12);
      transform: translateY(-2px);
    }

    /* Hiệu ứng nháy sáng khi một dòng trong bảng được tìm thấy */
    .search-active-row {
      animation: highlightFlash 900ms ease-in-out;
    }
    @keyframes highlightFlash {
      0% { background: rgba(139,92,246,0.06); }
      50% { background: rgba(139,92,246,0.1); }
      100% { background: transparent; }
    }
    mark.search-hit { background: #fff3bf; padding: 0 2px; border-radius: 2px; }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    #load {
      background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
      color: white;
      box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
    }
    #load:hover { transform: translateY(-2px); box-shadow: 0 8px 12px rgba(99, 102, 241, 0.4); }

    #csv { background: var(--success); color: white; }
    #csv:hover { background: #059669; transform: translateY(-2px); }

    /* Các phân đoạn hiển thị bảng dữ liệu */
    .section {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      animation: fadeInUp 0.8s ease-out;
    }

    .section h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: var(--dark);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Trì hoãn hiệu ứng xuất hiện cho từng bảng */
    .section:nth-child(1) { animation-delay: 0.4s; }
    .section:nth-child(2) { animation-delay: 0.6s; }
    .section:nth-child(3) { animation-delay: 0.8s; }
    .section:nth-child(4) { animation-delay: 1.0s; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    table th {
      background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border: none;
    }

    table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }

    table tr:hover { background: var(--light); }

    table a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    table a:hover { color: #4f46e5; text-decoration: underline; }

    .empty { text-align: center; padding: 40px; color: var(--muted); }

    /* Tương thích với các thiết bị màn hình nhỏ (Mobile) */
    @media (max-width: 768px) {
      .report-header { flex-direction: column; align-items: flex-start; }
      .controls { flex-direction: column; }
      .date-group, .button-group { width: 100%; }
      .date-group input, button { width: 100%; }
      table { font-size: 12px; }
      table th, table td { padding: 8px 12px; }
    }

    /* Hiệu ứng trượt từ dưới lên */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div>
        <h1>Báo cáo doanh thu</h1>
        <p style="color: var(--muted); margin: 6px 0 0 0;">Xem tóm tắt và chi tiết đơn hàng</p>
      </div>
      <div class="user-info">
        <?php echo htmlspecialchars($_SESSION['user']['username']); ?>
        <a href="/cafe-pos/api/logout.php" class="logout-btn">Đăng xuất</a>
        <a href="/cafe-pos/public/index.php" class="back-btn">Về POS</a>
      </div>
      <script>window.CAFE_POS_USER = <?php echo json_encode(['id'=> $_SESSION['user']['id'], 'username' => $_SESSION['user']['username'], 'role' => $_SESSION['user']['role']]); ?>;</script>
    </div>

    <div class="controls">
      <div class="date-group">
        <label for="start">Từ ngày</label>
        <input type="date" id="start">
      </div>
      <div class="date-group">
        <label for="end">Đến ngày</label>
        <input type="date" id="end">
      </div>
      <div class="search-group" style="flex:1;min-width:240px;">
        <label for="q" style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;display:block">Tìm kiếm</label>
        <div style="position:relative;display:flex;align-items:center;">
          <input id="q" type="search" placeholder="Nhập mã đơn, nhân viên, tên khách, SĐT..." style="width:100%;padding:10px 40px 10px 40px;border:2px solid var(--border);border-radius:8px;font-size:14px;">
          <button id="q_clear" title="Xóa" style="position:absolute;right:8px;border:none;background:transparent;font-size:16px;padding:6px;cursor:pointer;display:none">✖</button>
        </div>
      </div>
      <div class="button-group">
        <button id="load">Tải dữ liệu</button>
        <button id="csv">Xuất CSV</button>
      </div>
    </div>

    <div class="section">
      <h2>Tóm tắt theo ngày</h2>
      <table id="summary">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Số đơn</th>
            <th>Doanh thu</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="section">
      <h2>Danh sách đơn hàng</h2>
      <table id="orders">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Người bán</th>
            <th>Người mua</th>
            <th>SĐT</th>
            <th>Số bàn</th>
            <th>Tổng tiền</th>
            <th>Thời gian</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
  <script src="/cafe-pos/assets/js/report.js"></script>
</body>
</html>