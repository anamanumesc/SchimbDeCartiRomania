# Validation record

Repository validation performed on the Raspberry Pi ARM64 host on 2026-10-28. Isolated tests were followed by a verified production deployment to the existing PostgreSQL volume. Existing counts were preserved: five users, ten books and zero exchanges.

| Check | Result | Boundary |
|---|---|---|
| API integration suite | 17 passed | Disposable PostgreSQL database ending `_test`, Python 3.12 and updated pinned dependencies |
| Concurrent exchange acceptance | Passed | Exactly one of two overlapping offers accepted; other returned HTTP 409 |
| Contact privacy | Passed | Public responses omit contacts; pending/rejected/unrelated exchanges cannot disclose them |
| SMTP verification and retries | Passed | Mock SMTP; no real email sent |
| Dependency audit | No known vulnerabilities found | `pip-audit` against resolved pinned Python requirements at validation time |
| Backend Docker build | Passed | Completed image with upgraded dependencies; integration suite passed with a non-root, read-only root filesystem |
| Packaged Nginx/frontend image | Build and `nginx -t` passed | Isolated Docker network, no published ports |
| Proxy HTTP smoke test | Passed | Static assets, API routing, health, security headers, 5 MB limit and authentication rate limit with spoofed client headers |
| Frontend security tests | Passed | Escaped user rendering, safe cover URL schemes and title passed through event listener rather than inline script |
| Encrypted backup/recovery round trip | Passed | Synthetic DB/media; actual age encryption; local rclone destination stands in for remote storage |
| Corrupted encrypted archive | Rejected | Failed before database restore |
| Compose, shell and Python syntax | Passed | All Compose profiles parsed; shell scripts and Python modules compiled |
| systemd units | Verifier passed | Installed and enabled all three production timers; backup and monitor services executed successfully |

## Production operations verified

- Version 3.3.0 deployed behind localhost-only Nginx and the free public Quick Tunnel.
- Contact masking checked against the real catalog without creating/deleting user records.
- Real encrypted backups uploaded to the existing R2 bucket, downloaded and restored into disposable databases. Latest recorded production drill restored all five users and ten books in six seconds; this is a database drill, not full-host RTO.
- Daily backup, three-minute host/application monitoring and weekly maintenance timers installed and enabled; superseded cron entries saved privately and removed.
- Node Exporter running on localhost; CPU, memory, disk and host metrics available.
- Old public database password rotated; runtime secrets stored in private environment files. JWT secret randomized.
- Disk space recovered by retiring unused runner versions/cache and the unused legacy backend image. A temporary legacy image archive is retained under `/tmp`; it is not a durable disaster-recovery artifact.
- rclone upgraded to official v1.75.2 with a verified release SHA-256 checksum; subsequent R2 backup completed without the old client's HTTP 501 retry.
- Frontend Bootstrap styles/fonts vendored with their license to remove the render dependency on a CDN.

Remaining external/optional boundaries:

- SMTP delivery and Discord alerts are optional and unconfigured; tests use mock SMTP and no real message was sent.
- Quick Tunnel hostnames change on restart. `ops/public-url.txt` must be updated for external monitoring when that happens.
- Recovery identity currently resides privately on the Pi. The owner must keep an independent offline copy before claiming recovery from complete host loss.
- Full-host RTO/RPO, SSD migration, historical telemetry and file uploads are not claimed.

GitHub run evidence is recorded after the release workflow completes. Checked-in capabilities and enabled operations are distinguished here so portfolio claims remain inspectable.
