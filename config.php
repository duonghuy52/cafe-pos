<?php
// config.php — Cấu hình Database tối ưu cho Railway 

ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Lấy biến môi trường an toàn
function getEnvVar(string $key, $default = null) {
    $val = $_ENV[$key] ?? getenv($key);
    return $val !== false ? $val : $default;
}

// Định nghĩa thông tin DB
define('DB_HOST', getEnvVar('MYSQLHOST', '127.0.0.1'));
define('DB_NAME', getEnvVar('MYSQLDATABASE', 'cafe_pos'));
define('DB_USER', getEnvVar('MYSQLUSER', 'root'));
define('DB_PASS', getEnvVar('MYSQLPASSWORD', ''));
define('DB_PORT', getEnvVar('MYSQLPORT', 3306));

// Khởi tạo PDO
function getPDO(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Trả về lỗi JSON nếu kết nối DB thất bại
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
?>
