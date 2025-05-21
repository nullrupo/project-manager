# idiy – backupRestorePRD

> **Status:** Draft v0.1
> **Owner:** DevOps Lead
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Guarantee business‑continuity and user data portability through personal exports, automated off‑site backups, and disaster‑recovery procedures.

## 2 · Scope (MVP)

* **Personal Backup / Restore** (JSON+attachments ZIP download / upload)
* **System‑wide nightly pg\_dump** to S3 (7 day PITR)
* **Ops restore tooling** (<2 h RTO)

### Roadmap Extensions

* Automated upload to Google Drive / OneDrive / Synology (WebDAV)
* Differential backups & encryption at rest w/ user‑supplied keys

## 3 · User Stories

| ID    | Story                                                                                         |
| ----- | --------------------------------------------------------------------------------------------- |
| BR‑01 | *As a user* I can export all my tasks/projects so I feel safe.                                |
| BR‑02 | *As a user* I can import the ZIP to recover if I delete something by mistake.                 |
| BR‑03 | *As DevOps* I can restore the entire database to any point in the last 7 days within 2 hours. |

## 4 · Personal Backup

### 4.1 Flow

1. User → **Settings › Backup** → *Create Backup*.
2. Backend queues job; status = `pending`.
3. Serverless function streams user‑scoped JSON (projects, tasks, tags, comments) + `files.csv` (Drive links) → ZIP.
4. S3 presigned URL returned; user auto‑downloads.
5. Table **UserBackup** records size + status `ready`.

### 4.2 Restore

1. User selects ZIP → upload `/users/:id/restore`.
2. Backend validates schema version; shows diff preview.
3. User selects *merge* or *overwrite*.
4. Data inserted via upsert; counters (XP) recalculated.

## 5 · System‑Wide Backup

| Item       | Config                                                  |
| ---------- | ------------------------------------------------------- |
| Schedule   | Cron `0 02 * * *` UTC (09:00 ICT)                       |
| Command    | `pg_dump -Fc -Z9 --no-acl --no-owner`                   |
| Storage    | S3 (`s3://idiy-backups/{YYYY}/{MM}/dump-{date}.sql.gz`) |
| Retention  | 30 full + PITR via WAL (7 days)                         |
| Monitoring | SNS alert if dump size variance > ±15 %                 |

### 5.1 Restore Playbook

1. Spin up fresh Supabase instance.
2. `pg_restore` dump + apply WAL up to target.
3. Swap DB connection string in Vercel env; invalidate CDN.

## 6 · Automated Drive / WebDAV (Roadmap)

| Step          | Detail                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| OAuth flow    | User grants idiy **drive.file** scope. Refresh token stored encrypted.          |
| Job           | Daily worker reads latest personal backup ZIP and uploads to provider folderId. |
| Failure retry | 3 attempts exponential back‑off; user emailed on final failure.                 |

## 7 · API Endpoints

| Method | Path                     | Auth     | Description                   |
| ------ | ------------------------ | -------- | ----------------------------- |
| POST   | `/users/:id/backups`     | user     | create new backup job         |
| GET    | `/users/:id/backups`     | user     | list last 7 backups           |
| POST   | `/users/:id/restore`     | user     | body = ZIP file (multipart)   |
| POST   | `/admin/backups/restore` | Director | trigger full DB restore (Ops) |

## 8 · Database

### 8.1 UserBackup

| Field     | Type                          | Notes |
| --------- | ----------------------------- | ----- |
| id        | uuid pk                       |       |
| userId    | uuid fk                       |       |
| fileUrl   | text                          |       |
| size      | int                           |       |
| status    | enum (pending, ready, failed) |       |
| createdAt | timestamptz default now()     |       |

### 8.2 BackupJobQueue (internal)

Simple table consumed by worker (jobId, type, payload).

## 9 · Security

* Backup ZIP encrypted at rest (S3 SSE‑KMS).
* Download URL expires 30 min.
* Restore validates JWT belongs to ZIP owner.

## 10 · KPIs & Alerts

| KPI                      | Target          |
| ------------------------ | --------------- |
| Personal backup success  | ≥ 99 % / 30 d   |
| Restore job success      | ≥ 98 % / 30 d   |
| System backup size drift | ±15 % threshold |

## 11 · Open Questions

1. Do we allow users to schedule auto‑backup to Drive at MVP?
2. Should failed personal restore auto‑roll‑back?
3. Encrypt personal ZIP with user‑provided password?

---

> Update via PR or canvas comment.
