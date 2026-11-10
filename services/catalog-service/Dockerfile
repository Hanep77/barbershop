# syntax=docker/dockerfile:1.7

FROM composer:2 AS vendor
WORKDIR /app
COPY services/catalog-service/composer.json services/catalog-service/composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-autoloader --ignore-platform-reqs
COPY services/catalog-service/ .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative --no-scripts \
    && php artisan package:discover --ansi

FROM php:8.4-fpm-alpine AS app
RUN apk add --no-cache icu-dev oniguruma-dev libzip-dev fcgi libpq \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev \
    && docker-php-ext-install -j$(nproc) pdo_pgsql bcmath intl opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY infrastructure/docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY infrastructure/docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html
COPY --from=vendor --chown=www-data:www-data /app /var/www/html
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
    CMD php -r '$s=@fsockopen("127.0.0.1",9000); exit($s?0:1);'

FROM nginx:1.27-alpine AS web
ENV UPSTREAM=catalog-service-app:9000

COPY infrastructure/docker/nginx/laravel.conf.template /etc/nginx/templates/default.conf.template
COPY --from=vendor /app/public /var/www/html/public
RUN mkdir -p /var/www/html/storage/app/public \
    && ln -s /var/www/html/storage/app/public /var/www/html/public/storage

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
    CMD wget -qO- http://127.0.0.1/up >/dev/null || exit 1