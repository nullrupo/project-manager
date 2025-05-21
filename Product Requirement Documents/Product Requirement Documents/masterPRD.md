# idiy – Master PRD

> **Status:** Draft v0.1  
> **Owners:** Product Manager • Nguyễn Trọng Quốc  
> **Last updated:** 20 May 2025

---

## 1 · Executive Summary

idiy is a cross‑platform project & personal task manager that applies **Getting Things Done™** at team scale, eliminating the need for separate GTD and PM tools. The MVP (launch **01 Jul 2025**) targets small‑to‑large teams (> 30 users) on Web + PWA.

## 2 · Problem & Goals

| Pain Point | Goal |
|------------|------|
| Two disconnected systems (OmniFocus + Freedcamp) → copy‑paste tasks | **One app** for both personal & team work, no context‑switch |
| PM tools ignore GTD’s inbox / review loops | First‑class **GTD flows** (Inbox, Clarify, Review) |
| Mac‑only GTD apps block Windows users | **Web+PWA** works on 90 % Windows, 80 % iOS |
| Hard to see workload & accountability | Transparent **dashboard & workload heatmap** |

## 3 · USP & Differentiation

* GTD‑native + Kanban compatible  
* Opinionated & lightning‑fast (keyboard, templates, CSV import)  
* Cross‑platform PWA with offline push & Discord webhooks  
* Built‑in XP gamification for engagement

## 4 · Target Users

| Persona | Need |
|---------|------|
| **Team Member** | Capture tasks fast, stay on Today/Upcoming list |
| **Team Lead / PM** | Plan calendar, balance workload, review tasks |
| **Dept Head** | Cross‑project overview, force‑add members |

## 5 · Scope (MVP)

| Area | Included |
|------|----------|
| Tasks | Inbox → Todo/Doing/Review/Done, tags, assignee, due date |
| Projects | Milestones, percent complete, cross‑workspace |
| Views | Outline · Table · Kanban · Calendar · Timeline |
| Auth | Email/password, Google/MS OAuth, remember‑me, reset |
| Backup | Personal download ZIP, nightly DB dump |
| Notifications | In‑app, PWA push, Discord webhook |
| XP System | +2/+5 per task, level curve (100 XP first 10 lv) |

*(Full requirement sets live in dedicated docs — see “Related Documents”).*

## 6 · Success Metrics

| Metric | Target @ Day 30 |
|--------|--------------|
| Weekly Active Teams | ≥ 50 |
| Avg tasks created per active user | ≥ 25 / wk |
| Inbox‑to‑Project clarify ratio | ≥ 90 % within 24 h |
| Page FCP (4G, P75) | ≤ 1.5 s |

## 7 · Non‑Functional Requirements (excerpt)

* TTFB ≤ 200 ms @ 95th pct  
* 99.9 % uptime (API + DB)  
* WCAG 2.1 AA  
* Personal backup ≤ 200 MB, 7 copies retained

*(Full NFR table: see **nfrPRD.md**) *

## 8 · Roadmap Snapshot

| Q3 2025 | Q4 2025 |
|---------|---------|
| Offline mode sync | AI Suggest (group/estimate) |
| Automated Drive backup | Recurring projects |
| Review wizard | 2FA TOTP |

## 9 · Related Documents

* **uxUiPRD.md** – Layout, component library, themes  
* **authSecurityPRD.md** – login, sessions, rate‑limits  
* **rolesPermissionsPRD.md** – company vs project scopes  
* **backupRestorePRD.md** – export, pg_dump, Drive sync  
* **dataModelPRD.md** – ERD & migrations  
* **tasksViewsPRD.md** – task lifecycle, views, filters  
* **notificationsIntegrationsPRD.md** – reminders, iCal, webhooks  
* **searchFilterPRD.md** – full‑text & advanced query  
* **xpGamificationPRD.md** – XP curve & UI  
* **aiAssistPRD.md** – GPT‑powered suggestions *(roadmap)*

---

### Open Questions

1. Confirm XP formula granularity?  
2. Decide primary KPIs for dashboard?  
3. Finalise dark‑theme palette contrasts.

---

> *End of masterPRD.md — Update via pull request or comment in canvas.*
