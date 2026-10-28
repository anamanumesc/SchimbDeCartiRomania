# SchimbDeCartiRomania

A Romanian physical book exchange platform and a practical DevOps project running on a Raspberry Pi 4. Users list books, propose swaps, accept or reject offers, and see their exchange partner's contact details only after acceptance. There are no payments or in-app chat.

## Architecture

```text
Internet → Cloudflare Tunnel → Nginx → FastAPI → PostgreSQL 16
                                └── static frontend
```

Python 3.12, FastAPI, SQLAlchemy, PostgreSQL 16, Nginx and Docker Compose. The current frontend is plain JavaScript and static HTML/CSS; it does not need a Node build. The university version used Vue and Express and is preserved in the `v1.0-university` tag.

The deployment target is a 4 GB ARM64 Raspberry Pi running Debian. Hosted GitHub Actions test the app and build AMD64/ARM64 images. The Pi deployment job pulls commit-tagged images and checks readiness before reporting success.

## Start without paying for a domain

Docker Engine, Docker Compose v2+ and Python 3 are required. On a new installation:

```bash
python3 scripts/init_env.py
docker compose up -d --build --wait
curl --fail http://127.0.0.1:8080/health
```

The environment generator creates private, random secrets. If it finds the legacy `bookexchange_db` container, it preserves that container's database password and volume name. It refuses to overwrite an existing `.env` or guess credentials when Docker access fails.

The default `.env` enables the `demo` profile. To find the free public HTTPS address:

```bash
docker compose logs quick-tunnel
```

Cloudflare Quick Tunnels do not need an account or a domain. Their random `trycloudflare.com` address changes on restart and they have no uptime guarantee. This is suitable for a portfolio demonstration, not a stable public production address. See [Cloudflare's limitations](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Disable the demo profile for local-only development.

**Existing installation:** read [the migration instructions](docs/OPERATIONS.md#existing-pi-migration) before running `up`. Keep PostgreSQL major version 16 and the existing volume. Do not start a second database against that volume. The checked-in configuration deliberately retains the legacy Compose project name, `schimbdecartiromania`.

## Implemented controls

- Database-aware `/health`, PostgreSQL readiness, bounded container logs and restart policies.
- Non-root, read-only backend containers; PostgreSQL and backend have no published host ports. Nginx binds to loopback by default.
- JWT secrets supplied through the environment; password hashing retains the compatible Passlib/bcrypt pair. New passwords require at least 12 characters and at most 72 UTF-8 bytes.
- Public book, profile and exchange responses omit email and contact information. Only accepted exchange participants can request contact details.
- Transactional row locks prevent overlapping swaps from accepting the same book. Processed exchanges cannot be accepted or rejected again.
- Startup schema changes run in one transaction under a PostgreSQL advisory lock. Existing offered book IDs remain JSON, matching the deployed database.
- Nginx authentication rate limits, a 5 MB request-body limit, security headers, and escaped user content in the frontend.
- Encrypted database backups, optional media archiving, verified remote copies, and safe restore rehearsals. Daily and weekly systemd timers are provided.
- Optional local host metrics, three-minute local health/disk probes, backup freshness alerts and an external GitHub uptime workflow.
- Optional SMTP verification and exchange notifications backed by a retryable database outbox.

The Pi deployment, encrypted R2 delivery/restore, host metrics and three systemd timers are operational. See [validation evidence](docs/VALIDATION.md). SMTP and Discord remain optional and unconfigured. A successful readiness check does not guarantee a zero-downtime rollout; the single-node application can briefly be unavailable during recreation.

## Backups and recovery

Read [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) for encrypted backup setup, a free Google Drive destination, retention, replacement recovery and measured RPO/RTO records. `restore_db.sh` defaults to a disposable database; replacing production requires the explicit `--replace` argument.

With `age` and `rclone` installed, rehearse the pipeline using synthetic data:

```bash
docker build -t bookexchange-backend:validation backend
bash scripts/test_recovery.sh
```

The rehearsal uses temporary RAM-backed PostgreSQL storage and a local directory as a remote-storage stand-in. It tests encryption and recovery, not actual internet connectivity or Google Drive authorization.

## Tests and CI/CD

API integration tests require a disposable PostgreSQL database whose name ends in `_test`; the suite refuses any other database name.

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
export DATABASE_URL=postgresql://bookuser:YOUR_TEST_PASSWORD@localhost:5432/bookexchange_test
export JWT_SECRET_KEY=local-test-only-secret-at-least-32-characters
pytest -v backend/tests
```

CI provisions PostgreSQL, tests privacy, authentication, concurrent acceptance and email behavior, validates Compose and Nginx, then publishes backend and frontend/proxy images to GHCR on pushes to `main`. Pull requests stay on hosted runners.

Production deployment runs after successful trusted pushes to `main`, using the `production` GitHub environment and the existing Linux ARM64 self-hosted runner. Set repository variable `ENABLE_PI_DEPLOY=false` to pause automatic releases. Read the [deployment setup and runner restrictions](docs/OPERATIONS.md#release-pipeline) before enabling it. The runner checks out the tested commit separately from the operator workspace; the deployment script does not pull over local changes.

## Optional email and book covers

A transactional email is an automatic account or exchange email. An existing SMTP account can provide it; no paid provider is required by the code. Leave SMTP settings blank to run the free demo without email. See [SMTP setup](docs/OPERATIONS.md#optional-email).

Book covers currently use external HTTP/HTTPS URLs. There is no file-upload API: image MIME validation is not claimed or needed for a nonexistent upload route. Adding uploads requires image decoding, size/pixel limits, persistent media storage, and coordinated media restore before exposing the feature. The general Nginx body limit does not validate file content.

## Operations and contribution

See [OPERATIONS.md](docs/OPERATIONS.md) for maintenance, monitoring, secrets, tunnel options and release rollback. Do not commit `.env`, cloud credentials, age identities or database dumps. Keep recovery keys separately from the Pi. Test fixes against disposable data and include the relevant validation in pull requests.
