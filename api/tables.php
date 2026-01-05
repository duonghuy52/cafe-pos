<?php
// api/tables.php - Trả về danh sách các số bàn hiện đang được đặt (trạng thái = 'pending')
require_once __DIR__ . '/../config.php';
// Thiết lập header để phản hồi dữ liệu dưới dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Khởi tạo kết nối tới cơ sở dữ liệu
$pdo = getPDO();

try {
    // Thực hiện truy vấn lấy các số bàn duy nhất (không trùng lặp) từ những đơn hàng đang chờ xử lý
    $stmt = $pdo->query("SELECT DISTINCT table_number FROM orders WHERE status = 'pending' AND table_number IS NOT NULL");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Xử lý dữ liệu: Chuyển đổi các giá trị sang kiểu số nguyên (integer) và loại bỏ các giá trị null
    $tables = array_values(array_filter(array_map(function($v){ return $v !== null ? (int)$v : null; }, $rows), function($v){ return $v !== null; }));
    
    // Trả về kết quả thành công kèm theo danh sách các số bàn đã được đặt
    echo json_encode(['ok' => true, 'reserved' => $tables]);
} catch (Exception $e) {
    // Trường hợp xảy ra lỗi, thiết lập mã lỗi 500 và trả về thông báo lỗi
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}