# SchimbDeCartiRomania

A book-swapping app for Romania, running on a Raspberry Pi 4 at home.

People can list books, filter by city or genre, and offer their own books in exchange. Contact details become visible to the two participants after a swap is accepted. There are no payments or in-app messages; arranging the actual handover is up to them.

The application gives this project something real to operate: a database to preserve, releases to deploy, a residential connection to work around, and a small disk that needs attention.

**[Open the demo](https://cooper-footwear-gis-hamilton.trycloudflare.com)** · **[CI/CD runs](https://github.com/anamanumesc/SchimbDeCartiRomania/actions/workflows/ci.yml)** · **[Recovery runbook](DISASTER_RECOVERY.md)**

The demo uses a free Cloudflare Quick Tunnel. Its address can change when the tunnel restarts. The address used by the external health check lives in [`ops/public-url.txt`](ops/public-url.txt).

## How it runs

```mermaid
flowchart TD
    visitor[Browser] -->|HTTPS| edge[Cloudflare]
    edge -->|traffic through the tunnel| tunnel

    subgraph pi["Raspberry Pi 4 · Debian ARM64 · 4 GB RAM"]
        tunnel[cloudflared]
        proxy["Nginx · localhost:8080"]
        api["FastAPI · internal port 8000"]
        db[("PostgreSQL 16<br/>persistent Docker volume")]
        backup["systemd backup timer<br/>pg_dump → age → rclone"]
        metrics["Node Exporter<br/>localhost:9100"]

        tunnel -->|HTTP| proxy
        proxy --> files[HTML CSS and JavaScript]
        proxy -->|/api and /health| api
        api --> db
        db -.->|logical dump| backup
    end

    tunnel -.->|outbound connection| edge
    backup -->|encrypted archive| r2[(Cloudflare R2)]
    checks["GitHub scheduled check"] -->|public /health| edge
```

`cloudflared` connects outward from the Pi, so the application does not depend on opening router ports. Nginx serves the frontend and forwards API requests to FastAPI. PostgreSQL and the backend have no published host ports.

| Part | What is used |
| --- | --- |
| Host | Raspberry Pi 4, 4 GB RAM, Debian ARM64 |
| Application | Python 3.12, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 with a persistent Docker volume |
| Frontend | Plain JavaScript, HTML and CSS; local Bootstrap styles and fonts |
| Deployment | Docker Compose, GitHub Actions, GHCR, self-hosted Pi runner |
| Operations | systemd timers, age, rclone, Node Exporter |

The frontend has no Node build step. Node is used in CI to check JavaScript syntax and run the frontend security test.

## Where the project came from

The original university application used Vue and Express. That version is kept in the [`v1.0-university` tag](https://github.com/anamanumesc/SchimbDeCartiRomania/tree/v1.0-university).

The self-hosted rewrite followed in September 2026: FastAPI, Docker Compose, Nginx, PostgreSQL, then deployment through the Pi runner. October's changes added verified encrypted backups, stronger exchange/privacy checks, packaged frontend releases and host monitoring. The [October deployment](https://github.com/anamanumesc/SchimbDeCartiRomania/actions/runs/40733416915) passed the full release pipeline.

A single Pi is enough for this workload. Compose keeps the services and their dependencies in one place, while leaving the host administration visible: storage, permissions, timers and recovery still need looking after.

## Run a fresh installation

You need Git, Python 3, Docker Engine and Docker Compose v2 or newer. Start with Docker running and accessible to your user.

**Already running this project on the machine?** Keep its `.env` and database volume. Read the [existing Pi migration notes](docs/OPERATIONS.md#existing-pi-migration) before changing the stack.

For a new installation:

```bash
git clone https://github.com/anamanumesc/SchimbDeCartiRomania.git
cd SchimbDeCartiRomania
python3 scripts/init_env.py
```

This creates `.env` with random database and JWT secrets and mode `600`. It refuses to overwrite an existing file. Do not commit it.

The default configuration starts a public demo tunnel. For a local-only instance, edit `.env` and leave `COMPOSE_PROFILES` empty before starting anything. To include host metrics, set it to `monitoring`; for a public demo with metrics, use `demo,monitoring`.

```bash
docker compose up -d --build --wait
curl --fail http://127.0.0.1:8080/health
```

Open **http://127.0.0.1:8080**. API documentation is at **http://127.0.0.1:8080/docs**.

With the `demo` profile enabled, find the public address using:

```bash
docker compose logs quick-tunnel
```

Registration creates an account; the installation does not create a shared default login. Email verification is off until SMTP is configured.

To stop the stack while keeping the database:

```bash
docker compose down
```

`docker compose down --volumes` deletes the database volume. It is not a routine shutdown command.

## What happens on a push

The release workflow is in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

```text
push to main
  └─ API tests, dependency audit, frontend and Nginx checks
      └─ encrypted backup/restore rehearsal with disposable data
          └─ build backend and proxy images for amd64 and arm64
              └─ push commit-tagged images to GHCR
                  └─ Pi pulls images, starts services, checks /health
```

Pull requests run the hosted validation jobs. Publishing and deployment happen on pushes to `main`. The Pi runner checks out the tested commit in its own workspace; the deployment script does not pull over the operator's working tree.

The frontend is included in the proxy image. That keeps a release's API and static assets together. GHCR access during deployment uses the job's short-lived token.

If readiness fails, [`scripts/deploy.sh`](scripts/deploy.sh) attempts to restore the previous application images. Database recovery is a separate procedure. There can be a short interruption while containers are recreated.

Set the repository variable `ENABLE_PI_DEPLOY=false` to pause automatic deployment. A persistent runner attached to a public repository needs careful access control; see the [runner notes](docs/OPERATIONS.md#release-pipeline).

## Backups and recovery

The daily systemd timer runs around **02:00 Europe/Bucharest**. The backup script:

1. Takes a PostgreSQL custom-format dump without a pseudo-TTY.
2. Checks that `pg_restore` can read it.
3. Packages the dump and manifest, then encrypts them with age.
4. Copies the encrypted archive to the existing R2 bucket through rclone.
5. Downloads the ciphertext to compare its checksum before recording success.

Local encrypted archives have seven-day retention. Remote retention needs its own storage policy or manual review.

A real R2 archive was downloaded and restored into a temporary database on 28 October 2026. The recorded drill recovered five users and ten books. That verifies the database recovery path; rebuilding the whole service on replacement hardware remains to be rehearsed.

On the configured Pi, these commands create a backup and rehearse a chosen archive:

```bash
OPS_ENV_FILE=/etc/bookexchange/backup.env bash scripts/backup_db.sh

OPS_ENV_FILE=/etc/bookexchange/backup.env \
  bash scripts/restore_db.sh /path/to/backup_TIMESTAMP_RANDOM.tar.age
```

Restore defaults to a disposable database. Replacing the application database requires an explicit `--replace`; read the [recovery runbook](DISASTER_RECOVERY.md) first.

**Keep an independent copy of the age private key off the Pi.** An encrypted archive cannot help after complete host loss if the only decryption key was on that host.

## Monitoring and routine checks

Node Exporter listens on `127.0.0.1:9100`. It exposes CPU, memory, filesystem and supported temperature metrics. Historical graphs still need a metrics store and dashboard.

The local monitor runs every three minutes. It checks application health, disk space and, when configured, whether the last verified backup is more than 26 hours old. Disk thresholds default to 5 percent and 1 GiB free. The external GitHub workflow requests a check every five minutes; scheduled runs can be delayed.

Useful commands on the Pi:

```bash
docker compose ps
docker compose logs --tail 50 backend nginx
systemctl list-timers 'bookexchange-*'
journalctl -u bookexchange-backup.service -n 30 --no-pager
journalctl -u bookexchange-monitor.service -n 30 --no-pager
df -h /
curl --fail http://127.0.0.1:9100/metrics
```

All Compose services rotate Docker logs at 10 MB with three files. Weekly maintenance clears old dangling images and build cache. Tagged releases are retained for rollback and still need periodic review.

The 15 GB system disk is the current bottleneck. On 29 October the monitor was correctly raising a low-space alarm. Storage cleanup and moving persistent data to an SSD are still open work.

## Checks you can run

The API suite currently has **17 integration tests**, including contact privacy, overlapping exchange acceptance, authentication, legacy schema migration and SMTP retry behavior. It requires a disposable PostgreSQL database ending in `_test` and refuses other database names. Tests recreate their tables.

The following example assumes Python 3.12 and port `15432` free on the development machine:

```bash
docker run --detach --rm --name bookexchange-readme-test-db \
  --publish 127.0.0.1:15432:5432 \
  --tmpfs /var/lib/postgresql/data \
  --env POSTGRES_USER=bookuser \
  --env POSTGRES_PASSWORD=local-test-password \
  --env POSTGRES_DB=bookexchange_test \
  postgres:16-alpine

until docker exec bookexchange-readme-test-db \
  pg_isready -U bookuser -d bookexchange_test; do sleep 1; done

python3.12 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt

DATABASE_URL=postgresql://bookuser:local-test-password@127.0.0.1:15432/bookexchange_test \
JWT_SECRET_KEY=local-test-only-secret-at-least-32-characters \
  pytest -v backend/tests

docker stop bookexchange-readme-test-db
```

The container is removed when stopped, and its test data lives in temporary storage. The password above is only for that disposable database.

For the frontend checks, with Node installed:

```bash
node --check frontend/app.js
node frontend/tests/security.test.cjs
```

To rehearse encrypted recovery and proxy behavior, install `age` and `rclone`, then run:

```bash
docker build -t bookexchange-backend:validation backend
docker build -f nginx/Dockerfile -t bookexchange-proxy:validation .
TEST_PROXY_IMAGE=bookexchange-proxy:validation bash scripts/test_recovery.sh
```

That rehearsal uses a separate temporary PostgreSQL instance and a local directory as the remote-storage stand-in. Actual R2 credentials and connectivity are checked separately. The [validation record](docs/VALIDATION.md) lists what was tested and where.

## Application details that matter here

- Public book/profile/exchange responses omit email and contact information. Accepted exchange participants have a separate contact endpoint.
- Acceptance locks the affected book rows in a consistent order. Two offers involving the same book cannot both succeed; an unavailable book produces HTTP 409.
- New passwords have a 12-character minimum and a 72-byte UTF-8 maximum. JWT secrets come from the environment.
- The backend runs as a non-root user with a read-only root filesystem. Startup schema changes run transactionally under an advisory lock.
- Nginx rate-limits authentication routes and limits request bodies to 5 MB. Book covers currently use URLs; there is no upload endpoint.
- SMTP verification and exchange notifications use a database outbox. SMTP and Discord delivery are optional and unconfigured on this installation.

## A few problems encountered

- **502 immediately after a release.** The containers could be running while the API was still starting. Deployment now waits for readiness and polls through Nginx before reporting success. The health endpoint also checks PostgreSQL.
- **API tests failing only in CI.** The tests needed a real PostgreSQL service. CI now provisions one, and the suite refuses database names that do not end in `_test`.
- **R2 uploads retrying with HTTP 501.** The old rclone client needed retries even when a subsequent checksum check passed. Updating to the official v1.75.2 release, with its download checksum verified, removed that error in the recorded backup run.

The runbooks keep the longer recovery and deployment procedures so this README can stay an entry point.

## Files to start with

```text
backend/app/             API, models, authentication, migrations and mail outbox
backend/tests/           API integration and proxy smoke tests
frontend/                static UI and local Bootstrap assets
nginx/                   proxy configuration and frontend image
scripts/                 deployment, backup, restore and host checks
ops/                     systemd units, example settings and recovery-test Compose
.github/workflows/       validation, image publication, deployment and uptime check
```

Host setup, migration and troubleshooting commands are in [OPERATIONS.md](docs/OPERATIONS.md). Backup keys, retention and replacement recovery are in [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md).

## Still to do

- A stable public hostname instead of the changing demo address.
- An independently stored recovery key and a full replacement-host rehearsal.
- More disk headroom, followed by an SSD migration.
- Ansible for repeatable host setup.
- Historical metrics and a tested notification destination.

Changes are welcome through issues or pull requests. Include how the change was checked, especially if it touches database state, deployment or recovery. Keep credentials and dumps out of the repository.
