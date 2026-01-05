<?php
// public/status.php - Trang hiển thị danh sách đơn hàng đang chờ và xử lý duyệt đơn
session_start();

// Kiểm tra trạng thái đăng nhập
if (!isset($_SESSION['user'])) {
    header('Location: /cafe-pos/public/login.php');
    exit;
}

// Cho phép tất cả người dùng đã đăng nhập xem trạng thái; các hành động quản trị vẫn được giới hạn
// (Trước đây trang này trả về lỗi 403 đối với người dùng không phải admin)

?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Trạng thái - Cafe POS</title>
  <link rel="stylesheet" href="/cafe-pos/assets/css/admin.css">
</head>
<body class="loaded">
  <div class="admin-container">
    <div class="admin-header">
      <div>
        <h1>Trạng thái hệ thống</h1>
        <p class="header-subtitle">Trang tạm thời — nội dung sẽ được triển khai sau.</p>
      </div>
      <div class="user-info">
        <?php echo htmlspecialchars($_SESSION['user']['username']); ?>
        <a href="/cafe-pos/api/logout.php" class="logout-btn">Đăng xuất</a>
        <a href="/cafe-pos/public/index.php" class="back-btn">Về POS</a>
      </div>
  <script>window.CAFE_POS_USER = <?php echo json_encode(['id'=> $_SESSION['user']['id'], 'username' => $_SESSION['user']['username'], 'role' => $_SESSION['user']['role']]); ?>;</script>
    </div>

    <div class="section">
      <h2>Đơn hàng</h2>
      <div id="ordersList">
        </div>
    </div>
  </div>

  <script>
    // Hàm tải danh sách đơn hàng đang chờ duyệt từ API
    async function loadOrders(){
      // Gửi yêu cầu chỉ lấy các đơn hàng có trạng thái 'pending'
      const res = await fetch('/cafe-pos/api/report.php?status=pending');
      const data = await res.json();
      
      // Kiểm tra phản hồi từ API
      if(!data.ok){ document.getElementById('ordersList').innerHTML = '<div class="empty">Không tải được dữ liệu</div>'; return; }
      
      const orders = data.orders;
      
      // Hiển thị thông báo nếu không có đơn hàng nào
      if(!orders || orders.length===0){ document.getElementById('ordersList').innerHTML = '<div class="empty">Không có đơn hàng đang chờ duyệt</div>'; return; }
      
      // Duyệt qua mảng đơn hàng để tạo mã HTML hiển thị
      const html = orders.map(o=>{
        const status = o.status || 'unknown';
        // Thiết lập màu sắc nền dựa trên trạng thái
        const color = status === 'pending' ? 'background:linear-gradient(90deg,#fef3c7,#fef08a);' : (status === 'confirmed' ? 'background:linear-gradient(90deg,#d1fae5,#86efac);' : 'background:#fff');
        
        const customer = (o.customer_name ? o.customer_name : '') + (o.customer_phone ? (' / '+o.customer_phone) : '');
        const table = o.table_number ? ('Bàn ' + o.table_number) : '';
        
        // Chỉ hiển thị nút 'Duyệt' nếu đơn hàng đang ở trạng thái 'pending'
        const action = (status === 'pending') ? `<button data-id="${o.id}" class="approve btn-primary" style="padding:6px 10px;">Duyệt</button>` : '';
        const code = o.code ? o.code : ('#' + o.id);
        
        return `<div style="padding:12px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;${color}">
          <div>
            <div style="font-weight:700">${code} — ${new Intl.NumberFormat('vi-VN').format(o.total)} VND</div>
            <div style="color:#6b7280;font-size:13px">${o.created_at} • Người bán: ${o.created_by ? o.created_by : '—' } • ${table} ${customer ? (' • '+customer) : ''}</div>
            <div style="color:#d97706;font-size:12px;font-weight:600;">Đang chờ duyệt</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">${action}<a class="btn-secondary" href="/cafe-pos/public/invoice.php?order_id=${o.id}" target="_blank" style="padding:6px 10px;text-decoration:none;">In</a></div>
        </div>`;
      }).join('');
      
      document.getElementById('ordersList').innerHTML = html;

      // Gán sự kiện click cho tất cả các nút 'Duyệt' vừa được tạo
      document.querySelectorAll('.approve').forEach(b=> b.addEventListener('click', async (ev)=>{
        const btn = ev.currentTarget;
        const id = btn.dataset.id;
        
        // Mở cửa sổ trống ngay lập tức để tránh bị trình duyệt chặn Popup (chúng ta sẽ điều hướng nó sau khi duyệt thành công)
        let printWin = null;
        try { printWin = window.open('', '_blank'); } catch (e) { printWin = null; }
        
        // Vô hiệu hóa nút để ngăn chặn người dùng nhấn nhiều lần
        btn.disabled = true;
        const prevText = btn.textContent;
        btn.textContent = 'Đang duyệt...';
        
        try {
          // Gửi yêu cầu cập nhật trạng thái đơn hàng thành 'confirmed' (đã duyệt)
          const res = await fetch('/cafe-pos/api/orders.php', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: id, status: 'confirmed'}) });
          
          if(res.ok){
            // Mở hóa đơn: Điều hướng cửa sổ đã mở trước đó tới URL hóa đơn để tránh bị chặn Popup
            const invoiceUrl = '/cafe-pos/public/invoice.php?order_id=' + encodeURIComponent(id);
            try {
              if (printWin && !printWin.closed) {
                printWin.location.href = invoiceUrl;
                printWin.focus();
              } else {
                window.open(invoiceUrl, '_blank');
              }
            } catch (e) {
              try { window.open(invoiceUrl, '_blank'); } catch (err) {}
            }

            // Cập nhật trạng thái nút bấm trên giao diện mà không cần reload toàn bộ trang
            btn.textContent = 'Đã duyệt';
            btn.disabled = true;
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            
            // Hiệu ứng phóng to nhẹ để thông báo thành công
            try { btn.animate([{transform: 'scale(1.02)'},{transform:'scale(1)'}], { duration: 260 }); } catch (e) {}
            
            // Tải lại danh sách đơn hàng sau một khoảng thời gian ngắn
            setTimeout(() => loadOrders(), 220);
          }
          else { 
            const err = await res.json().catch(() => ({})); 
            btn.disabled = false; 
            btn.textContent = prevText; 
            if (printWin && !printWin.closed) try { printWin.close(); } catch(e) {} 
          }
        } catch (err) {
          alert('Lỗi kết nối: ' + (err.message || '')); 
          btn.disabled = false; 
          btn.textContent = prevText; 
          if (printWin && !printWin.closed) try { printWin.close(); } catch(e) {}
        }
      }));
    }

    // Tải danh sách đơn hàng ngay khi trang web nạp xong tài liệu
    document.addEventListener('DOMContentLoaded', ()=>{
      loadOrders();
    });
  </script>
</body>
</html>