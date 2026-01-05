<?php
// api/upload.php - Xử lý tải tệp tin ảnh sản phẩm lên máy chủ
// Thiết lập phản hồi trả về định dạng JSON với mã hóa UTF-8
header('Content-Type: application/json; charset=utf-8');

// Chỉ chấp nhận yêu cầu gửi lên bằng phương thức POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Kiểm tra xem tệp tin đã được gửi kèm trong yêu cầu hay chưa
if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Không có file được gửi']);
    exit;
}

// Gán thông tin tệp tin vào biến để dễ quản lý
$file = $_FILES['image'];

// Xử lý và phân loại các lỗi phát sinh trong quá trình tải lên từ phía máy chủ PHP
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = match($file['error']) {
        UPLOAD_ERR_INI_SIZE => 'File vượt quá kích thước PHP cho phép',
        UPLOAD_ERR_FORM_SIZE => 'File vượt quá kích thước form cho phép',
        UPLOAD_ERR_PARTIAL => 'File tải lên không hoàn toàn',
        UPLOAD_ERR_NO_FILE => 'Không có file được chọn',
        UPLOAD_ERR_NO_TMP_DIR => 'Thư mục tạm không tồn tại',
        UPLOAD_ERR_CANT_WRITE => 'Không thể ghi file',
        default => 'Lỗi upload không xác định'
    };
    http_response_code(400);
    echo json_encode(['error' => $errorMsg]);
    exit;
}

// Kiểm tra giới hạn kích thước tệp tin (Quy định tối đa là 5MB)
$maxSize = 5 * 1024 * 1024; // Tính toán 5MB sang đơn vị byte
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File quá lớn (max 5MB)']);
    exit;
}

// Kiểm tra định dạng phần mở rộng của tệp tin để đảm bảo đúng là ảnh
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($fileExt, $allowedExts)) {
    http_response_code(400);
    echo json_encode(['error' => 'Chỉ hỗ trợ ảnh (JPEG, PNG, GIF, WebP)']);
    exit;
}

// Thiết lập thư mục lưu trữ và tạo mới nếu thư mục chưa tồn tại
$uploadDir = __DIR__ . '/../ảnh/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Xử lý đặt lại tên file để đảm bảo an toàn hệ thống, giữ nguyên tên gốc nhưng làm sạch ký tự lạ
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName); // Thay thế ký tự đặc biệt bằng dấu gạch dưới
$newFilename = $sanitizedName . '.' . $ext;

$newPath = $uploadDir . $newFilename;

// Thực hiện di chuyển tệp tin từ thư mục tạm sang thư mục lưu trữ chính thức
if (!move_uploaded_file($file['tmp_name'], $newPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Không thể lưu file']);
    exit;
}

// Trả về đường dẫn tương đối để phía giao diện (Frontend) có thể truy cập và hiển thị ảnh
$relativePath = '/cafe-pos/ảnh/' . $newFilename;
echo json_encode(['success' => true, 'path' => $relativePath, 'filename' => $newFilename]);