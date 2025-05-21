# idiy – searchFilterPRD

> **Status:** Draft v0.1
> **Owner:** Backend & Front‑end
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Describe full‑text search, advanced query syntax, filter UI, and saved‑view behaviour to help users quickly locate tasks, projects, and comments.

## 2 · Scope (MVP)

* Global omnibox (⌘K) search across tasks, projects, tags, users
* Advanced token syntax (`key:value`)
* View‑level filter chips (Tag, Status, Assignee, Date range, XP)
* Saved filters per user per view

## 3 · Out of Scope (Roadmap)

* Cross‑workspace analytics search
* Search inside attachments (PDF, Docs)

## 4 · User Stories

| ID    | Story                                                                           |
| ----- | ------------------------------------------------------------------------------- |
| SF‑01 | *As a user* I type “invoice jan tag\:finance” and instantly see matching tasks. |
| SF‑02 | *As a PM* I save a filter “Overdue @team” and reuse it daily.                   |
| SF‑03 | *As a Dept Head* I filter Calendar to only tasks tagged `critical`.             |

## 5 · Query Syntax

```
invoice jan tag:finance status:todo assignee:@me before:2025-02-01
```

| Token                | Meaning                       |
| -------------------- | ----------------------------- |
| `tag:`               | tag name (OR within same key) |
| `status:`            | todo, doing, review, done     |
| `assignee:`          | user handle, `@me` shortcut   |
| `before:` / `after:` | dueDate comparison            |
| `project:`           | project name (fuzzy)          |

Unqualified words match title/description full‑text.

## 6 · UI Components

* **Omnibox Modal** – opens with ⌘K; top hits show task/project/tag icons.
* **Filter Bar** – chip group below view header; clicking chip opens dropdown multi‑select.
* **Saved View Tabs** – persistent across sessions, reorder drag.

## 7 · Backend Implementation

### 7.1 Text Search

* pg\_trgm GIN index on `task.title`, `task.description`.
* `ILIKE` fallback for small tables (<10 k rows).

### 7.2 Parsed Query → SQL

* Tokeniser splits input; builds `WHERE` expression.
* Example output:

```sql
SELECT * FROM task
WHERE project_id = $1
  AND status = 'todo'
  AND due_date < '2025-02-01'
  AND (title % 'invoice' OR description % 'invoice')
```

### 7.3 Pagination

* Cursor‑based: `?cursor=ts_20250520_abc` (createdAt,id). Limit 50.

## 8 · Saved Filters

* Table **SavedView**: `id,userId,viewKey,jsonFilter,name,sort`.
* Linked to route via `?savedViewId=` param.
* Shared? (roadmap) – workspace shared filters.

## 9 · API Endpoints

| Method | Path                          | Description           |
| ------ | ----------------------------- | --------------------- |
| GET    | `/search?q=&cursor=`          | global omnibox search |
| GET    | `/projects/:id/tasks?filter=` | list with JSON filter |
| POST   | `/saved-views`                | create                |
| PATCH  | `/saved-views/:id`            | update                |
| DELETE | `/saved-views/:id`            | remove                |

## 10 · Performance Targets

* 50 k tasks → search response ≤ 500 ms 95‑th percentile.
* Omnibox top 5 results ≤ 150 ms.

## 11 · Open Questions

1. Support AND between different tags?
2. Need NOT (`-tag:bug`) in MVP?
3. Should saved views sync to mobile offline?

---