// login.js - Xử lý các sự kiện đăng nhập cho hệ thống
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.querySelector('.btn-login');

    if (!username || !password) {
        showError('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';

    try {
        const response = await fetch('/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        let data = {};
        try {
            data = await response.json();
        } catch (jsonError) {
            showError('Server trả về dữ liệu không hợp lệ');
            return;
        }

        if (data.ok) {
            // Thành công
            errorMessage.classList.remove('show');
            errorMessage.style.background = '#dcfce7';
            errorMessage.style.borderColor = '#86efac';
            errorMessage.style.color = '#166534';
            errorMessage.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
            errorMessage.classList.add('show');

            setTimeout(() => {
                window.location.href = '/public/index.php';
            }, 1000);
        } else {
            showError(data.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
        }
    } catch (err) {
        showError('Lỗi kết nối: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
    }
});

// Hàm hiển thị thông báo lỗi
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    errorMessage.style.background = '#fee2e2';
    errorMessage.style.borderColor = '#fecaca';
    errorMessage.style.color = '#991b1b';
}

// Nhấn Enter tại ô mật khẩu
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
    }
});

// Modal đăng ký 
(function() {
    function createRipple(el, ev, color) {
        if (!el) return;
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.style.overflow = 'hidden';
        const r = document.createElement('span');
        r.className = 'ripple';
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        r.style.width = r.style.height = size + 'px';
        const cx = ev && ev.clientX ? ev.clientX : rect.left + rect.width / 2;
        const cy = ev && ev.clientY ? ev.clientY : rect.top + rect.height / 2;
        r.style.left = (cx - rect.left - size / 2) + 'px';
        r.style.top = (cy - rect.top - size / 2) + 'px';
        r.style.position = 'absolute';
        r.style.borderRadius = '50%';
        r.style.background = color || 'rgba(255,255,255,0.5)';
        r.style.transform = 'scale(0)';
        r.style.opacity = '0.6';
        r.style.pointerEvents = 'none';
        r.style.animation = 'ripple 520ms cubic-bezier(.2,.9,.2,1)';
        el.appendChild(r);
        r.addEventListener('animationend', () => r.remove());
        setTimeout(() => { try { r.remove() } catch (e) {} }, 700);
    }

    const btn = document.getElementById('btn-register');
    if (!btn) return;
    btn.addEventListener('click', (ev) => {
        createRipple(btn, ev, 'rgba(255,255,255,0.12)');
        showRegisterModal();
    });

    function showRegisterModal() {
        const overlay = document.createElement('div');
        overlay.className = 'reg-overlay';
        const dialog = document.createElement('div');
        dialog.className = 'reg-dialog';
        dialog.innerHTML = `
            <h3>🔐 Tạo tài khoản mới</h3>
            <div class="reg-form">
                <div class="form-group"><label>Tên tài khoản</label><input id="reg_username" type="text" placeholder="Tên đăng nhập" autocomplete="username"></div>
                <div class="form-group"><label>Mật khẩu</label><input id="reg_password" type="password" placeholder="Mật khẩu (>=6 ký tự)" autocomplete="new-password"></div>
                <div class="form-group"><label>Nhập lại mật khẩu</label><input id="reg_password2" type="password" placeholder="Nhập lại mật khẩu" autocomplete="new-password"></div>
                <div id="reg_msg" class="inline-msg"></div>
                <div class="reg-actions"><button id="reg_cancel" class="btn-danger">Hủy</button><button id="reg_create" class="btn-primary create">Tạo tài khoản ngay</button></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.appendChild(dialog);
        setTimeout(() => dialog.classList.add('open'), 10);

        const inUser = dialog.querySelector('#reg_username');
        const inPass = dialog.querySelector('#reg_password');
        const inPass2 = dialog.querySelector('#reg_password2');
        const msg = dialog.querySelector('#reg_msg');
        const cancel = dialog.querySelector('#reg_cancel');
        const create = dialog.querySelector('#reg_create');

        cancel.addEventListener('click', (e) => {
            createRipple(cancel, e, 'rgba(0,0,0,0.06)');
            dialog.classList.remove('open');
            setTimeout(() => overlay.remove(), 260);
        });

        create.addEventListener('click', async (e) => {
            createRipple(create, e, 'rgba(255,255,255,0.12)');
            const u = (inUser.value || '').trim();
            const p = inPass.value || '';
            const p2 = inPass2.value || '';
            msg.className = 'inline-msg';

            if (!u || !p || !p2) {
                msg.textContent = 'Vui lòng điền tất cả các trường.';
                msg.classList.add('error');
                return;
            }
            if (p.length < 6) {
                msg.textContent = 'Mật khẩu phải ít nhất 6 ký tự.';
                msg.classList.add('error');
                return;
            }
            if (p !== p2) {
                msg.textContent = 'Mật khẩu không khớp.';
                msg.classList.add('error');
                return;
            }

            create.disabled = true;
            create.textContent = '⏳ Đang tạo...';

            try {
                const res = await fetch('/api/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                });

                let d = {};
                try { d = await res.json(); } catch(e) { d = {}; }

                if (res.ok && d.ok) {
                    msg.textContent = 'Tạo tài khoản thành công! Vui lòng đăng nhập.';
                    msg.classList.remove('error');
                    msg.classList.add('success');
                    document.getElementById('username').value = u;
                    setTimeout(() => {
                        dialog.classList.remove('open');
                        setTimeout(() => overlay.remove(), 260);
                    }, 900);
                } else {
                    msg.textContent = d.error || 'Tên đăng nhập đã tồn tại hoặc lỗi tạo tài khoản';
                    msg.classList.add('error');
                }

            } catch (err) {
                msg.textContent = 'Lỗi kết nối: ' + (err.message || '');
                msg.classList.add('error');
            } finally {
                create.disabled = false;
                create.textContent = 'Tạo tài khoản ngay';
            }
        });

        [inUser, inPass2].forEach(i => i.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') create.click(); }));
    }
})();
