<?php
// api/images.php - lấy danh sách ảnh trong thư mục ảnh/
// Thiết lập Header để trả về định dạng JSON với bảng mã UTF-8
header('Content-Type: application/json; charset=utf-8');

// Xác định đường dẫn đến thư mục chứa ảnh
$imageDir = __DIR__ . '/../ảnh/';
$images = [];

// Kiểm tra xem đường dẫn có tồn tại và có phải là thư mục không
if (is_dir($imageDir)) {
    // Đọc danh sách tệp tin trong thư mục
    $files = scandir($imageDir);
    foreach ($files as $file) {
        // Loại bỏ các ký hiệu thư mục mặc định '.' và '..'
        if ($file !== '.' && $file !== '..') {
            // Lấy phần mở rộng của tệp tin và chuyển thành chữ thường
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            // Chỉ lọc các tệp tin có định dạng hình ảnh hợp lệ
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $images[] = [
                    'filename' => $file,
                    'path' => '/ảnh/' . $file
                ];
            }
        }
    }
}

// Sắp xếp mảng ảnh theo tên tệp tin
sort($images);

// Trả về kết quả cuối cùng dưới định dạng JSON
echo json_encode($images);
