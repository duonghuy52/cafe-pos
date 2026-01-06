FROM php:8.2-apache

# Cài PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copy project
COPY . /var/www/html/

# Quyền
RUN chown -R www-data:www-data /var/www/html

# dùng biến môi trường PORT do Railway cung cấp
ENV APACHE_LISTEN_PORT=${PORT:-8080}

# Sửa Apache lắng nghe port
RUN sed -i "s/80/${APACHE_LISTEN_PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Mở port
EXPOSE ${APACHE_LISTEN_PORT}

# Chạy Apache foreground
CMD ["apache2-foreground"]
