<?php
// Nạp tệp cấu hình và kết nối cơ sở dữ liệu
require_once __DIR__ . '/../config.php';
// Khởi tạo phiên làm việc để lưu trạng thái đăng nhập
session_start();
// Thiết lập header trả về định dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');
// Lấy đối tượng kết nối PDO
$pdo = getPDO();

// Xác định phương thức gửi yêu cầu từ trình duyệt/client
$method = $_SERVER['REQUEST_METHOD'];

// Chỉ xử lý logic đăng nhập nếu phương thức là POST
if ($method === 'POST') {
    // Đọc và giải mã dữ liệu JSON từ thân (body) của yêu cầu
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Kiểm tra tính đầy đủ của dữ liệu đầu vào
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Thiếu dữ liệu']);
        exit;
    }

    // Truy vấn thông tin người dùng dựa trên tên đăng nhập
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $data['username']]);
    $user = $stmt->fetch();

    // Biến cờ để xác định mật khẩu có khớp hay không
    $passwordMatch = false;
    
    if ($user) {
        // Hỗ trợ cả mật khẩu dạng văn bản thuần túy (plain text) lẫn mật khẩu đã mã hóa (hash)
        
        // Kiểm tra nếu mật khẩu được mã hóa (Bcrypt thường bắt đầu bằng ký tự $2y$ hoặc $2a$)
        if (strpos($user['password'], '$2') === 0) {
            // Sử dụng hàm chuyên dụng để xác thực mật khẩu đã hash
            $passwordMatch = password_verify($data['password'], $user['password']);
        } else {
            // Nếu không phải dạng hash, tiến hành so sánh trực tiếp
            $passwordMatch = ($data['password'] === $user['password']);
        }
    }
    
    // Nếu tìm thấy người dùng và mật khẩu hoàn toàn trùng khớp
    if ($user && $passwordMatch) {
        // Lưu các thông tin cần thiết vào Session để duy trì đăng nhập
        $_SESSION['user'] = ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']];
        echo json_encode(['ok' => true]);
    } else {
        // Trả về mã lỗi 401 nếu thông tin đăng nhập không chính xác
        http_response_code(401);
        echo json_encode(['error' => 'Đăng nhập thất bại']);
    }
    exit;
}

// Trả về mã lỗi 405 nếu người dùng truy cập bằng phương thức khác POST
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);