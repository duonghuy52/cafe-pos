// admin.js - Xử lý logic quản trị sản phẩm (Thêm, Sửa, Xóa, Lọc)

let currentCategory = '';

// Hàm bổ trợ: Định dạng số thành định dạng tiền tệ Việt Nam (ví dụ: 25.000)
function fmt(n){
  try{ return new Intl.NumberFormat('vi-VN').format(Number(n)); }
  catch(e){ return n; }
}

// Hàm lấy danh sách sản phẩm từ API và hiển thị lên giao diện
async function listProducts(search = '', category = ''){
  try {
    const res = await fetch('/api/products.php');
    if (!res.ok) {
      throw new Error('API status: ' + res.status);
    }
    let rows = await res.json();
    
    // Nếu không có dữ liệu trả về, hiển thị dữ liệu mẫu (dummy data)
    if (!rows || rows.length === 0) {
      rows = [
        {id: 1, name: 'Cà phê đen', price: 20000, stock: 50, category: 'coffee'},
        {id: 2, name: 'Trà sữa', price: 35000, stock: 40, category: 'milktea'}
      ];
    }
    
    // Thực hiện lọc theo từ khóa tìm kiếm
    if (search) {
      rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    }
    // Thực hiện lọc theo danh mục sản phẩm
    if (category) {
      rows = rows.filter(r => r.category === category);
    }
    
    // Sắp xếp: Sản phẩm hết hàng hiển thị trước, sau đó sắp xếp theo tên
    rows.sort((a, b) => {
      if (a.stock <= 0 && b.stock > 0) return -1;
      if (a.stock > 0 && b.stock <= 0) return 1;
      return a.name.localeCompare(b.name);
    });
    
    const el = document.getElementById('list');
    if (!el) {
      throw new Error('Element #list not found');
    }
    el.innerHTML = '';
    
    // Cập nhật số lượng sản phẩm hiển thị trên badge
    document.getElementById('count').textContent = rows.length;
    
    // Duyệt qua danh sách để tạo HTML cho từng sản phẩm
    rows.forEach(r=>{
      const row = document.createElement('div');
      row.className = 'prod' + (r.stock <= 0 ? ' out-of-stock' : '');
      const outOfStockText = r.stock <= 0 ? '<span class="out-of-stock-text">BỔ SUNG THÊM</span>' : '';
      row.innerHTML = `
        <div class="prod-info">
          <strong>${r.name}</strong>
          <div class="prod-details">
            <span class="prod-price">💰 ${fmt(r.price)} VND</span>
            <span class="prod-stock">📦 ${r.stock} cái</span>
            ${outOfStockText}
          </div>
        </div>
        <div class="prod-actions">
          <button data-id="${r.id}" class="edit">Sửa</button>
          <button data-id="${r.id}" class="del">Xóa</button>
        </div>
      `;
      el.appendChild(row);
    });
    
    // Gán sự kiện click cho các nút Sửa và Xóa vừa tạo
    document.querySelectorAll('.edit').forEach(b=> b.onclick = ()=> loadProduct(b.dataset.id));
    document.querySelectorAll('.del').forEach(b=> b.onclick = ()=> delProduct(b.dataset.id));
  } catch (err) {
    alert('Error loading products: ' + err.message);
    // Trường hợp lỗi: Hiển thị dòng thông báo lỗi mẫu
    const el = document.getElementById('list');
    if (el) {
      el.innerHTML = '<div class="prod"><div class="prod-info"><strong>Demo Product</strong></div></div>';
      document.getElementById('count').textContent = '1';
    }
  }
}

// Hàm tải chi tiết một sản phẩm và đổ dữ liệu vào Form
async function loadProduct(id){
  const res = await fetch('/api/products.php?id='+encodeURIComponent(id));
  const p = await res.json();
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-stock').value = p.stock;
  document.getElementById('p-category').value = p.category || '';
  document.getElementById('p-description').value = p.description || '';
  document.getElementById('p-image-path').value = p.image || '';
  document.getElementById('p-image-select').value = p.image || '';
  
  // Hiển thị ảnh xem trước (preview) nếu sản phẩm có đường dẫn ảnh
  const previewEl = document.getElementById('image-preview');
  if (p.image) {
    previewEl.innerHTML = `<img src="${p.image}" style="max-width:150px;max-height:150px;border-radius:8px;margin-top:10px;">`;
  } else {
    previewEl.innerHTML = '';
  }
  
  // Tự động cuộn màn hình đến khu vực Form nhập liệu
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Hàm xử lý Lưu sản phẩm (Thêm mới hoặc Cập nhật)
async function save(){
  const id = document.getElementById('p-id').value;
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value) || 0;
  const stock = parseInt(document.getElementById('p-stock').value) || 0;
  const category = document.getElementById('p-category').value.trim() || null;
  const description = document.getElementById('p-description').value.trim() || null;
  const image = document.getElementById('p-image-path').value.trim() || null;
  
  console.log('Save data:', {id, name, price, stock, category, description, image});
  
  // Kiểm tra tính hợp lệ của dữ liệu đầu vào (Validation)
  if(!name) {
    alert('❌ Vui lòng nhập tên sản phẩm');
    return;
  }
  
  if(price <= 0) {
    alert('❌ Giá phải lớn hơn 0');
    return;
  }
  
  if(stock < 0) {
    alert('❌ Số lượng không được âm');
    return;
  }
  
  if(id){
    // Nếu có ID -> Thực hiện cập nhật sản phẩm (PUT)
    const res = await fetch('/api/products.php', {
      method:'PUT', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({id, name, price, stock, category, description, image})
    });
    if(res.ok) { 
      alert('Cập nhật sản phẩm thành công! Hãy quay lại trang POS để thấy thay đổi.'); 
      resetForm(); 
      listProducts(); 
    }
    else alert('❌ Lỗi khi cập nhật');
  } else {
    // Nếu không có ID -> Thực hiện thêm mới sản phẩm (POST)
    const res = await fetch('/api/products.php', {
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({name, price, stock, category, description, image})
    });
    if(res.ok) { 
      alert('Thêm sản phẩm thành công! Hãy quay lại trang POS để thấy thay đổi.'); 
      resetForm(); 
      listProducts(); 
    }
    else alert('❌ Lỗi khi tạo sản phẩm');
  }
}

// Hàm xử lý Xóa sản phẩm
async function delProduct(id){
  if(!confirm('⚠️ Bạn chắc chắn muốn xóa sản phẩm #' + id + ' không?')) return;
  const res = await fetch('/api/products.php', {
    method:'DELETE', 
    headers:{'Content-Type':'application/json'}, 
    body: JSON.stringify({id})
  });
  if(res.ok) { 
    alert('Đã xóa sản phẩm'); 
    listProducts(); 
  }
  else alert('❌ Lỗi khi xóa');
}

// Hàm xóa sạch dữ liệu trên Form (Reset)
function resetForm(){
  document.getElementById('p-id').value = '';
  document.getElementById('p-name').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-stock').value = '';
  document.getElementById('p-category').value = '';
  document.getElementById('p-description').value = '';
  document.getElementById('p-image-path').value = '';
  document.getElementById('p-image-select').value = '';
  document.getElementById('image-preview').innerHTML = '';
}

// Xử lý các sự kiện sau khi toàn bộ cây DOM đã tải xong
document.addEventListener('DOMContentLoaded', function(){
  const imageSelect = document.getElementById('p-image-select');
  const imagePreview = document.getElementById('image-preview');
  const imageFile = document.getElementById('p-image-file');
  
  // Tải danh sách các ảnh đã có sẵn trên máy chủ từ API
  async function loadImageList() {
    try {
      const res = await fetch('/api/images.php');
      const images = await res.json();
      
      images.forEach(img => {
        const option = document.createElement('option');
        option.value = img.path;
        option.textContent = img.filename;
        imageSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading images:', err);
    }
  }
  
  loadImageList();
  
  // Xử lý khi người dùng chọn một ảnh từ danh sách xổ xuống (dropdown)
  if (imageSelect) {
    imageSelect.addEventListener('change', (e) => {
      const imagePath = e.target.value;
      document.getElementById('p-image-path').value = imagePath;
      
      if (imagePath) {
        imagePreview.innerHTML = `<img src="${imagePath}" style="max-width:150px;max-height:150px;border-radius:8px;">`;
      } else {
        imagePreview.innerHTML = '';
      }
    });
  }
  
  // Xử lý sự kiện tải tệp tin ảnh mới lên máy chủ (Upload)
  if (imageFile) {
    imageFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const res = await fetch('/api/upload.php', {
          method: 'POST',
          body: formData
        });
        
        const result = await res.json();
        console.log('Upload response:', result);
        
        if (res.ok) {
          const imagePath = result.path;
          document.getElementById('p-image-path').value = imagePath;
          
          // Sau khi upload thành công, thêm ảnh mới vào danh sách dropdown
          const newOption = document.createElement('option');
          newOption.value = imagePath;
          newOption.textContent = result.filename;
          imageSelect.appendChild(newOption);
          
          // Tự động chọn và hiển thị ảnh vừa tải lên
          imageSelect.value = imagePath;
          imagePreview.innerHTML = `<img src="${imagePath}" style="max-width:150px;max-height:150px;border-radius:8px;">`;
          
          alert('Upload ảnh thành công!');
        } else {
          alert('❌ ' + (result.error || 'Lỗi upload ảnh'));
        }
      } catch (err) {
        alert('❌ Lỗi: ' + err.message);
        console.error('Upload error:', err);
      }
      
      // Reset lại input file để có thể chọn lại cùng một file nếu muốn
      imageFile.value = '';
    });
  }
  
  // Gán sự kiện cho nút Lưu và nút Reset trên giao diện
  document.getElementById('save').onclick = save;
  document.getElementById('reset').onclick = resetForm;
  
  // Lắng nghe sự kiện nhập liệu trên ô tìm kiếm sản phẩm
  document.getElementById('search').addEventListener('input', () => {
    const search = document.getElementById('search').value;
    const category = currentCategory;
    listProducts(search, category);
  });
  
  // Xử lý bộ lọc danh mục (Custom Select)
  const cf = document.getElementById('filter-category');
  if(cf){
    const selected = cf.querySelector('.select-selected');
    const options = cf.querySelector('.select-options');

    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      cf.classList.toggle('open');
    });

    // Tự động đóng bộ lọc khi người dùng click ra vùng bên ngoài
    document.addEventListener('click', (e) => {
      if (!cf.contains(e.target)) {
        cf.classList.remove('open');
      }
    });

    // Gán sự kiện click cho từng mục danh mục sản phẩm (LI)
    const lis = options.querySelectorAll('li');
    lis.forEach(li => {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        currentCategory = li.dataset.value;
        selected.textContent = li.textContent;
        cf.classList.remove('open');
        const search = document.getElementById('search').value;
        listProducts(search, currentCategory);
      });
    });
  }
  
  // Tải danh sách sản phẩm lần đầu khi mở trang
  listProducts();
  
  // Hiệu ứng mờ dần (fade in) cho trang web sau khi nạp xong
  setTimeout(() => document.body.classList.add('loaded'), 100);
});
