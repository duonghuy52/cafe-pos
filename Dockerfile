# Dùng image PHP + Apache
FROM php:8.2-apache

# Cài PDO MySQL và các extension cần thiết
RUN docker-php-ext-install pdo pdo_mysql

# Copy toàn bộ project vào container
COPY . /var/www/html/

# Thiết lập quyền (nếu cần)
RUN chown -R www-data:www-data /var/www/html

# Chuyển Apache lắng nghe port 8080
RUN sed -i 's/80/8080/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Mở port 8080
EXPOSE 8080
