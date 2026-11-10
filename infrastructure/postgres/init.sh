#!/bin/sh
# Creates one least-privilege role and one database per service.
# Runs once on an empty PostgreSQL data directory. When executed by the
# postgres image's entrypoint, the db passwords are mounted at /run/secrets.
# On a standalone server, point SECRETS_DIR at the copied secret files.
set -eu

SECRETS_DIR="${SECRETS_DIR:-/run/secrets}"

provision() {
    service="$1"
    role="${service}_user"
    database="${service}_db"
    password_file="${SECRETS_DIR}/db_password_${service}"

    if [ ! -f "$password_file" ]; then
        echo "missing secret: $password_file" >&2
        exit 1
    fi

    password="$(cat "$password_file")"

    if [ "$(psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '${role}'")" = "1" ]; then
        psql -v ON_ERROR_STOP=1 -c "ALTER ROLE \"${role}\" WITH LOGIN PASSWORD '${password}'"
    else
        psql -v ON_ERROR_STOP=1 -c "CREATE ROLE \"${role}\" LOGIN PASSWORD '${password}'"
    fi

    if [ "$(psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${database}'")" != "1" ]; then
        createdb --owner "$role" "$database"
    fi

    echo "provisioned ${database} for ${role}"
}

provision identity
provision catalog
provision booking
provision payment
