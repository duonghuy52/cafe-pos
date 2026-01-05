// report.js - Tải dữ liệu báo cáo doanh thu và xử lý xuất tệp CSV

// Hàm chuyển đổi dữ liệu mảng thành định dạng chuỗi CSV
function toCSV(rows) {
    if (!rows || rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(',')];
    rows.forEach(r => { 
        lines.push(keys.map(k => '"' + ((r[k] === null || typeof r[k] === 'undefined') ? '' : r[k]) + '"').join(',')); 
    });
    return lines.join('\n');
}

// Hàm chính để tải dữ liệu báo cáo từ API dựa trên khoảng thời gian
async function load() {
    const s = document.getElementById('start').value;
    const e = document.getElementById('end').value;
    const url = '/cafe-pos/api/report.php?start=' + encodeURIComponent(s) + '&end=' + encodeURIComponent(e);
    const res = await fetch(url);
    const data = await res.json();
    
    // Kiểm tra phản hồi từ API
    if (!data.ok) return alert('Lỗi: ' + (data.error || 'Không tải được'));

    // Hiển thị bảng tổng hợp doanh thu (Summary)
    const sumT = document.getElementById('summary').querySelector('tbody');
    if (data.summary.length === 0) {
        sumT.innerHTML = '<tr><td colspan="3" class="empty">Không có dữ liệu</td></tr>';
    } else {
        sumT.innerHTML = data.summary.map(r => `<tr><td>${r.day}</td><td>${r.orders_count}</td><td><strong>${new Intl.NumberFormat('vi-VN').format(r.revenue)} VND</strong></td></tr>`).join('');
    }

    // Lưu trữ danh sách đơn hàng vào biến toàn cục để phục vụ lọc dữ liệu tại Client
    window.LAST_ORDERS = data.orders;

    // Hàm nội bộ để hiển thị danh sách đơn hàng (có hỗ trợ lọc và bôi đậm từ khóa tìm kiếm)
    const renderOrders = (orders, q) => {
        const ordT = document.getElementById('orders').querySelector('tbody');
        if (!orders || orders.length === 0) {
            ordT.innerHTML = '<tr><td colspan="8" class="empty">Không có đơn hàng</td></tr>';
            return;
        }
        
        // Các hàm bổ trợ xử lý chuỗi và bảo mật XSS
        const safe = (s) => (s === null || typeof s === 'undefined') ? '' : String(s);
        const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Hàm bôi đậm từ khóa tìm kiếm trong văn bản
        const highlight = (text, q) => {
            if (!q) return escape(text);
            const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
            return escape(text).replace(re, '<mark class="search-hit">$1</mark>');
        };

        // Tạo HTML cho từng dòng đơn hàng
        ordT.innerHTML = orders.map(o => {
            const displayCode = o.code ? o.code : ('#' + o.id);
            const prodText = o.products ? o.products.split('||').join(', ') : '';
            return `<tr data-id="${o.id}">
      <td>${highlight(displayCode, q)}</td>
      <td>${highlight(safe(o.created_by), q)}</td>
      <td>${highlight(safe(o.customer_name), q)}</td>
      <td>${highlight(safe(o.customer_phone), q)}</td>
      <td>${highlight(safe(o.table_number), q)}</td>
      <td><strong>${new Intl.NumberFormat('vi-VN').format(o.total)} VND</strong></td>
      <td>${o.created_at}</td>
      <td>
        <a target="_blank" href="/cafe-pos/public/invoice.php?order_id=${o.id}">🖨️ In hóa đơn</a>
        <button class="del-order" data-id="${o.id}" style="margin-left:8px;padding:6px 8px;border-radius:6px;border:2px solid #fee2e2;background:#fee2e2;cursor:pointer">Xóa</button>
      </td>
    </tr>`;
        }).join('');

        // Gán sự kiện xóa đơn hàng cho các nút vừa tạo
        ordT.querySelectorAll('.del-order').forEach(b => b.addEventListener('click', async(e) => {
            const id = b.dataset.id;
            b.disabled = true;
            b.style.opacity = '0.6';
            try {
                const res = await fetch('/cafe-pos/api/orders.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                if (res.ok) {
                    // Tải lại danh sách sau khi xóa thành công
                    load();
                } else {
                    const err = await res.json().catch(() => ({ error: 'unknown' }));
                    console.error('Delete order error', err);
                    b.disabled = false;
                    b.style.opacity = '';
                }
            } catch (err) {
                console.error('Delete order network error', err);
                b.disabled = false;
                b.style.opacity = '';
            }
        }));

        // Hiệu ứng nháy sáng nhẹ cho dòng đầu tiên khi thực hiện lọc
        if (q) {
            const first = document.querySelector('#orders tbody tr');
            if (first) {
                first.classList.add('search-active-row');
                setTimeout(() => first.classList.remove('search-active-row'), 900);
            }
        }
    };

    // Hiển thị toàn bộ danh sách ban đầu khi chưa lọc
    renderOrders(window.LAST_ORDERS, null);

    // Thiết lập logic cho ô tìm kiếm (Search box)
    const qEl = document.getElementById('q');
    const qClear = document.getElementById('q_clear');
    if (qEl) {
        let timer = null;
        const doFilter = () => {
            const q = (qEl.value || '').trim().toLowerCase();
            qClear.style.display = q ? 'block' : 'none';
            if (!q) {
                renderOrders(window.LAST_ORDERS, null);
                return;
            }
            // Lọc danh sách đơn hàng dựa trên nhiều tiêu chí (Mã, người bán, khách hàng, bàn...)
            const filtered = window.LAST_ORDERS.filter(o => {
                const code = (o.code || '').toLowerCase();
                const seller = (o.created_by || '').toLowerCase();
                const cname = (o.customer_name || '').toLowerCase();
                const phone = (o.customer_phone || '').toLowerCase();
                const table = (String(o.table_number || '')).toLowerCase();
                const prods = (o.products || '').toLowerCase();
                return code.includes(q) || seller.includes(q) || cname.includes(q) || phone.includes(q) || table.includes(q) || prods.includes(q) || String(o.id).includes(q);
            });
            renderOrders(filtered, q);
        };
        
        // Sử dụng debounce để giảm tần suất thực hiện lọc khi người dùng nhập liệu
        qEl.addEventListener('input', () => { 
            clearTimeout(timer);
            timer = setTimeout(doFilter, 220); 
        });
        
        // Xử lý phím Escape để xóa nhanh nội dung tìm kiếm
        qEl.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape') { qEl.value = ''; doFilter(); } 
        });
        
        // Xử lý khi nhấn nút "X" để xóa nội dung tìm kiếm
        qClear.addEventListener('click', (e) => { 
            qEl.value = '';
            qClear.style.display = 'none';
            renderOrders(window.LAST_ORDERS, null);
            qEl.focus(); 
        });
    }
}

// Thiết lập các giá trị mặc định và sự kiện khi trang web tải xong
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    // Định dạng ngày kết thúc là hôm nay
    const end = now.toISOString().slice(0, 10);
    // Định dạng ngày bắt đầu là 6 ngày trước (tổng cộng 7 ngày)
    const start = new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    
    document.getElementById('start').value = start;
    document.getElementById('end').value = end;
    
    // Gán sự kiện click cho nút Tải báo cáo
    document.getElementById('load').onclick = load;
    
    // Gán sự kiện cho nút xuất tệp CSV
    document.getElementById('csv').onclick = async() => {
        const s = document.getElementById('start').value;
        const e = document.getElementById('end').value;
        const res = await fetch('/cafe-pos/api/report.php?start=' + encodeURIComponent(s) + '&end=' + encodeURIComponent(e));
        const data = await res.json();
        if (!data.ok) return alert('Lỗi');
        
        // Tạo tệp CSV từ dữ liệu tổng hợp (summary)
        const csv = toCSV(data.summary);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Tạo liên kết ẩn và kích hoạt tải về
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${s}_${e}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    
    // Thực hiện tải báo cáo lần đầu tiên
    load();
});

// Kích hoạt hiệu ứng hiển thị trang sau khi tải xong hoàn toàn
setTimeout(() => document.body.classList.add('loaded'), 100);