<?php
// api/login.php - xử lý đăng nhập an toàn, trả về JSON chuẩn
require_once __DIR__ . '/../config.php';

// Tắt hiển thị lỗi ra màn hình (tránh làm JSON bị hỏng)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Bắt đầu session
session_start();

// Header trả về JSON UTF-8
header('Content-Type: application/json; charset=utf-8');

// Kết nối PDO
$pdo = getPDO();

// Chỉ chấp nhận POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Lấy dữ liệu đầu vào
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// Nếu JSON không hợp lệ, thử lấy từ POST form
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    $data = $_POST; // hỗ trợ form-urlencoded
}

// Kiểm tra dữ liệu
$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu']);
    exit;
}

try {
    // Truy vấn người dùng theo username
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();

    $passwordMatch = false;

    if ($user) {
        // Hỗ trợ cả password hashed (bcrypt) và plain text
        if (strpos($user['password'], '$2') === 0) {
            $passwordMatch = password_verify($password, $user['password']);
        } else {
            $passwordMatch = ($password === $user['password']);
        }
    }

    if ($user && $passwordMatch) {
        // Lưu session
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];

        echo json_encode(['ok' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
    }

} catch (Exception $e) {
    http_response_code(500);
    // Không in message lỗi DB ra client, chỉ log server
    error_log('Login error: ' . $e->getMessage());
    echo json_encode(['error' => 'Lỗi server']);
}
