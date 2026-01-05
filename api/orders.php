<?php
// Tải tệp cấu hình và kết nối cơ sở dữ liệu
require_once __DIR__ . '/../config.php';
// Bắt đầu phiên làm việc để quản lý đăng nhập
session_start();
// Thiết lập header trả về định dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Khởi tạo đối tượng kết nối cơ sở dữ liệu
$pdo = getPDO();

// Lấy phương thức HTTP của yêu cầu (GET, POST, PUT, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// Đảm bảo bảng 'orders' có đầy đủ các cột cần thiết (Sử dụng INFORMATION_SCHEMA để kiểm tra)
try {
    $ensure = function($pdo, $col, $def) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'orders' AND COLUMN_NAME = :col");
        $stmt->execute([':db' => DB_NAME, ':col' => $col]);
        if ($stmt->fetchColumn() == 0) {
            // Nếu cột chưa tồn tại, thực hiện thêm cột vào bảng
            $pdo->exec("ALTER TABLE orders ADD COLUMN `$col` $def");
        }
    };
    $ensure($pdo, 'customer_name', "VARCHAR(255) DEFAULT NULL");
    $ensure($pdo, 'customer_phone', "VARCHAR(50) DEFAULT NULL");
    $ensure($pdo, 'table_number', "INT DEFAULT NULL");
    $ensure($pdo, 'status', "VARCHAR(50) NOT NULL DEFAULT 'pending'");
    $ensure($pdo, 'created_by', "VARCHAR(100) DEFAULT NULL");
    $ensure($pdo, 'code', "VARCHAR(20) DEFAULT NULL UNIQUE");
} catch (Exception $e) {
    // Bỏ qua nếu lệnh ALTER không được hỗ trợ hoặc thất bại; ứng dụng vẫn cố gắng chạy tiếp
}

// XỬ LÝ TẠO ĐƠN HÀNG MỚI (POST)
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    // Kiểm tra tính hợp lệ của danh sách sản phẩm (items)
    if (!isset($data['items']) || !is_array($data['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payload']);
        exit;
    }
    $customer_name = $data['customer_name'] ?? null;
    $customer_phone = $data['customer_phone'] ?? null;
    $table_number = isset($data['table_number']) ? (int)$data['table_number'] : null;

    // Bắt đầu một Transaction để đảm bảo tính toàn vẹn dữ liệu
    $pdo->beginTransaction();
    try {
        // Tính toán tổng tiền của đơn hàng
        $total = 0;
        foreach ($data['items'] as $it) {
            $total += $it['price'] * $it['qty'];
        }

        // Kiểm tra tình trạng bàn (chỉ cho phép đặt nếu bàn chưa có đơn hàng 'pending')
        if ($table_number !== null && $table_number > 0) { 
            $stmtCheck = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE table_number = :table AND status = :st');
            $stmtCheck->execute([':table' => $table_number, ':st' => 'pending']);
            if ($stmtCheck->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Table already reserved']);
                exit;
            }
        }

        // Tạo mã định danh 3 chữ số duy nhất cho đơn hàng (định dạng CFPxxx)
        $code = null;
        $attempts = 0;
        while ($attempts < 100) {
            $candidate = 'CFP' . str_pad(mt_rand(0, 999), 3, '0', STR_PAD_LEFT);
            $stmtCheck = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE code = :c');
            $stmtCheck->execute([':c' => $candidate]);
            if ($stmtCheck->fetchColumn() == 0) { 
                $code = $candidate; 
                break; 
            }
            $attempts++;
        }
        if (!$code) {
            // Trường hợp không tìm được mã duy nhất sau 100 lần thử, dùng timestamp làm mã dự phòng
            $code = 'CFP' . time();
        }

        // Chèn dữ liệu vào bảng đơn hàng (orders)
        $stmt = $pdo->prepare('INSERT INTO orders (total, customer_name, customer_phone, table_number, status, created_by, code) VALUES (:total, :customer_name, :customer_phone, :table_number, :status, :created_by, :code)');
        $stmt->execute([
            ':total' => $total,
            ':customer_name' => $customer_name,
            ':customer_phone' => $customer_phone,
            ':table_number' => $table_number,
            ':status' => 'pending',
            ':created_by' => isset($_SESSION['user']) ? $_SESSION['user']['username'] : null,
            ':code' => $code
        ]);
        
        $orderId = $pdo->lastInsertId();
        $stmtItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (:order_id, :product_id, :qty, :price)');
        
        // Duyệt danh sách sản phẩm để lưu vào chi tiết đơn hàng và cập nhật kho
        foreach ($data['items'] as $it) {
            $stmtItem->execute([
                ':order_id' => $orderId,
                ':product_id' => $it['id'],
                ':qty' => $it['qty'],
                ':price' => $it['price']
            ]);
            // Thực hiện giảm số lượng tồn kho của sản phẩm tương ứng
            $pdo->prepare('UPDATE products SET stock = stock - :q WHERE id = :id')->execute([':q' => $it['qty'], ':id' => $it['id']]);
        }
        
        // Xác nhận hoàn tất giao dịch (commit)
        $pdo->commit();
        echo json_encode(['order_id' => $orderId, 'code' => $code, 'total' => $total, 'status' => 'pending']);
    } catch (Exception $e) {
        // Hoàn tác mọi thay đổi nếu có lỗi xảy ra (rollback)
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// XỬ LÝ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (PUT)
if ($method === 'PUT') {
    // Yêu cầu xác thực người dùng đã đăng nhập
    if (!isset($_SESSION['user'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id or status']);
        exit;
    }
    try {
        // Cập nhật trạng thái mới và lưu vết người thực hiện cập nhật
        $stmt = $pdo->prepare('UPDATE orders SET status = :status, created_by = :user WHERE id = :id');
        $stmt->execute([
            ':status' => $data['status'], 
            ':id' => $data['id'],
            ':user' => $_SESSION['user']['username']
        ]);
        echo json_encode(['updated' => $stmt->rowCount()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// XỬ LÝ XÓA ĐƠN HÀNG (DELETE)
if ($method === 'DELETE') {
    // Yêu cầu xác thực người dùng
    if (!isset($_SESSION['user'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $in = json_decode(file_get_contents('php://input'), true);
    $id = null;
    if (!empty($in['id'])) $id = (int)$in['id'];
    if (!$id && isset($_GET['id'])) $id = (int)$_GET['id'];
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }
    try {
        $pdo->beginTransaction();
        
        // Lấy danh sách sản phẩm trong đơn hàng để thực hiện hoàn lại tồn kho
        $stmt = $pdo->prepare('SELECT product_id, qty FROM order_items WHERE order_id = :id');
        $stmt->execute([':id' => $id]);
        $items = $stmt->fetchAll();
        foreach ($items as $it) {
            // Cộng trả lại số lượng tồn kho (restore stock)
            $pdo->prepare('UPDATE products SET stock = stock + :q WHERE id = :id')->execute([':q' => $it['qty'], ':id' => $it['product_id']]);
        }
        
        // Thực hiện xóa đơn hàng (Dữ liệu bảng 'order_items' sẽ tự động xóa nếu có FK ON DELETE CASCADE)
        $stmt2 = $pdo->prepare('DELETE FROM orders WHERE id = :id');
        $stmt2->execute([':id' => $id]);
        $deleted = $stmt2->rowCount();
        
        $pdo->commit();
        echo json_encode(['deleted' => $deleted]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Phản hồi lỗi nếu phương thức HTTP không được hỗ trợ
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);