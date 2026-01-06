# Sử dụng Image PHP 8.1 kèm Apache
FROM php:8.1-apache

# Cài đặt extension pdo_mysql cần thiết
RUN docker-php-ext-install pdo pdo_mysql

# Bật mod_rewrite của Apache (để Router hoạt động tốt)
RUN a2enmod rewrite

# Copy toàn bộ code vào thư mục web của Apache
COPY . /var/www/html/

# Thiết lập quyền sở hữu cho thư mục html để upload ảnh hoạt động
# (Lệnh này quan trọng cho chức năng upload ảnh)
RUN chown -R www-data:www-data /var/www/html

# Cấu hình lại DocumentRoot nếu cần (mặc định là /var/www/html là đúng với code của bạn)
# Mở port 80 (Port mặc định của container)
EXPOSE 80
