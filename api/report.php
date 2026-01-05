<?php
// api/report.php - Trả về doanh thu theo ngày và chi tiết đơn hàng trong một khoảng thời gian
require_once __DIR__ . '/../config.php';
// Thiết lập header trả về định dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Khởi tạo kết nối cơ sở dữ liệu
$pdo = getPDO();

// Lấy tham số ngày bắt đầu và kết thúc (mặc định lấy trong vòng 7 ngày gần nhất)
$start = $_GET['start'] ?? date('Y-m-d', strtotime('-7 days'));
$end = $_GET['end'] ?? date('Y-m-d');

// Bộ lọc trạng thái tùy chọn: 'confirmed' (mặc định), 'pending', hoặc 'all' (tất cả)
$allowed = ['confirmed','pending','all'];
$reqStatus = isset($_GET['status']) ? strtolower(trim($_GET['status'])) : 'confirmed';
if (!in_array($reqStatus, $allowed)) $reqStatus = 'confirmed';

try {
    // 1. TRUY VẤN DỮ LIỆU TỔNG HỢP (SUMMARY)
    // Xây dựng câu lệnh truy vấn tùy theo trạng thái được yêu cầu
    if ($reqStatus === 'all') {
        $stmt = $pdo->prepare("SELECT DATE(created_at) AS day, COUNT(*) AS orders_count, SUM(total) AS revenue
            FROM orders WHERE DATE(created_at) BETWEEN :start AND :end GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC");
        $stmt->execute([':start' => $start, ':end' => $end]);
    } else {
        $stmt = $pdo->prepare("SELECT DATE(created_at) AS day, COUNT(*) AS orders_count, SUM(total) AS revenue
            FROM orders WHERE status = :st AND DATE(created_at) BETWEEN :start AND :end GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC");
        $stmt->execute([':st' => $reqStatus, ':start' => $start, ':end' => $end]);
    }
    $summary = $stmt->fetchAll();

    // 2. KIỂM TRA CẤU TRÚC BẢNG (MAINTENANCE)
    // Đảm bảo cột `created_by` tồn tại để tránh lỗi SQL trên các bản sao DB cũ
    try {
        $cstmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'created_by'");
        $cstmt->execute([':db' => DB_NAME]);
        if ($cstmt->fetchColumn() == 0) {
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN created_by VARCHAR(100) DEFAULT NULL"); } catch (Exception $e) { /* bỏ qua lỗi nếu không có quyền ALTER */ }
        }
    } catch (Exception $e) { /* bỏ qua lỗi */ }

    // 3. TRUY VẤN DANH SÁCH ĐƠN HÀNG CHI TIẾT
    if ($reqStatus === 'all') {
        $stmt2 = $pdo->prepare('SELECT id, code, total, created_at, customer_name, customer_phone, table_number, status, created_by FROM orders WHERE DATE(created_at) BETWEEN :start AND :end ORDER BY created_at DESC');
        $stmt2->execute([':start' => $start, ':end' => $end]);
    } else {
        $stmt2 = $pdo->prepare('SELECT id, code, total, created_at, customer_name, customer_phone, table_number, status, created_by FROM orders WHERE status = :st AND DATE(created_at) BETWEEN :start AND :end ORDER BY created_at DESC');
        $stmt2->execute([':st' => $reqStatus, ':start' => $start, ':end' => $end]);
    }
    $orders = $stmt2->fetchAll();

    // 4. GỘP TÊN SẢN PHẨM VÀO TỪNG ĐƠN HÀNG
    // Giúp phía Client-side dễ dàng tìm kiếm (search) theo tên món trong danh sách đơn hàng
    if (count($orders) > 0) {
        // Lấy danh sách ID đơn hàng
        $ids = array_map(function($r){ return (int)$r['id']; }, $orders);
        // Tạo chuỗi dấu hỏi chấm (?,?,?) cho câu lệnh IN trong SQL
        $in = implode(',', array_fill(0, count($ids), '?'));
        
        // Sử dụng GROUP_CONCAT để lấy tất cả tên sản phẩm của một đơn hàng, phân cách bởi '||'
        $pstmt = $pdo->prepare("SELECT oi.order_id, GROUP_CONCAT(p.name SEPARATOR '||') AS products FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN ($in) GROUP BY oi.order_id");
        $pstmt->execute($ids);
        
        // Tạo bản đồ (map) để ánh xạ nhanh tên sản phẩm vào đơn hàng tương ứng
        $map = [];
        while ($row = $pstmt->fetch()) {
            $map[$row['order_id']] = $row['products'];
        }
        
        // Duyệt qua danh sách đơn và gán chuỗi tên sản phẩm vào mảng kết quả
        foreach ($orders as &$o) {
            $o['products'] = isset($map[$o['id']]) ? $map[$o['id']] : null;
        }
        unset($o); // Hủy tham chiếu vòng lặp
    }

    // Trả về dữ liệu tổng hợp và chi tiết đơn hàng
    echo json_encode(['ok' => true, 'start' => $start, 'end' => $end, 'summary' => $summary, 'orders' => $orders]);
} catch (Exception $e) {
    // Trả về lỗi 500 nếu có bất kỳ ngoại lệ nào xảy ra trong quá trình truy vấn
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}