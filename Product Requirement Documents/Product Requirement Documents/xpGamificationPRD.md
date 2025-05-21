# idiy – xpGamificationPRD

> **Status:** Draft v0.1
> **Owner:** Product & Front‑end
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Increase engagement and positive reinforcement through an XP‑based leveling system, visual badges, and lightweight leaderboards.

## 2 · Scope (MVP)

* XP actions (tasks, projects) & formula
* Level curve (100 XP → +20 % every 10 levels)
* User profile: XP, level, progress bar
* Toast + confetti on level‑up
* Team leaderboard widget

## 3 · Out of Scope (Roadmap)

* Achievement badges (streaks, “Inbox Zero”)
* Company‑wide seasonal events

## 4 · XP Formula

| Action                                | XP  | Notes                            |
| ------------------------------------- | --- | -------------------------------- |
| Complete task in **personal** project | +2  | on state change → done           |
| Complete task in **team** project     | +5  |                                  |
| Project (personal) finished           | +20 | each member = owner only         |
| Project (team) finished               | +20 | all members + extra +20 to Owner |
| Level‑up bonus                        | —   | confetti; no extra XP            |

### 4.1 Curve

```
XPneeded(L) = 100 × 1.2^⌊(L−1)/10⌋
```

*Level 1 → 2 = 100 XP; Level 11 → 12 = 120 XP.*

## 5 · Data Model

### 5.1 user (add fields)

* `xp int default 0`
* `level int default 1`

### 5.2 xpLog

`id uuid pk, userId, delta int, reason text, refType text, refId uuid, createdAt`.

Trigger on task/project completion inserts xpLog, then:`UPDATE user SET xp = xp + NEW.delta`.

## 6 · UI / UX

| Screen           | Element                                                  |
| ---------------- | -------------------------------------------------------- |
| Profile          | Badge `Lv N`, circular progress bar (remaining XP).      |
| Toast            | “+5 XP – Task done!” bottom‑left for 2 s.                |
| Level‑Up         | Modal overlay + confetti; button “View new level perks”. |
| Dashboard widget | Leaderboard top 5 XP this month.                         |

## 7 · API Endpoints

| Method | Path                        | Description           |
| ------ | --------------------------- | --------------------- |
| GET    | `/users/:id/xp`             | current XP & level    |
| GET    | `/leaderboard?period=month` | top users by XP delta |

## 8 · Edge Cases

* XP rollback if task un‑done (subtract delta)
* Multiple owners on team project → each gets +20.

## 9 · Open Questions

1. Should overdue penalty subtract XP?
2. Leaderboard scope: workspace vs company?
3. Need XP per workspace split?

---