FROM php:8.2-apache

# Cài PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Copy project
COPY . /var/www/html/

# Chỉnh quyền
RUN chown -R www-data:www-data /var/www/html
