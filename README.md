# ✂️ BarberBrody

BarberBrody is a modern, full-stack barbershop marketplace and management system. It connects customers with local barbershops while providing shop owners with a powerful dashboard to manage their services, barbers, and appointments.

---

## 🚀 Features

### For Customers
- **🔍 Smart Search:** Find barbershops by name, location, or services.
- **📅 Easy Booking:** Seamlessly book appointments with your preferred barbers.
- **📍 Location Integration:** Interactive maps using Leaflet to find shops near you.
- **⭐ Ratings & Reviews:** Read and leave feedback for services.
- **📱 Responsive Design:** Optimized for both mobile and desktop experiences.

### For Barbershop Owners (Admin)
- **📊 Analytics Dashboard:** Monitor bookings and shop performance at a glance.
- **💇 Service Management:** Create and organize service categories and individual offerings.
- **👥 Staff Management:** Manage barber profiles and schedules.
- **📅 Booking Management:** View and update incoming appointments.
- **⚙️ Profile Customization:** Fully customize your shop's public profile and branding.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** [Laravel 12](https://laravel.com/)
- **Authentication:** [Laravel Sanctum](https://laravel.com/docs/sanctum) & [Socialite](https://laravel.com/docs/socialite) (OAuth)
- **Database:** MySQL
- **Tooling:** Composer, Artisan, PHPUnit

### Frontend
- **Library:** [React 19](https://react.dev/)
- **Language:** TypeScript
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **UI Components:** Radix UI, Lucide Icons, Framer Motion
- **Maps:** Leaflet & React-Leaflet

---

## 📦 Installation & Setup

### Prerequisites
- PHP 8.2+
- Node.js & npm/pnpm
- Composer
- MySQL

### 1. Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd barbershop

# Install PHP dependencies
composer install

# Set up environment variables
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start the Laravel server
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend

# Install JavaScript dependencies
npm install

# Start the development server
npm run dev
```

---

## 🗺️ Project Structure

```text
├── app/                # Laravel Core (Models, Controllers, Policies)
├── config/             # Backend Configuration
├── database/           # Migrations, Factories, and Seeders
├── frontend/           # React Frontend Source
│   ├── src/
│   │   ├── app/        # Routes and Layouts
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Feature-specific Pages
│   │   ├── services/   # API Communication (Axios)
│   │   ├── store/      # Zustand State Management
│   │   └── types/      # TypeScript Definitions
├── routes/             # API and Web Routes
└── public/             # Static Assets
```

---

## 🧪 Testing

Run backend tests using PHPUnit:
```bash
php artisan test
```

---

## 🧩 Microservices Architecture (`feat/barberbrody-microservices`)

The monolith at the repository root remains intact while the same application
is split into four independently buildable Laravel services plus a gateway:

```text
services/
├── identity-service/   # users, JWT auth, refresh tokens, notifications
├── catalog-service/    # barbershops, images, services, capsters, ratings
├── booking-service/    # bookings, availability, cancellation, dashboard composition
└── payment-service/    # Xendit, payments, refunds, withdrawals, ledger/balance

frontend/               # React SPA (JWT bearer + refresh)
infrastructure/
├── docker/             # Dockerfiles targets, compose, production overlay
├── gateway/            # Traefik static + dynamic configuration
├── mysql/              # per-service DB/user provisioning
├── migration/          # monolith → services data migration + validator
├── scripts/            # secrets generation, smoke tests
└── monitoring/         # reserved for the next phase
docs/                   # architecture, mapping, contracts, deployment, testing
```

Key points:

- Auth: JWT RS256 access token (15 min) + rotating refresh token (7 days).
- Database: one MySQL server, four schemas (`identity_db`, `catalog_db`,
  `booking_db`, `payment_db`), one least-privilege user each, no cross-service
  FK or SQL.
- Sync calls: `/internal/*` REST with a shared token on the internal Docker
  network; never routed by Traefik.
- Async: Redis Streams + transactional outbox + idempotent consumers.
- Gateway: Traefik only exposes 80/443; Docker socket through a read-only
  proxy; TLS in the production overlay.
- Money is owned by Payment; booking price/duration and identity names are
  snapshotted into bookings.

Quick start (application host):

```bash
bash infrastructure/scripts/generate-dev-secrets.sh   # replace Xendit/Google/Pusher values
cp infrastructure/docker/.env.example .env             # set DB_HOST / PUBLIC_URL
docker compose -f infrastructure/docker/compose.yaml config
docker compose -f infrastructure/docker/compose.yaml up -d --build
```

Full instructions: [`docs/deployment-guide.md`](docs/deployment-guide.md).
Architecture: [`docs/architecture.md`](docs/architecture.md).
API contracts: [`docs/api-contracts.md`](docs/api-contracts.md).
Testing: [`docs/testing-report.md`](docs/testing-report.md).
Known limitations: [`docs/known-limitations.md`](docs/known-limitations.md).

The legacy monolith setup below still works on the original branch.
