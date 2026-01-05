<?php
// public/invoice.php - Trang hiển thị và in hóa đơn bán hàng
require_once __DIR__ . '/../config.php';
// Khởi tạo kết nối cơ sở dữ liệu
$pdo = getPDO();

// Lấy ID đơn hàng từ tham số GET trên URL (ép kiểu về số nguyên)
$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
if (!$order_id) {
    echo 'Missing order_id';
    exit;
}

// Truy vấn thông tin cơ bản của đơn hàng từ bảng orders
$stmt = $pdo->prepare('SELECT id, code, total, created_at FROM orders WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $order_id]);
$order = $stmt->fetch();

// Thông báo nếu không tìm thấy dữ liệu đơn hàng
if (!$order) { echo 'Order not found'; exit; }

// Truy vấn danh sách các sản phẩm thuộc đơn hàng này bằng cách kết bảng (JOIN) với bảng products
$stmt2 = $pdo->prepare('SELECT oi.qty, oi.price, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = :id');
$stmt2->execute([':id' => $order_id]);
$items = $stmt2->fetchAll();
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hóa đơn <?php echo htmlspecialchars($order['code'] ? $order['code'] : ('#' . $order['id'])); ?></title>
  <style>
    /* CSS định dạng trang in hóa đơn khổ nhỏ (Receipt) */
    body{font-family: Arial, Helvetica, sans-serif; padding:10px;}
    .receipt{max-width:300px;margin:0 auto;font-size:14px}
    .center{text-align:center}
    table{width:100%;border-collapse:collapse}
    td,th{padding:4px}
    .total{font-weight:bold}
  </style>
</head>
<body>
  <div class="receipt">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <img src="/cafe-pos/assets/images/logo.svg" alt="logo" style="width:90px">
      <div>
        <div style="font-weight:700;font-size:16px;color:#2B8EAD">Quán Cafe</div>
        <div style="font-size:12px;color:#666">Hóa đơn bán hàng</div>
      </div>
    </div>
    <hr>
    
    <div style="display:flex;justify-content:space-between">
        <div>Mã đơn: <strong><?php echo htmlspecialchars($order['code'] ? $order['code'] : ('#' . $order['id'])); ?></strong></div>
        <div><?php echo $order['created_at']; ?></div>
    </div>
    
    <table>
      <thead>
          <tr>
              <th style="text-align:left">Sản phẩm</th>
              <th>SL</th>
              <th style="text-align:right">Tiền</th>
          </tr>
      </thead>
      <tbody>
      <?php foreach($items as $it): ?>
        <tr>
          <td><?php echo htmlspecialchars($it['name']); ?></td>
          <td style="text-align:center"><?php echo (int)$it['qty']; ?></td>
          <td style="text-align:right"><?php echo number_format($it['price'] * $it['qty']); ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <hr>
    
    <div style="display:flex;justify-content:space-between;font-weight:700">
        <div>Tổng</div>
        <div><?php echo number_format($order['total']); ?> VND</div>
    </div>
    <div style="text-align:center;margin-top:10px;font-size:12px;color:#666">Cảm ơn quý khách! Hẹn gặp lại.</div>
  </div>

  <script>
    // Tự động kích hoạt hộp thoại in ngay sau khi trang được nạp xong
    window.onload = function(){ window.print(); };
  </script>
</body>
</html>