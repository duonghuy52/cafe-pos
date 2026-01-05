<?php
// public/customer_status.php - Trang hiển thị trạng thái đơn hàng dành cho khách hàng
require_once __DIR__ . '/../config.php';
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Trạng thái đơn hàng</title>
  <link rel="stylesheet" href="/cafe-pos/assets/css/style.css">
  <style>
    /* Định nghĩa phong cách riêng cho trang trạng thái của khách */
    .status-container { max-width: 800px; margin: 0 auto; padding: 120px 24px 24px 24px; }
    .status-card {
        background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 6px solid #ccc;
        transition: transform 0.2s;
    }
    .status-card:hover { transform: translateY(-2px); }
    .status-pending { border-left-color: #f59e0b; background: #fffbeb; }
    .status-confirmed { border-left-color: #10b981; background: #ecfdf5; }
    .empty { text-align: center; color: #6b7280; padding: 40px; }
    
    /* Phong cách cho ô tìm kiếm đơn hàng */
    .search-box { margin-bottom: 20px; }
    .search-input {
        width: 100%; padding: 12px 16px; 
        border: 2px solid #e9d5ff; border-radius: 8px; 
        font-size: 16px; outline: none; transition: border-color 0.2s;
    }
    .search-input:focus { border-color: #8b5cf6; }
  </style>
</head>
<body class="loaded">
    
  <div class="brand" style="border-radius:0; position:fixed; top:0; left:0; right:0; z-index:100;">
    <div style="display:flex; align-items:center; gap:16px; width:100%; max-width:1600px; margin:0 auto;">
       <a href="/cafe-pos/public/customer_index.php" class="back-btn">← Quay lại Đặt món</a>
       <div class="brand-text">
         <div class="title">Trạng thái đơn hàng</div>
         <div class="subtitle">Theo dõi đơn hàng của bạn</div>
       </div>
    </div>
  </div>

  <div class="status-container">
    <div class="search-box">
        <input type="text" id="q" class="search-input" placeholder="🔍 Nhập Mã đơn, Tên hoặc SĐT để tìm kiếm...">
    </div>

    <div id="ordersList">
        <div class="empty">Đang tải dữ liệu...</div>
    </div>
  </div>

  <script>
    // Biến toàn cục để lưu trữ dữ liệu đơn hàng sau khi tải từ Server
    let cachedOrders = [];

    // Hàm tải toàn bộ đơn hàng từ API báo cáo
    async function loadOrders(){
      try {
          // Gọi API lấy tất cả các đơn hàng
          const res = await fetch('/cafe-pos/api/report.php?status=all');
          const data = await res.json();
          
          // Kiểm tra nếu phản hồi không thành công
          if(!data.ok){ document.getElementById('ordersList').innerHTML = '<div class="empty">Không tải được dữ liệu</div>'; return; }
          
          const orders = data.orders;
          
          // Chỉ lọc lấy các đơn hàng có trạng thái "Chờ duyệt" (pending) và "Đã duyệt" (confirmed)
          cachedOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
          
          // Thực hiện hiển thị danh sách lên màn hình
          renderList();
          
      } catch (e) {
          // Hiển thị thông báo lỗi kết nối nếu không có dữ liệu cũ trong bộ nhớ đệm
          if(cachedOrders.length === 0) {
              document.getElementById('ordersList').innerHTML = '<div class="empty">Lỗi kết nối server</div>';
          }
      }
    }

    // Hàm xử lý hiển thị danh sách đơn hàng dựa trên tìm kiếm và dữ liệu đã nạp
    function renderList() {
        const container = document.getElementById('ordersList');
        const query = document.getElementById('q').value.trim().toLowerCase();

        // Lọc dữ liệu trong cachedOrders dựa trên từ khóa người dùng nhập vào
        const filtered = cachedOrders.filter(o => {
            if (!query) return true; // Nếu ô tìm kiếm trống, hiển thị toàn bộ đơn hàng hợp lệ
            const code = (o.code || ('#' + o.id)).toLowerCase();
            const name = (o.customer_name || '').toLowerCase();
            const phone = (o.customer_phone || '').toLowerCase();
            // Kiểm tra xem từ khóa có nằm trong Mã đơn, Tên khách hoặc SĐT không
            return code.includes(query) || name.includes(query) || phone.includes(query);
        });

        // Trường hợp không tìm thấy kết quả phù hợp
        if(!filtered || filtered.length === 0){ 
            container.innerHTML = '<div class="empty">Không tìm thấy đơn hàng nào</div>'; 
            return; 
        }

        // Tạo chuỗi HTML cho danh sách các thẻ đơn hàng
        const html = filtered.map(o => {
            const isPending = o.status === 'pending';
            const statusClass = isPending ? 'status-pending' : 'status-confirmed';
            const statusLabel = isPending ? '⏳ ĐANG CHỜ DUYỆT' : '✅ ĐÃ ĐƯỢC DUYỆT';
            const statusColor = isPending ? '#d97706' : '#059669';
            
            const displayCode = o.code ? o.code : ('#' + o.id);
            const customerName = o.customer_name || 'Khách lẻ';
            // Logic hiển thị vị trí: Nếu số bàn là 0 hoặc trống thì hiểu là đặt Online
            const tableName = (o.table_number && o.table_number != 0) ? `Bàn ${o.table_number}` : 'Đặt online';
            const total = new Intl.NumberFormat('vi-VN').format(o.total);

            return `
            <div class="status-card ${statusClass}">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                  <div>
                    <div style="font-weight:700; font-size:18px;">${displayCode}</div>
                    <div style="color:${statusColor}; font-weight:bold; font-size:14px; margin-top:4px;">${statusLabel}</div>
                  </div>
                  <div style="font-weight:bold; font-size:18px; color:#6366f1;">${total} đ</div>
              </div>
              <hr style="border:0; border-top:1px solid rgba(0,0,0,0.05); margin:10px 0;">
              <div style="color:#4b5563; font-size:14px; line-height:1.6;">
                  <div>👤 <strong>${customerName}</strong> &bull; 📞 ${o.customer_phone || '--'}</div>
                  <div>📍 <strong>${tableName}</strong></div>
                  <div style="margin-top:4px;">🤵 Người duyệt: <strong>${o.created_by || '---'}</strong></div>
                  <div style="font-size:12px; color:#9ca3af; margin-top:4px;">🕒 ${o.created_at}</div>
              </div>
            </div>`;
        }).join('');
        
        container.innerHTML = html;
    }

    // Sự kiện khởi chạy khi trang web tải xong
    document.addEventListener('DOMContentLoaded', ()=>{
      loadOrders(); // Tải dữ liệu lần đầu
      
      // Lắng nghe sự kiện người dùng gõ vào ô tìm kiếm để lọc ngay lập tức (Real-time search)
      document.getElementById('q').addEventListener('input', renderList);

      // Thiết lập cơ chế tự động cập nhật dữ liệu mỗi 5 giây để theo dõi trạng thái mới nhất
      setInterval(loadOrders, 5000); 
    });
  </script>
</body>
</html>