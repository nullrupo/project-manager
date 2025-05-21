# idiy – notificationsIntegrationsPRD

> **Status:** Draft v0.1
> **Owner:** Front‑end & DevOps
> **Last updated:** 20 May 2025

---

## 1 · Purpose

Deliver timely, actionable updates to users via multiple channels (in‑app, push, email, Discord) while providing integration points (webhooks, iCal) for external tools.

## 2 · Scope (MVP)

* Notification events: task assign, status change, mention, comment, due‑soon reminder, project finished
* Channels: In‑app toast, PWA push (VAPID), Discord webhook
* User‑level channel preferences
* Digest throttling to avoid spam (15‑min bundle)
* iCalendar feed (read‑only) per user

## 3 · Out of Scope (Roadmap)

* Native APNs/FCM mobile push
* Zapier‑style inbound webhooks

## 4 · User Stories

| ID    | Story                                                                     |
| ----- | ------------------------------------------------------------------------- |
| NI‑01 | *As a team member* I get a push when I’m assigned a task.                 |
| NI‑02 | *As a reviewer* I get alerted when a task enters **review**.              |
| NI‑03 | *As a PM* I can pipe project events to a Discord channel.                 |
| NI‑04 | *As a user* I subscribe the iCal feed in Google Calendar to see my tasks. |

## 5 · Event Matrix

| Event                                      | Default Channels                   |
| ------------------------------------------ | ---------------------------------- |
| Task assigned to you                       | In‑app + Push + Discord ping       |
| Mention `@you`                             | In‑app + Push                      |
| Task moved to **review** (you’re reviewer) | In‑app + Push                      |
| Task due in 24 h                           | In‑app + Push (silent)             |
| Project marked **done**                    | In‑app + Discord (project channel) |

## 6 · Channel Preferences

* Settings › Notifications: toggles per event × channel.
* Global mute (do‑not‑disturb) schedule.

## 7 · Technical Design

### 7.1 Data Model

**Notification** table
`id, userId, eventType, payload jsonb, deliveredChannelMask int, readAt, createdAt`

Bit‑mask for channels: 1=in‑app, 2=push, 4=email, 8=discord.

### 7.2 Delivery Flow

```
Task event → enqueue (RabbitMQ) → worker fan‑out users
  ↳ write row (unread)  ↳ send push (if opt‑in)
                                     ↳ bundle digest (15 min)
```

All failures retry 3× exponential; push tokens revoked on 410 Gone.

### 7.3 Push Service

* VAPID keys stored in env var.
* Service Worker displays Rich Notification with deep‑link.
* Click clears unread + opens `/task/:id`.

### 7.4 Discord Webhook

* Each workspace can set `discordWebhookUrl`.
* JSON payload: `{username:"idiy bot", embeds:[{title,description,url,color}]}`.
* Rate‑limited to 30 req/min.

### 7.5 iCalendar Feed

* Secure token in URL (`/calendar/:token/feed.ics`).
* Tasks with dueDate emit `VEVENT`, status maps to progress.
* Regenerated on change, cached 5 min.

## 8 · API Endpoints

| Method | Path                           | Auth  | Description                       |
| ------ | ------------------------------ | ----- | --------------------------------- |
| GET    | `/notifications`               | user  | list unread & recent (pagination) |
| POST   | `/notifications/:id/read`      | user  | mark as read                      |
| GET    | `/calendar/:token/feed.ics`    | —     | public feed                       |
| POST   | `/workspaces/:id/discord-hook` | Head+ | set or remove hook                |

## 9 · Edge Cases & Throttling

* Bulk assignment (10 tasks) → single digest message.
* User disables push → server stops sending after 3 410 errors.
* iCal token reset rotates URL; old feeds 404.

## 10 · KPIs

| KPI                          | Target |
| ---------------------------- | ------ |
| Push delivery success        | ≥ 98 % |
| Notification click‑through   | ≥ 20 % |
| Avg unread older than 7 days | < 5    |

## 11 · Open Questions

1. Need email channel in MVP?
2. Should project‑level hook override workspace default?
3. Digest window adjustable per user?

---