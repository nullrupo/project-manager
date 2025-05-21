# idiy – dataModelPRD

> **Status:** Draft v0.1
> **Owner:** Database Engineering
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Provide the canonical entity‑relationship model (ERD), field definitions, indexing strategy and migration guidelines for idiy’s Postgres (Supabase) database.

## 2 · Scope (MVP)

* Core entities: *Workspace, Project, Milestone, Task, Tag, Folder, PinnedItem, User, Comment, Attachment, XPLog*.
* Auxiliary: *ProjectWorkspace (M‑N), ProjectMember, WorkspaceHead, Reminder, UserBackup, AuthAudit*.
* Vector‑clock sync (updatedAt + deletedAt) for offline roadmap.

## 3 · ER Diagram (logical)

```
User ─┬─< ProjectMember >─┬─ Project ──< Milestone ──< Task
      │                   │  ▲           ▲           ▲
      │                   │  │           │           │
      └─< Comment --------┘  │           │           └< Comment
      └─< XPLog              │           └─< Attachment
Workspace ─┬─< WorkspaceHead │
           └─< ProjectWorkspace >─ Project
Folder ─< FolderProject >─ Project
Tag ─< TaskTag >─ Task
PinnedItem (User scoped) → Project | Tag
```

*(Crow’s foot ‑< = one‑to‑many, >‑< = many‑to‑many)*

## 4 · Table Definitions (excerpt)

### 4.1 workspace

| Field     | Type                            | Notes |
| --------- | ------------------------------- | ----- |
| id        | uuid pk                         |       |
| name      | text not null                   |       |
| type      | enum('department','cross‑dept') |       |
| createdAt | timestamptz default now()       |       |

### 4.2 project

| Field                | Type                      | Notes |
| -------------------- | ------------------------- | ----- |
| id                   | uuid pk                   |       |
| name                 | text not null             |       |
| description          | text                      |       |
| ownerId              | uuid fk → user(id)        |       |
| startDate, dueDate   | date                      |       |
| autoCalcComplete     | boolean default true      |       |
| percentComplete      | numeric(5,2) default 0    |       |
| status               | enum('active','archived') |       |
| recurrenceRule       | text null                 |       |
| createdAt, updatedAt | timestamptz               |       |

### 4.3 milestone

| Field                | Type                             | Notes |
| -------------------- | -------------------------------- | ----- |
| id                   | uuid pk                          |       |
| projectId            | uuid fk                          |       |
| name                 | text                             |       |
| weight               | numeric(5,2) (auto even if null) |       |
| dueDate              | date                             |       |
| status               | enum(todo,doing,done)            |       |
| createdAt, updatedAt | timestamptz                      |       |

### 4.4 task

| Field                           | Type                                  | Notes |
| ------------------------------- | ------------------------------------- | ----- |
| id                              | uuid pk                               |       |
| projectId                       | uuid fk                               |       |
| milestoneId                     | uuid fk null                          |       |
| parentTaskId                    | uuid fk null recursive                |       |
| title                           | text                                  |       |
| description                     | text                                  |       |
| assigneeId                      | uuid fk → user                        |       |
| dueDate                         | date                                  |       |
| status                          | enum(todo,doing,review,done,archived) |       |
| recurrenceRule                  | text null                             |       |
| xpEarned                        | int default 0                         |       |
| createdAt, updatedAt, deletedAt | timestamptz                           |       |

### 4.5 taskTag (M‑N pivot)

`taskId uuid, tagId uuid, primary key(taskId, tagId)`

### 4.6 xpLog

Tracks XP transactions per user.
\| id uuid pk | userId | delta int | reason text | refType text | refId uuid | createdAt |

*(Remaining tables in Appendix A).* 

## 5 · Index Strategy

| Table   | Index                          | Purpose                   |
| ------- | ------------------------------ | ------------------------- |
| task    | `btree(projectId,status)`      | quick Kanban column fetch |
| task    | `gin(title gin_trgm_ops)`      | full‑text search          |
| comment | `btree(taskId,createdAt)`      | fast task thread load     |
| xpLog   | `btree(userId,createdAt DESC)` | recent XP queries         |

## 6 · Constraints & Triggers

* `percentComplete` trigger updates on **Milestone status change**.
* `xpEarned` task trigger updates `xpLog` + aggregates to `user.xp`.

## 7 · Migration Guidelines

* Alembic‑style SQL migration per release.
* Use `NOT VALID` for FK on large tables then `VALIDATE`.
* Zero‑downtime rename via `add column → copy → swap → drop`.

## 8 · Open Questions

1. Store Tag colour in separate table or JSON?
2. Use native Postgres `generated always as` for `percentComplete`?
3. Should XP be roll‑up nightly instead of real‑time trigger?
