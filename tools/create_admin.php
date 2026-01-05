<?php
// tools/create_admin.php
// CLI script: tạo (hoặc cập nhật) user admin với password đã hash
// Usage: php create_admin.php [password] [username]

require_once __DIR__ . '/../config.php';

$password = $argv[1] ?? 'admin123';
$username = $argv[2] ?? 'admin';

try {
    $pdo = getPDO();
    // kiểm tra user đã tồn tại
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $row = $stmt->fetch();
    $hash = password_hash($password, PASSWORD_BCRYPT);
    if ($row) {
        $stmt = $pdo->prepare('UPDATE users SET password = :p, role = :r WHERE id = :id');
        $stmt->execute([':p' => $hash, ':r' => 'admin', ':id' => $row['id']]);
        echo "Updated existing user '{$username}' with new password.\n";
    } else {
        $stmt = $pdo->prepare('INSERT INTO users (username, password, role) VALUES (:u, :p, :r)');
        $stmt->execute([':u' => $username, ':p' => $hash, ':r' => 'admin']);
        echo "Created user '{$username}' with provided password.\n";
    }
    echo "Done. Use the credentials: username='{$username}', password='(the one you provided)'.\n";
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
    exit(1);
}

?>
