#!/bin/sh
set -e

# Resolve Docker secrets referenced through *_FILE environment variables.
for file_var in $(env | cut -d= -f1 | grep '_FILE$'); do
    target_var="${file_var%_FILE}"
    file_path="$(printenv "$file_var" || true)"
    if [ -n "$file_path" ] && [ -f "$file_path" ]; then
        value="$(cat "$file_path")"
        export "$target_var=$value"
    fi
done

mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
php artisan storage:link >/dev/null 2>&1 || true

exec "$@"
