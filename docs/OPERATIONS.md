# Operations

## Existing Pi migration

The inspected legacy deployment uses Compose project `schimbdecartiromania`, PostgreSQL 16, volume `schimbdecartiromania_postgres_data`, proxy port 80 and a Quick Tunnel. The new default proxy port is loopback 8080. The container names may change; use `docker compose exec db`, not hardcoded container names, after migration.

1. Recover disk capacity first. Keep at least 1 GB free for application releases; more is needed for local builds. Never remove the active PostgreSQL volume. Prefer USB SSD storage for production data.
2. Take and verify a backup of the current database before changing anything. Until the encrypted pipeline is configured, a private temporary logical dump can be made with the running legacy container:

   ```bash
   mkdir -p backups
   chmod 700 backups
   (umask 077; docker exec bookexchange_db pg_dump -U bookuser -d bookexchange_db -Fc > backups/pre-migration.dump)
   docker exec -i bookexchange_db pg_restore --list < backups/pre-migration.dump
   ```

   Encrypt the dump and keep a copy off the Pi before a real migration. Plain dumps contain private data. This command never changes the database.
3. Run `python3 scripts/init_env.py`. It privately reads legacy database credentials and the existing volume from Docker without printing them. The new JWT secret invalidates previous login tokens on first deployment.
4. Confirm `.env` has the correct `POSTGRES_VOLUME_NAME`. Changing `POSTGRES_PASSWORD` in `.env` does **not** change the password of an already initialized PostgreSQL volume. Password rotation requires a coordinated PostgreSQL `ALTER ROLE` and application-secret update during maintenance.
5. The Compose project name must remain `schimbdecartiromania`. Keep major version 16. Never run two PostgreSQL containers on the same data directory.
6. Build the backend and proxy images before starting maintenance: `docker compose build backend nginx`. On this small Pi, prefer CI-built images when available.
7. During a maintenance window, stop the legacy tunnel service, then update the app: `docker compose stop tunnel`, followed by `docker compose up -d --wait --remove-orphans`. Only enable one of the `demo` or `tunnel` profiles. `--remove-orphans` applies to this Compose project, not unrelated containers such as Pi-hole.
8. Verify `curl --fail http://127.0.0.1:8080/health`, registration/login, a test swap and contact privacy. Check `docker compose logs quick-tunnel` for the new demo address. Do not assume the old address remains valid.

First migration from the legacy bind-mounted frontend needs a separately preserved previous checkout/configuration for manual rollback: the old bare Nginx image alone does not contain its frontend or proxy configuration. Automatic image rollback is reliable only between releases using the new packaged proxy layout. Do not assume an image tag can reverse this infrastructure-layout change.

The configuration does not automatically migrate data to an SSD. Moving data needs a stopped database, a verified copy with ownership preserved, an explicit volume/bind-mount change and a restore rehearsal.

## Tunnel choices

Free demonstration: `COMPOSE_PROFILES=demo` uses a temporary Quick Tunnel. It has no uptime guarantee, a changing hostname and a 200 in-flight request limit. See [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Stable deployment: create a remotely managed Cloudflare Tunnel, configure its public hostname to `http://nginx:80`, store `TUNNEL_TOKEN` privately in `.env` or `/etc/bookexchange/app.env`, and set `COMPOSE_PROFILES=tunnel`. A domain on Cloudflare is a prerequisite; the repository does not purchase one or claim the domain is free. See [Cloudflare setup](https://developers.cloudflare.com/tunnel/get-started/).

Nginx trusts `CF-Connecting-IP` only from the dedicated `172.30.42.0/29` Docker ingress network, which contains the proxy and tunnel containers. Other clients cannot choose their rate-limit identity through that header. If this subnet conflicts with another network, change both Compose IPAM and Nginx's trusted subnet together. Forwarded headers from the public client are not blindly trusted by Uvicorn.

Do not open residential router ports for the tunnel. Do not publish database or node-exporter ports to the Internet.

## Release pipeline

PR tests execute on GitHub-hosted runners. Successful pushes to `main` publish commit-SHA-tagged AMD64/ARM64 backend and proxy images to GHCR. The static frontend is inside the proxy image, so it is released and rolled back with the app rather than read from a changing checkout.

Pi deployment uses the existing self-hosted Linux ARM64 runner and `/etc/bookexchange/app.env`. It runs only for pushes to `main` after all required tests/builds succeed. The GHCR login uses that job's short-lived, package-read `GITHUB_TOKEN`; packages do not need to be public, and no personal access token is stored on the Pi. The login action logs out at job completion.

- Set repository variable `ENABLE_PI_DEPLOY=false` to pause automatic releases.
- Protect `main`, review workflow changes, and restrict the `production` environment to trusted maintainers/branches as appropriate. Naming an environment does not create protection rules.
- Keep `POSTGRES_VOLUME_NAME` fixed in the private app env file.
- Optional secret `DISCORD_WEBHOOK_URL` enables deployment notifications. It is unset on this installation; no Discord message was sent.

GitHub warns against persistent self-hosted runners on public repositories because malicious workflows can compromise the host. A push-only job condition is not a complete isolation boundary. See [GitHub's runner security guidance](https://docs.github.com/en/actions/reference/security/secure-use). For a stronger boundary, keep production deployment in a private repository or use an isolated runner with restricted access. The workflow preserves the project's automatic deployment behavior for trusted main pushes. Public-repository runner isolation remains an operator responsibility.

The deploy script uses the exact tested commit and image tags, serializes deployments, pulls images before restarting services, waits for health, and attempts application-image rollback on failure. It does not run `git pull` over the production working tree. It does not automatically reverse schema changes or recover data. Keep schema changes additive until a separate migration has been reviewed and rehearsed.

Deploy manually with explicit image tags and the correct env file:

```bash
COMPOSE_ENV_FILE=/etc/bookexchange/app.env \
BACKEND_IMAGE=ghcr.io/OWNER/REPO/backend:COMMIT_SHA \
PROXY_IMAGE=ghcr.io/OWNER/REPO/proxy:COMMIT_SHA \
bash scripts/deploy.sh
```

Use lowercase GHCR repository names. `HEALTH_URL` defaults to `http://127.0.0.1:8080/health`; override it if you intentionally change the host port. Release images use commit tags; infrastructure image defaults still follow release tags. Pin image digests for fully reproducible infrastructure and update them through reviewed changes.

## Monitoring

Enable the `monitoring` Compose profile for Node Exporter. It listens only on `127.0.0.1:9100` and exposes memory, CPU, disk and supported thermal/hwmon metrics. Check with `curl http://127.0.0.1:9100/metrics`. It exports measurements; it does not supply historical graphs on its own. A separate Prometheus/Grafana instance can scrape through a private connection when historical retention is needed.

The disk check alarms below either 5 percent free or 1 GiB free by default. Tune `DISK_MIN_FREE_PERCENT` and `DISK_MIN_FREE_BYTES` for the actual storage and release size. The Pi now has approximately 1.5 GB free; keep builds on hosted CI.

For three-minute local health/disk checks:

```bash
sudo install -d -o root -g manumescana -m 750 /etc/bookexchange
sudo install -o root -g manumescana -m 640 ops/monitor.env.example /etc/bookexchange/monitor.env
sudo install -m 644 ops/systemd/bookexchange-monitor.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bookexchange-monitor.timer
```

Set `BACKUP_DIR` after the first verified remote backup to enable the 26-hour freshness alarm. Optional Discord alerts require a webhook configured in the private monitor env file. The script never includes credentials in its alert body. Inspect results with `journalctl -u bookexchange-monitor.service`.

Local checks cannot report when the Pi loses power or the home network fails. The external GitHub uptime workflow reads the checked-in `ops/public-url.txt` health URL. Repository variable `PUBLIC_HEALTH_URL` can override it. It requests a five-minute schedule; GitHub scheduling can be delayed and is not an uptime SLA. A Quick Tunnel restart requires updating that file or the override variable. GitHub workflow failure notifications are configured in your GitHub account. For an exact external three-minute interval, configure a separate monitoring provider and verify its current free-plan terms.

## Maintenance

All application services rotate JSON logs at 10 MB with three files. This limits Docker logs, not system journal, application data or all host caches.

```bash
sudo install -m 644 ops/systemd/bookexchange-maintenance.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bookexchange-maintenance.timer
```

The weekly job removes old dangling images and old build cache, retains tagged release images for rollback, and never prunes volumes. Tagged releases still accumulate: review `docker system df` and remove individual obsolete release tags after deciding the rollback retention window. Avoid `docker system prune --volumes`.

Check `df -h /`, `docker system df`, and `systemctl list-timers 'bookexchange-*'`. The current SD card is small: move build workloads to hosted CI and plan an SSD migration before sustained use.

## Optional email

Leave all SMTP settings blank for the demo. SMTP is simply the standard protocol an email account uses to send automatic emails. The code does not require a paid email provider.

To enable it, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, optional credentials and `PUBLIC_BASE_URL` in the private app env file; add `email` to `COMPOSE_PROFILES`. Use port 587 with STARTTLS or set `SMTP_SSL=true` for port 465. TLS certificates are verified. Never place an account's ordinary password in the repository; follow the account provider's app-password/OAuth policies. This implementation supports SMTP username/password, not OAuth-only accounts.

The database outbox persists verification and exchange emails in the same transaction as the relevant app event. The worker retries failures with increasing delay, up to ten attempts. Successful delivery removes the private recipient/body fields. SMTP has at-least-once delivery semantics; a worker crash after SMTP acceptance can cause a duplicate. Inspect failed rows with `SELECT id, attempts, next_attempt_at FROM mail_outbox WHERE sent_at IS NULL;` without dumping recipient bodies.

Set `EMAIL_VERIFICATION_REQUIRED=true` only after delivery is tested and a stable HTTPS `PUBLIC_BASE_URL` is configured. Existing accounts must verify too. Resend through `POST /api/auth/resend-verification` with an email JSON body. Verification links expire in one hour, use a separate JWT purpose, and place the token in a URL fragment so the proxy does not log it. The frontend exchanges the fragment via POST and removes it from the address bar. A changing demo hostname makes email links unreliable, so verification is off by default.
