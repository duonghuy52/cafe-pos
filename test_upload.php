<?php
// test_upload.php - Trang công cụ kiểm tra chức năng tải ảnh (upload)
// Khởi tạo phiên làm việc để kiểm tra quyền truy cập
session_start();

// Kiểm tra xem người dùng đã đăng nhập hay chưa
if (!isset($_SESSION['user'])) {
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
    header('Location: /cafe-pos/public/login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Test Upload</title>
    <style>
        /* Định dạng giao diện cơ bản cho trang test */
        body { font-family: sans-serif; padding: 20px; }
        .result { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        img { max-width: 300px; margin-top: 10px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test Upload Ảnh</h1>
    <form id="uploadForm">
        <input type="file" id="imageInput" accept="image/*" required>
        <button type="submit">Upload</button>
    </form>
    
    <div id="result"></div>

    <script>
        // Lắng nghe sự kiện khi người dùng nhấn nút Upload
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            // Ngăn chặn hành động tải lại trang mặc định của form
            e.preventDefault();
            
            // Lấy tệp tin từ input
            const file = document.getElementById('imageInput').files[0];
            // Sử dụng FormData để đóng gói tệp tin gửi lên Server (multipart/form-data)
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                // Gửi yêu cầu POST tới API xử lý upload
                const res = await fetch('/cafe-pos/api/upload.php', {
                    method: 'POST',
                    body: formData
                });
                
                // Giải mã dữ liệu JSON trả về từ Server
                const data = await res.json();
                console.log('Response:', data);
                
                // Xây dựng chuỗi HTML để hiển thị kết quả lên màn hình
                let html = '<div class="result">';
                html += '<h3>Kết quả Upload:</h3>';
                // Hiển thị toàn bộ cấu trúc JSON trả về để kiểm tra
                html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                
                // Nếu Server trả về đường dẫn ảnh thành công, hiển thị ảnh xem trước
                if (data.path) {
                    html += '<h4>Ảnh uploaded:</h4>';
                    html += '<img src="' + data.path + '" alt="uploaded">';
                    html += '<p><code>' + data.path + '</code></p>';
                }
                
                html += '</div>';
                document.getElementById('result').innerHTML = html;
            } catch (err) {
                // Hiển thị thông báo nếu xảy ra lỗi trong quá trình kết nối hoặc xử lý
                document.getElementById('result').innerHTML = '<div class="result" style="color:red;">Error: ' + err.message + '</div>';
            }
        });
    </script>
</body>
</html>