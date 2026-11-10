# Monitoring (next phase)

This directory is reserved for Prometheus, Grafana, cAdvisor and Node Exporter
configuration. The application stack is already prepared for it:

- Every Laravel service exposes `GET /up` (container health).
- Nginx/PHP-FPM metrics can be scraped from the `php-fpm` status endpoint if
  enabled in the service Nginx template.
- Redis exposes its own metrics through `redis-cli INFO`.
- Traefik exposes metrics on its internal entrypoint when enabled
  (`--metrics.prometheus=true`).

Keep monitoring containers on a separate network from the public `edge`
network; only Grafana should be routed through Traefik, protected by auth.
