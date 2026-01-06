FROM php:8.1-apache

# Cài đặt Driver MySQL và bật Rewrite URL (quan trọng để routing hoạt động)
RUN docker-php-ext-install pdo pdo_mysql && a2enmod rewrite

# Copy toàn bộ source code vào thư mục web
COPY . /var/www/html/

# Phân quyền cho thư mục html (để chức năng upload ảnh hoạt động)
RUN chown -R www-data:www-data /var/www/html

# Mở cổng 80
EXPOSE 80
