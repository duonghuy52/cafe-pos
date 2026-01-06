<?php
// config.php — Cấu hình Database cho Railway 

ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Lấy biến môi trường an toàn
function getEnvVar(string $key, $default = null) {
    if (isset($_ENV[$key])) return $_ENV[$key];
    $val = getenv($key);
    return ($val !== false) ? $val : $default;
}

// Railway MySQL bắt buộc có những biến này
$requiredEnv = ['MYSQLHOST','MYSQLDATABASE','MYSQLUSER','MYSQLPASSWORD','MYSQLPORT'];
foreach ($requiredEnv as $v) {
    if (!getEnvVar($v)) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['error' => "Missing environment variable: $v"]);
        exit;
    }
}

// Định nghĩa thông tin DB
define('DB_HOST', getEnvVar('MYSQLHOST'));
define('DB_NAME', getEnvVar('MYSQLDATABASE'));
define('DB_USER', getEnvVar('MYSQLUSER'));
define('DB_PASS', getEnvVar('MYSQLPASSWORD'));
define('DB_PORT', getEnvVar('MYSQLPORT'));

// Kiểm tra xem PDO MySQL driver có tồn tại không
if (!in_array('mysql', PDO::getAvailableDrivers())) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['error' => 'PDO MySQL driver not installed']);
    exit;
}

// Khởi tạo PDO
function getPDO(): PDO {
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
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
?>
