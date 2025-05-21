# idiy – tasksViewsPRD
> **Status:** Draft v0.1
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Define task life‑cycle rules, view behaviours (Outline, Table, Kanban, Calendar, Timeline) and filtering logic for the MVP.

## 2 · Scope (MVP)

* Task states: **todo → doing → review → done → archived**
* Review flow with optional Reviewer (+5 XP approve)
* Views: Outline (default), Table, Kanban, Calendar, Timeline / Gantt
* Today / Upcoming preset filters
* Someday / Maybe folder (user‑scoped)
* Auto‑tagging patterns (user‑specific)
* Recurring projects & tasks (roadmap)

## 3 · Task Life‑cycle

| State        | Allowed transitions                        | Notes                         |
| ------------ | ------------------------------------------ | ----------------------------- |
| **todo**     | → doing · archived                         | creation default              |
| **doing**    | → review · todo                            | Assignee only                 |
| **review**   | → done (Reviewer) · todo (Reviewer reject) | Assignee cannot bypass        |
| **done**     | → archived · todo (reopen)                 | XP granted at done            |
| **archived** | —                                          | hidden except archived filter |

## 4 · Review Flow

1. Assignee drags task to **review** or drops Reviewer avatar.
2. Task locked for assignee.
3. Reviewer sees badge **Needs Review**.
4. Approve → state **done**, +5 XP to assignee.
5. Reject → state **todo**, modal comment required.
6. Notifications: in‑app + push + Discord to assignee & PM.

## 5 · Views

### 5.1 Outline

* Tree depth unlimited; indent 24 px per level.
* ⌘⏎ = quick add sibling; ⌥→/⌥← promote/demote level.
* Collapse stores in localStorage per project.

### 5.2 Table

* Columns: Title · Tag · Due Date · Assignee · Status · XP.
* Column visibility toggle; state saved per user per project.
* Inline edit on double‑click.

### 5.3 Kanban

* Default columns map to **status** enum.
* Column header shows count & WIP colour (grey <5, orange 5‑9, red ≥10).
* Drag card → triggers state change; if to **review** requires Reviewer.

### 5.4 Calendar

* Weekly & Monthly; Sat/Sun toggle chips.
* Task chips coloured by status (todo grey, doing blue, review yellow, done green, overdue red).
* Drag to change **dueDate**; Ctrl‑drag duplicates.

### 5.5 Timeline (Gantt)

* Bars from `startDate`→`dueDate`; milestones as diamonds.
* Zoom week⇆quarter slider.
* Critical path highlight (roadmap).

## 6 · Filters & Perspectives

| Filter              | Description                                |
| ------------------- | ------------------------------------------ |
| **Today**           | dueDate = today OR overdue, assignee = @me |
| **Upcoming**        | dueDate within next 14 days                |
| **Tag**             | filter chip; multiple tags = OR            |
| **Assignee**        | dropdown + @me shortcut                    |
| **Someday / Maybe** | folder; not visible in default views       |

## 7 · Auto‑Tagging

* Client parses title on quick‑add; if regex matches user’s *UserAutoTag* list → attach tag.
* No auto‑tag if user manually added tags in modal.

## 8 · Recurring (Roadmap)

* Task field `recurrenceRule` (RFC‑5545).
* When dueDate reached, system clones new instance with links.
*

## 9 · API Endpoints (excerpt)

| Method | Path                                                         | Description             |
| ------ | ------------------------------------------------------------ | ----------------------- |
| POST   | `/tasks`                                                     | create task             |
| PATCH  | `/tasks/:id`                                                 | update (inline/table)   |
| POST   | `/tasks/:id/review`                                          | reviewer approve/reject |
| GET    | `/projects/:id/tasks?view=calendar&from=2025-06-01&to=06-30` | calendar feed           |

## 10 · Open Questions

1. Allow custom Kanban columns (tag‑based) at MVP?
2. Need bulk edit in Outline view?
3. Timeline critical path necessary phase 1?

---