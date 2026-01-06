<?php
// index.php - router cho cafe-pos
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

switch($request){
    case '/':
        require __DIR__ . '/public/index.php';
        break;
    case '/customer':
        require __DIR__ . '/public/customer_index.php';
        break;
    case '/status':
        require __DIR__ . '/public/customer_status.php';
        break;
    case '/login':
        require __DIR__ . '/public/login.php';
        break;
    case '/admin':
        require __DIR__ . '/public/admin.php';
        break;
    case '/report':
        require __DIR__ . '/public/report.php';
        break;
    case '/invoice':
        require __DIR__ . '/public/invoice.php';
        break;
    default:
        http_response_code(404);
        echo "Page not found";
        break;
}
?>
