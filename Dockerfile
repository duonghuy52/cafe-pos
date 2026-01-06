# 1. Sử dụng PHP 8.1 kèm Apache
FROM php:8.1-apache

# 2. Cài đặt Driver MySQL (pdo_mysql) và bật Rewrite URL
RUN docker-php-ext-install pdo pdo_mysql && a2enmod rewrite

# 3. Copy toàn bộ code vào thư mục web
COPY . /var/www/html/

# 4. Phân quyền cho thư mục (để upload ảnh hoạt động)
RUN chown -R www-data:www-data /var/www/html

# 5. CẤU HÌNH CỔNG 8080 (Fix lỗi Crash)
# Lệnh này ép Apache lắng nghe ở cổng 8080 thay vì 80 mặc định
RUN sed -i 's/80/8080/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 6. Mở cổng 8080
EXPOSE 8080
