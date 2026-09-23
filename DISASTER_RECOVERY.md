# Disaster Recovery & Backup Runbook

This document outlines recovery strategies and automated procedures for **SchimbDeCartiRomania** production platform hosted on Raspberry Pi 4 ARM64.

---

## 1. Metrics & Objectives

* **Recovery Point Objective (RPO):** 24 hours (Automated daily snapshots at 02:00 AM local time).
* **Recovery Time Objective (RTO):** < 10 minutes to full service availability.
* **Storage Locations:**
  * **Primary (Local):** /home/manumescana/backups (7-day sliding retention window).
  * **Secondary (Off-site):** Encrypted Cloudflare R2 Object Storage bucket (bookexchange-backups).

---

## 2. Backup Pipeline

The backup procedure is automated via cron job:
0 2 * * * /home/manumescana/scripts/backup.sh >> /home/manumescana/backups/backup.log 2>&1

### Process Lifecycle:
1. Database Dump: Executes pg_dump with --clean --if-exists inside the active bookexchange_db container.
2. Media Preservation: Copies all user uploaded assets (uploads/).
3. Packaging: Compresses artifacts into an archived payload (backup_YYYYMMDD_HHMMSS.tar.gz).
4. Off-site Sync: Transfers payload to Cloudflare R2 using rclone with no_check_bucket and no_system_metadata flags.
5. Local Retention: Purges local archives older than 7 days via find -mtime +7 -delete.

---

## 3. Disaster Recovery Scenarios & Execution

### Scenario A: Local Database Corruption (Local Snapshot Available)

Run the automated local restore script with the latest snapshot:
/home/manumescana/scripts/restore.sh $(ls -t /home/manumescana/backups/backup_*.tar.gz | head -n 1)

### Scenario B: Catastrophic Hardware Failure (Host Replacement)

If the local machine is destroyed or formatted:
1. Provision new host with Docker, Docker Compose, and rclone.
2. Clone repository:
   git clone https://github.com/anamanumesc/SchimbDeCartiRomania.git
   cd SchimbDeCartiRomania
   docker compose up -d --build
3. Pull credentials and restore directly from Cloudflare R2:
   /home/manumescana/scripts/restore_from_cloud.sh
4. Verify application health:
   curl -i http://localhost/health
