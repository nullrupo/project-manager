# idiy – aiAssistPRD (Roadmap)

> **Status:** Draft v0.1
> **Owner:** Product / ML Eng
> **Target Milestone:** Q4 2025

---

## 1 · Purpose

Leverage LLM capabilities to reduce planning friction by suggesting task grouping, breaking down large tasks, estimating effort, and auto-tagging.

## 2 · Scope (Phase 1)

* Inline **“AI Assist”** button in Task/Project modal
* Three actions:
  A. *Group Similar Tasks*
  B. *Break Down Task*
  C. *Add Estimate*
* GPT‑4o via OpenAI Tools API (function calling)
* Opt‑in per workspace (disabled by default)

## 3 · Out of Scope (Later)

* Natural‑language “Add task…” chat sidebar
* Auto‑scheduling across calendars
* Code‑introspection for dev teams

## 4 · User Stories

| ID    | Story                                                                               |
| ----- | ----------------------------------------------------------------------------------- |
| AI‑01 | *As a PM* I click **AI Assist › Group** on 15 tasks and get 3 suggested epics.      |
| AI‑02 | *As a member* I click **Break Down** on a vague task and get 4 actionable subtasks. |
| AI‑03 | *As a PM* I ask AI to estimate Pomodoro counts for all tasks in Kanban column.      |

## 5 · Functional Requirements

| #   | Requirement                                                       | Priority |
| --- | ----------------------------------------------------------------- | -------- |
| AI1 | Model context limited to task titles, descriptions, tags — no PII | Must     |
| AI2 | Output shown in modal diff — user must *Accept* to apply          | Must     |
| AI3 | Cost cap 0.002 USD per call; 5 calls/user/day                     | Must     |
| AI4 | Logs stored for 30 days for debugging; redacted by default        | Should   |

## 6 · Technical Design

### 6.1 Prompt Template (example “Break Down”)

```json
{
 "system": "You are a project‑management assistant…",
 "user": "Break down this task into max 5 subtasks:\n{{title}} – {{description}}"
}
```

Model returns `[{title,description,estimate}]` via function call.

### 6.2 Data Flow

User click → fetch task context → call `/ai/suggest` → OpenAI → response → show diff → write `aiUsage` log.

### 6.3 Privacy Guardrails

* Strip emails, phone, links via regex before sending.
* Workspace setting **Allow AI** default *Off*; requires Admin enable.

### 6.4 Cost Monitoring

* Table `aiUsage` (id,userId,promptTokens,completionTokens,costUsd,action).
* Dashboard in Admin › Usage.

## 7 · UI / UX

* **AI Assist** dropdown in modal footer.
* Animated sparkle icon.
* Diff dialog: left original, right suggestion with Add/Skip per item.

## 8 · API Endpoints

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| POST   | `/ai/suggest`     | body `{action, context}` returns suggestions |
| GET    | `/admin/ai-usage` | workspace admins view spend                  |

## 9 · KPIs

| KPI                            | Target (3 mo post‑launch) |
| ------------------------------ | ------------------------- |
| Assist acceptance rate         | ≥ 30 %                    |
| Avg prompts / active user / wk | ≥ 3                       |
| Cost / active user / month     | ≤ 0.30 USD                |

## 10 · Open Questions

1. Expose OpenAI key BYO for enterprise?
2. Fine‑tuned local model fallback for data‑sensitive orgs?
3. Other assist types (rewrite description, tag suggestions)?

---

> Update **aiAssistPRD.md** via PR.
