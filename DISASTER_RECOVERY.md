# Disaster recovery

## Objectives and evidence

Target RPO: 24 hours, backed by a daily timer and a 26-hour backup freshness alarm. Target RTO: 30 minutes after a replacement host, network access and recovery credentials are available. Hardware procurement, installing the OS and account recovery are additional time. These are targets, not measured production guarantees.

An archive is a PostgreSQL custom-format logical dump, a manifest, a database checksum and an optional media snapshot, encrypted as one age archive. `pg_dump` gives a consistent database snapshot without stopping readers/writers; see [PostgreSQL documentation](https://www.postgresql.org/docs/16/app-pgdump.html). The database role is recreated by Compose rather than dumped as a cluster-wide role.

The current application stores cover URLs, not uploaded image files. External cover images are not backed up. `MEDIA_DIR` is an optional future/local-media source; database and media snapshots are not a globally atomic snapshot. If media is changed/deleted concurrently, pause writers before backup. Do not enable an upload feature until coordinated media recovery is implemented and rehearsed.

Keep an evidence record after each real rehearsal:

| UTC date | Source archive | Remote download verified | Decryption verified | DB restore verified | HTTP and login verified | Elapsed time | Actual RPO |
|---|---|---|---|---|---|---|---|
| 2026-10-28 | backup_20261028T170508Z_21649.tar.age | Yes, existing R2 bucket | Yes | 5 users, 10 books, 0 exchanges | Local and public health/catalog verified after deployment | 6 seconds for DB drill | Archive created minutes before drill |

Both the synthetic local rehearsal and a real R2 download/restore were completed. A database-only drill does not prove complete host replacement time.

## One-time setup

Install `age` and `rclone` on the Pi. Use your distribution package manager; follow current [rclone installation guidance](https://rclone.org/install/) if the distribution build is too old for your remote.

Create an encryption identity on a trusted recovery device, copy **only the public recipient** to the Pi's backup configuration, and store the private key separately from the Pi:

```bash
age-keygen -o recovery.agekey
age-keygen -y recovery.agekey
```

A copy of the private key is needed on the machine performing a restore drill. Protect it with restrictive file permissions and an additional offline recovery copy. Losing this key makes the archives unrecoverable. Do not commit the key or put it in the backup archive.

For a free destination, configure your own Google Drive account with `rclone config` and call the remote `gdrive`. Use `gdrive:bookexchange-backups` as `BACKUP_REMOTE`. Stay within your account's available storage. The current [rclone Drive guide](https://rclone.org/drive/#making-your-own-client-id) requires a personal Google OAuth client ID; complete its browser authorization on your own account. Do not use a shared client ID or paste OAuth tokens into chat. A remote configured as `backup-remote` already exists on the inspected Pi for Cloudflare S3; the encrypted pipeline now uses its existing `bookexchange-backups/encrypted-v1` prefix. Upload, download and restore have been verified. Account billing/quota settings remain owner-managed; no new paid service was provisioned.

The script works with any configured rclone remote, including an S3-compatible bucket. For R2, set a bucket subpath explicitly, for example `backup-remote:YOUR_BUCKET/bookexchange`; do not confuse a bucket root with a file path. A free quota is a provider condition, not a promise that arbitrary storage/traffic costs nothing.

```bash
sudo install -d -o root -g manumescana -m 750 /etc/bookexchange
sudo install -o root -g manumescana -m 640 ops/backup.env.example /etc/bookexchange/backup.env
```

Edit that private file to supply the public age recipient, remote destination, project path and backup directory. `COMPOSE_ENV_FILE` can point to `/etc/bookexchange/app.env` if deployments use that location; it defaults to the project's `.env`. Keep operator ownership appropriate for the service user. `common.sh` sources this administrator-owned shell file, so never allow untrusted users to write it.

Run a manual backup before enabling the timer:

```bash
OPS_ENV_FILE=/etc/bookexchange/backup.env bash scripts/backup_db.sh
```

The script serializes with restores using `flock`, dumps without a pseudo-TTY, checks that `pg_restore` can read the dump, encrypts a private temporary archive, atomically publishes ciphertext locally, copies it to the remote, and downloads it to verify a SHA-256 match. It writes `last-success` only after that verification. Failures return nonzero; interrupted `.backup.*` directories can contain plaintext. They are normally removed by the exit trap, but after a power failure inspect/remove them securely and keep the backup filesystem private. Disk encryption is appropriate when theft of the Pi is in scope.

Local encrypted retention is seven days and runs only after successful off-site verification. Remote deletion is deliberately not automatic. Set an explicit provider lifecycle/retention policy after reviewing storage limits; Google Drive has no S3-style object lifecycle, so periodically review and delete old archives manually. Do not delete the last known-good recovery point. Leave sufficient disk capacity for a temporary plaintext dump plus the encrypted archive.

Install the timer after the first successful backup and remote restore drill:

```bash
sudo install -m 644 ops/systemd/bookexchange-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bookexchange-backup.timer
systemctl list-timers bookexchange-backup.timer
journalctl -u bookexchange-backup.service
```

It runs around 02:00 Europe/Bucharest daily with a small randomized delay. `Persistent=true` catches a missed calendar run when the host next starts. It is not possible to recover a day of new data if the host never successfully backs it up; monitor freshness.

## Safe restore rehearsal

Download a specific known archive; the cloud helper never guesses the newest file:

```bash
OPS_ENV_FILE=/etc/bookexchange/backup.env \
  bash scripts/restore_from_cloud.sh backup_UTC_TIMESTAMP_RANDOM.tar.age
```

Or restore a local archive:

```bash
OPS_ENV_FILE=/etc/bookexchange/backup.env \
  bash scripts/restore_db.sh /path/to/backup_UTC_TIMESTAMP_RANDOM.tar.age
```

Both default to `--drill`. They authenticate/decrypt the age archive, reject unsafe tar paths and symlinks, verify the database checksum, restore into a fresh temporary database with fail-fast/single-transaction options, query core table counts and remove the rehearsal database. A successful drill does not modify the production database. Allow capacity for the temporary database. Record the elapsed time and observed row counts without publishing private data.

A backup archive is executable database input: only restore archives from trusted operators. Encryption authenticates the ciphertext but anyone holding the public recipient can create a new encrypted archive; verify the source and operational record too.

## Production database replacement

First save a pre-restore backup, stop application writers and announce maintenance. Make sure the chosen archive is correct, the replacement database major version is compatible, and the app's migration version matches the archive. Application-image rollback and database rollback are separate operations.

The explicit replacement mode first completes a scratch restore, then stops Nginx and the backend, restores the main database transactionally, and attempts to restart the previously running application services even on failure:

```bash
OPS_ENV_FILE=/etc/bookexchange/backup.env \
  bash scripts/restore_db.sh /path/to/chosen-backup.tar.age --replace
```

The helper also stops a running email worker before replacement and restarts it afterward. If the app was already stopped (for example on a new host), it stays stopped until you explicitly start it. Restored outbox messages may already have been delivered before the backup; review pending notifications before resuming email delivery. For deliberate notification review, stop the worker yourself before invoking replacement so it remains stopped afterward.

Automatic replacement is refused when `MEDIA_DIR` is configured. The current product has no uploaded media, so database-only replacement is complete for its state. If you add local media, perform a coordinated maintenance restore of the verified media snapshot and database; do not claim media RTO until that procedure is implemented and tested. Archives still preserve optional media for inspection and recovery by a trusted operator.

After replacement, verify `/health`, login, a listing, contact masking and a test exchange. Inspect container logs and verify the public tunnel path separately. Record measured RTO/RPO, start the email worker when appropriate, and resume the backup timer. Do not delete the pre-restore archive until the recovered service is confirmed correct.

## Complete host loss

1. Provision Debian ARM64, Docker Engine/Compose, age and rclone. Prepare adequate storage before restoring.
2. Check out the desired application release. Recreate its private env file with a new JWT secret and the intended new database password/volume. On a new host there is no legacy password to preserve.
3. Start **only** the database: `docker compose up -d --wait db`.
4. Recover the age identity and authorize the off-site remote using the independently stored recovery credentials.
5. Download a known-good archive, rehearse it, then run explicit replacement while the app is stopped. The helper leaves initially stopped application services stopped; prepare the chosen release images/configuration before starting them.
6. Start the release, verify local health and product flows, then enable the tunnel. A Quick Tunnel gets a new address; update external monitoring and any saved links.
7. Reinstall timers and test a fresh backup from the replacement machine. Record actual recovery time and data loss.

Retain an offline copy of environment configuration, the age key, remote account recovery instructions and this runbook. These secrets are deliberately not included in the public Git repository or database archive.
