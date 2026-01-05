<?php
// api/logout.php - xử lý đăng xuất
session_start();
session_destroy();
header('Location: /cafe-pos/public/login.php');
exit;
