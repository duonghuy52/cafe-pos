<?php
// config.php — Cấu hình Database dùng được cho Local & Railway

// Nếu chạy trên Railway (có biến môi trường MYSQLHOST)
if (getenv('MYSQLHOST')) {
    define('DB_HOST', getenv('MYSQLHOST'));
    define('DB_NAME', getenv('MYSQLDATABASE'));
    define('DB_USER', getenv('MYSQLUSER'));
    define('DB_PASS', getenv('MYSQLPASSWORD'));
    define('DB_PORT', getenv('MYSQLPORT'));
} else {
    // Local XAMPP
    define('DB_HOST', '127.0.0.1');
    define('DB_NAME', 'cafe_pos');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_PORT', 3306);
}

function getPDO() {
    static $pdo = null;
    if ($pdo === null) {

        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT .
               ";dbname=" . DB_NAME . ";charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}
