# Deployment Guide — Proxmox VE + Debian + Docker Compose

Target: two Debian VMs on Proxmox VE.

| VM | Role | Suggested specs |
|---|---|---|
| `bb-app` | Docker Engine + Compose (Traefik, frontend, 4 services, Redis) | 4 vCPU, 8 GB RAM, 40 GB disk |
| `bb-db` | PostgreSQL 17 server | 2 vCPU, 4 GB RAM, 40 GB disk |

No Kubernetes, K3s or Swarm. Docker Compose is the only orchestrator.

## 1. Prepare the application VM

```bash
# Debian 12, as root
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

Add the deployment user to the `docker` group, or use `sudo` for the commands
below.

## 2. Prepare the database VM

```bash
apt install -y postgresql
```

Bind PostgreSQL to the private Proxmox network only
(`/etc/postgresql/*/main/postgresql.conf`):

```ini
listen_addresses = '10.10.10.11'
```

Allow the application VM in `pg_hba.conf`:

```ini
host    all             all             10.10.10.10/32         scram-sha-256
```

Restart PostgreSQL, then copy the generated
`infrastructure/secrets/db_password_*.txt` files to the database VM and run the
provisioning script there. It creates one role and one database per service and
grants nothing outside that database:

```bash
sudo SECRETS_DIR=/path/to/secrets sh infrastructure/postgres/init.sh
```

Open PostgreSQL only to the application VM (Proxmox firewall / `ufw`):

```bash
ufw allow from 10.10.10.10 to any port 5432 proto tcp
```

## 3. Get the code and secrets

```bash
git clone https://github.com/Hanep77/barbershop.git
cd barbershop
git switch feat/barberbrody-microservices
```

Generate the local secrets (then replace Xendit/Google/Pusher placeholders):

```bash
bash infrastructure/scripts/generate-dev-secrets.sh
```

Or copy an existing production JWT key pair into
`infrastructure/secrets/jwt-private.pem` and `jwt-public.pem`. The private key is
mounted only into `identity-app`/`identity-worker`.

Create `.env` from `infrastructure/docker/.env.example`:

```dotenv
PUBLIC_URL=https://barberbrody.example.com
DB_HOST=10.10.10.11
DB_PORT=5432
DB_SSLMODE=prefer
ACME_EMAIL=admin@example.com
GOOGLE_CLIENT_ID=...
PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_CLUSTER=ap1
XENDIT_BASE_URL=https://api.xendit.co
```

For production set `TRAEFIK_ENTRYPOINTS=websecure` (Traefik redirects HTTP to
HTTPS and uses the Let's Encrypt resolver).

## 4. Build and run

```bash
docker compose -f infrastructure/docker/compose.yaml config   # validate
docker compose -f infrastructure/docker/compose.yaml build
docker compose -f infrastructure/docker/compose.yaml up -d
docker compose -f infrastructure/docker/compose.yaml ps
```

Production (TLS, port 443):

```bash
docker compose -f infrastructure/docker/compose.yaml \
               -f infrastructure/docker/compose.production.yaml \
               --env-file .env up -d --build
```

Run migrations once per service:

```bash
for s in identity catalog booking payment; do
  docker compose run --rm ${s}-app php artisan migrate --force
done
```

## 5. DNS and TLS

- Point `barberbrody.example.com` A/AAAA record to the app VM.
- Allow inbound TCP 80/443 (ACME HTTP challenge needs 80).
- Traefik obtains the certificate from Let's Encrypt and stores it in the
  `traefik_acme` volume.
- For local development use the base compose file: HTTP only, no certificate.

## 6. Verify

```bash
curl -fsS http://localhost/up                        # individual service (inside network)
curl -fsS https://barberbrody.example.com/            # frontend
curl -fsS https://barberbrody.example.com/api/barbershop
curl -i -X POST https://barberbrody.example.com/api/payments/webhook/xendit
# expected: 401/503 when the token is missing/unconfigured, never 200
```

Routing smoke tests are in `infrastructure/scripts/smoke-test.sh`.

## 7. Operations

- Logs: `docker compose logs -f --tail=100 <service>` (JSON logs capped at
  10 MB × 3 files per container).
- Restart policy: `unless-stopped`.
- Health: `docker compose ps`; app containers check PHP-FPM TCP, web containers
  check `/up`, Redis checks `PING`.
- Scaling stateless services (web/app behind Traefik):
  ```bash
  docker compose up -d --scale catalog-app=2 --scale catalog-web=2
  ```
  No fixed `container_name` is used. Catalog uploads use the shared
  `catalog_storage` volume; all replicas must run on the same Docker host.
- Resource limits are per service (`mem_limit`, `cpus`). Adjust in
  `infrastructure/docker/compose.yaml`.
- Docker socket is exposed to Traefik only through the read-only
  `docker-socket-proxy` (`POST=0`).
- Schedulers run as `<service>-worker` with `php artisan schedule:work`:
  outbox relay every 10 s, event consumers every minute, no-show revalidation
  every minute.
- Never commit `.env` or `infrastructure/secrets`.

## 8. Load testing / monitoring (later phase)

- `infrastructure/k6/booking-flow.js` provides a k6 scenario.
- Prometheus/Grafana/cAdvisor/Node Exporter are out of scope for this
  iteration; the compose file is ready for them under `infrastructure/monitoring/`.
