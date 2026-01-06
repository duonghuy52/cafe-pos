# 1. Sử dụng PHP 8.1 kèm Apache (Image này mặc định dùng Port 80)
FROM php:8.1-apache

# 2. Cài đặt Driver MySQL và bật Rewrite URL
# Chỉ chạy đúng lệnh này, không cài thêm cái gì khác để tránh xung đột
RUN docker-php-ext-install pdo pdo_mysql && a2enmod rewrite

# 3. Copy mã nguồn vào thư mục gốc của Apache
COPY . /var/www/html/

# 4. Phân quyền cho user www-data (để Apache có thể đọc/ghi file ảnh)
RUN chown -R www-data:www-data /var/www/html

# 5. Thông báo mở cổng 80 (Cổng mặc định của Apache)
EXPOSE 80
