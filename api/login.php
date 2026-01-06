<?php
// api/login.php - Xử lý đăng nhập
require_once __DIR__ . '/../config.php';
session_start();

// Header JSON UTF-8
header('Content-Type: application/json; charset=utf-8');

$pdo = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Đọc dữ liệu JSON từ request body
$data = json_decode(file_get_contents('php://input'), true);

// Kiểm tra dữ liệu
if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu']);
    exit;
}

try {
    // Truy vấn người dùng theo username
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $data['username']]);
    $user = $stmt->fetch();

    $passwordMatch = false;

    if ($user) {
        // Hỗ trợ cả mật khẩu plain text và hash (bcrypt)
        if (strpos($user['password'], '$2') === 0) {
            $passwordMatch = password_verify($data['password'], $user['password']);
        } else {
            $passwordMatch = ($data['password'] === $user['password']);
        }
    }

    if ($user && $passwordMatch) {
        // Lưu session
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];
        echo json_encode(['ok' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi server: ' . $e->getMessage()]);
}
