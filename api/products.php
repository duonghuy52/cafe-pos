<?php
// Tải tệp cấu hình và kết nối cơ sở dữ liệu
require_once __DIR__ . '/../config.php';
// Thiết lập header trả về định dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Khởi tạo đối tượng kết nối PDO
$pdo = getPDO();

// Xác định phương thức HTTP của yêu cầu
$method = $_SERVER['REQUEST_METHOD'];

// Cho phép GET (danh sách hoặc chi tiết), POST (tạo mới), PUT (cập nhật), DELETE (xóa)
if ($method === 'GET') {
    // Nếu có tham số 'id' trên URL, thực hiện lấy chi tiết một sản phẩm
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare('SELECT id, name, price, stock, image, description, category, size FROM products WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $_GET['id']]);
        $row = $stmt->fetch();
        // Trả về dữ liệu sản phẩm hoặc một đối tượng rỗng nếu không tìm thấy
        echo json_encode($row ?: new stdClass());
        exit;
    }
    // Lấy toàn bộ danh sách sản phẩm, sắp xếp ưu tiên theo danh mục và ID
    $stmt = $pdo->query('SELECT id, name, price, stock, image, description, category, size FROM products ORDER BY CASE WHEN category = "coffee" THEN 1 WHEN category = "milktea" THEN 2 WHEN category = "cake" THEN 3 WHEN category = "snack" THEN 4 ELSE 5 END, id');
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
    exit;
}

// Xử lý tạo sản phẩm mới
if ($method === 'POST') {
    // Đọc và giải mã dữ liệu JSON từ thân yêu cầu (body)
    $data = json_decode(file_get_contents('php://input'), true);
    // Kiểm tra các trường bắt buộc
    if (!isset($data['name']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Thiếu dữ liệu']);
        exit;
    }
    // Chuẩn bị câu lệnh thêm mới sản phẩm
    $stmt = $pdo->prepare('INSERT INTO products (name, price, stock, image, description, category, size) VALUES (:name, :price, :stock, :image, :description, :category, :size)');
    $stmt->execute([
        ':name' => $data['name'],
        ':price' => $data['price'],
        ':stock' => $data['stock'] ?? 0,
        ':image' => $data['image'] ?? null,
        ':description' => $data['description'] ?? null,
        ':category' => $data['category'] ?? null,
        ':size' => $data['size'] ?? null
    ]);
    // Trả về ID của sản phẩm vừa được thêm
    echo json_encode(['id' => $pdo->lastInsertId()]);
    exit;
}

// Xử lý cập nhật thông tin sản phẩm
if ($method === 'PUT') {
    // Đọc dữ liệu JSON từ thân yêu cầu
    $data = json_decode(file_get_contents('php://input'), true);
    // Kiểm tra các trường bắt buộc để cập nhật
    if (!isset($data['id']) || !isset($data['name']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Thiếu dữ liệu']);
        exit;
    }
    // Thực hiện cập nhật các trường thông tin dựa trên ID
    $stmt = $pdo->prepare('UPDATE products SET name = :name, price = :price, stock = :stock, image = :image, description = :description, category = :category, size = :size WHERE id = :id');
    $stmt->execute([
        ':name' => $data['name'],
        ':price' => $data['price'],
        ':stock' => $data['stock'] ?? 0,
        ':image' => $data['image'] ?? null,
        ':description' => $data['description'] ?? null,
        ':category' => $data['category'] ?? null,
        ':size' => $data['size'] ?? null,
        ':id' => $data['id']
    ]);
    // Trả về số lượng hàng đã được cập nhật thành công
    echo json_encode(['updated' => $stmt->rowCount()]);
    exit;
}

// Xử lý xóa sản phẩm
if ($method === 'DELETE') {
    // Hỗ trợ lấy ID từ JSON body hoặc tham số truy vấn trên URL (query param)
    $in = json_decode(file_get_contents('php://input'), true);
    $id = null;
    if (!empty($in['id'])) $id = $in['id'];
    if (!$id && isset($_GET['id'])) $id = $_GET['id'];
    
    // Nếu không xác định được ID, trả về lỗi 400
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }
    // Thực hiện lệnh xóa sản phẩm khỏi cơ sở dữ liệu
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);
    // Trả về số lượng bản ghi đã xóa
    echo json_encode(['deleted' => $stmt->rowCount()]);
    exit;
}

// Phản hồi lỗi 405 nếu phương thức không nằm trong danh sách hỗ trợ (GET, POST, PUT, DELETE)
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);