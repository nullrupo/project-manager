# idiy – rolesPermissionsPRD

> **Status:** Draft v0.1  
> **Owner:** Product / Backend  
> **Last updated:** 20 May 2025

---

## 1 · Purpose
Define the company‑level roles, project‑level roles, workspace sharing rules, and permission matrix to ensure secure yet flexible collaboration.

## 2 · Scope (MVP)
* Five **Company Roles** (Employee · Lead · Head · DeputyDir · Director)
* Two **Project Roles** (Owner · Member)
* Workspace and cross‑workspace visibility
* Dept‑Head override: force‑add or share link without acceptance
* Basic admin panel for role assignment

## 3 · User Stories
| ID | Story |
|----|-------|
| RP‑01 | *As a Dept Head* I can force‑add one of my employees into a project instantly. |
| RP‑02 | *As a PM* I can invite an external collaborator who only sees that one project. |
| RP‑03 | *As an Employee* I cannot view projects outside workspaces I’m invited to. |
| RP‑04 | *As Director* I can view reports across all workspaces. |

## 4 · Role Definitions
### 4.1 Company Roles
| Role | Permissions Summary |
|------|---------------------|
| **Employee** | CRUD own tasks, view projects invited to |
| **Lead** | Employee + can assign tasks and set reviewers within their projects |
| **Head** | Lead + force‑add staff in their department + view workspace dashboard |
| **DeputyDir** | Head + manage all workspaces within division |
| **Director** | Global read, billing, user management |

### 4.2 Project Roles
| Role | Permissions |
|------|------------|
| **Owner** | Configure project, invite/remove, edit milestones, delete project |
| **Member** | Create tasks, comment, change status (respecting review rules) |

### 4.3 Derived Rights
* A **Company Head** automatically has *Owner* rights in any project inside their department’s workspace.
* A user may hold different ProjectRoles in different projects simultaneously.

## 5 · Permission Matrix (MVP excerpt)
| Action | Employee | Lead | Head | DeputyDir | Director |
|--------|----------|------|------|-----------|----------|
| View project list in own workspace | ✔︎ | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| Create workspace | — | — | — | — | ✔︎ |
| Invite member (needs accept) | ✔︎ | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| **Force‑add user** | — | — | ✔︎ (dept only) | ✔︎ (division) | ✔︎ (all) |
| Remove project owner | — | — | — | ✔︎ | ✔︎ |
| View company‑wide report | — | — | — | — | ✔︎ |

## 6 · API & DB Changes
### 6.1 Tables
* **CompanyRole** *(enum in `users.companyRole`)*
* **ProjectMember** `role` (owner|member)
* **WorkspaceHead** `(workspaceId, userId)` for cross‑dept projects

### 6.2 Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects/:id/invite` | Owner | invite via email (needs accept unless force flag) |
| POST | `/projects/:id/force‑add` | Head+ | body `{userId}`  → add instantly |
| GET  | `/workspaces/:id/projects` | Member of workspace OR Head of that workspace |

### 6.3 RLS Examples
```sql
-- Force‑add allowed if caller is head of the workspace
CREATE FUNCTION is_workspace_head(wid uuid) RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (SELECT 1 FROM workspaceHead wh WHERE wh.workspaceId = wid AND wh.userId = auth.uid());
$$;

CREATE POLICY force_add_head ON public.projectMember
FOR INSERT WITH CHECK (
  (is_workspace_head(new.projectId_workspace()) AND new.role = 'member')
   OR auth.uid() = new.userId
);
```

## 7 · Admin UI Flow
1. Navigate **Settings › Workspace › Members**.
2. Dept‑Head sees “Add instantly” switch when selecting a user from their department.
3. Confirmation modal; activity logged to audit table.

## 8 · Edge Cases & Rules
* A user with multiple company roles (rare) inherits the **highest** privilege.  
* Force‑add cannot override a project‑level **Owner** removal unless role ≥ DeputyDir.

## 9 · Open Questions
1. Should we allow more granular project roles (Reviewer, Observer)?  
2. Do external collaborators need a restricted company role (Guest)?

---

> Update this doc via PR or canvas comment.
