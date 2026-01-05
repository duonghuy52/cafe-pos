<?php
// api/register.php - đăng ký tài khoản mới (role = staff)
require_once __DIR__ . '/../config.php';
// Thiết lập đầu ra dữ liệu dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Khởi tạo kết nối cơ sở dữ liệu thông qua hàm getPDO()
$pdo = getPDO();

// Kiểm tra phương thức yêu cầu (Chỉ cho phép POST để bảo mật thông tin đăng ký)
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST'){
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Đọc dữ liệu JSON từ body của request và chuyển thành mảng
$in = json_decode(file_get_contents('php://input'), true);
// Lấy giá trị username (loại bỏ khoảng trắng thừa) và password
$username = isset($in['username']) ? trim($in['username']) : '';
$password = isset($in['password']) ? $in['password'] : '';

// Thực hiện các bước kiểm tra dữ liệu đầu vào cơ bản (validation)
if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing username or password']);
    exit;
}
// Kiểm tra độ dài hợp lệ của tên đăng nhập
if (strlen($username) < 3 || strlen($username) > 50) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập phải từ 3 đến 50 ký tự']);
    exit;
}
// Kiểm tra định dạng ký tự của tên đăng nhập bằng Regex
if (!preg_match('/^[A-Za-z0-9_.-]+$/', $username)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập chỉ được chứa chữ, số và _ . -']);
    exit;
}
// Kiểm tra độ dài tối thiểu của mật khẩu
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Mật khẩu phải ít nhất 6 ký tự']);
    exit;
}

try {
    // Kiểm tra xem tên đăng nhập này đã được sử dụng hay chưa
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = :u');
    $stmt->execute([':u' => $username]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập đã tồn tại']);
        exit;
    }
    
    // Sử dụng thuật toán Bcrypt để mã hóa mật khẩu trước khi lưu vào DB
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Chèn người dùng mới vào cơ sở dữ liệu với quyền mặc định là 'staff'
    $stmt2 = $pdo->prepare('INSERT INTO users (username, password, role) VALUES (:u, :p, :r)');
    $stmt2->execute([':u' => $username, ':p' => $hash, ':r' => 'staff']);
    
    // Lấy ID tự động tăng của bản ghi vừa chèn
    $id = $pdo->lastInsertId();
    echo json_encode(['ok' => true, 'id' => $id, 'username' => $username]);
} catch (Exception $e) {
    // Xử lý lỗi hệ thống hoặc lỗi kết nối DB
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}