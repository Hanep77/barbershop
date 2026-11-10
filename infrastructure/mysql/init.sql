-- BarberBrody database provisioning for the dedicated MySQL VM.
-- Run as an administrative MySQL user, replacing the placeholders with the
-- values stored in infrastructure/secrets/db_password_*.txt.
--
-- Each service user gets privileges only on its own schema. No cross-service
-- grants are issued.

CREATE DATABASE IF NOT EXISTS identity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS catalog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'identity_user'@'%' IDENTIFIED BY '__IDENTITY_PASSWORD__';
CREATE USER IF NOT EXISTS 'catalog_user'@'%' IDENTIFIED BY '__CATALOG_PASSWORD__';
CREATE USER IF NOT EXISTS 'booking_user'@'%' IDENTIFIED BY '__BOOKING_PASSWORD__';
CREATE USER IF NOT EXISTS 'payment_user'@'%' IDENTIFIED BY '__PAYMENT_PASSWORD__';

GRANT ALL PRIVILEGES ON identity_db.* TO 'identity_user'@'%';
GRANT ALL PRIVILEGES ON catalog_db.* TO 'catalog_user'@'%';
GRANT ALL PRIVILEGES ON booking_db.* TO 'booking_user'@'%';
GRANT ALL PRIVILEGES ON payment_db.* TO 'payment_user'@'%';

FLUSH PRIVILEGES;
