<?php
// config.php — Cấu hình Database tối ưu cho Railway & Local

ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Hàm hỗ trợ lấy biến môi trường an toàn (Ưu tiên $_ENV cho Railway)
function getEnvVar($key, $default = null) {
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    $val = getenv($key);
    return ($val !== false) ? $val : $default;
}

// Xác định thông tin kết nối
if (getEnvVar('MYSQLHOST')) {
    // Cấu hình Railway
    define('DB_HOST', getEnvVar('MYSQLHOST'));
    define('DB_NAME', getEnvVar('MYSQLDATABASE'));
    define('DB_USER', getEnvVar('MYSQLUSER'));
    define('DB_PASS', getEnvVar('MYSQLPASSWORD'));
    define('DB_PORT', getEnvVar('MYSQLPORT'));
} else {
    // Cấu hình Local (XAMPP/MAMP)
    define('DB_HOST', '127.0.0.1');
    define('DB_NAME', 'cafe_pos');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_PORT', 3306);
}

function getPDO() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT .
                   ";dbname=" . DB_NAME . ";charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Nếu lỗi kết nối, trả về JSON lỗi và dừng ngay lập tức
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
?>
