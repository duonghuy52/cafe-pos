<?php
// config.php — Kết nối trực tiếp tới MySQL Railway từ local

// Thông tin lấy từ MYSQL_PUBLIC_URL của Railway
define('DB_HOST', 'crossover.proxy.rlwy.net');
define('DB_PORT', 18614);
define('DB_NAME', 'railway');
define('DB_USER', 'root');
define('DB_PASS', 'XhawzLbGdhYscmtlGTIXXWHfEbWpusgk');

function getPDO() {
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
            // Báo lỗi kết nối
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
