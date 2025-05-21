# idiy – authSecurityPRD

> **Status:** Draft v0.1  
> **Owner:** Backend Lead  
> **Last updated:** 20 May 2025

---

## 1 · Purpose
Define authentication flows, session management, rate‑limiting, and security posture for the idiy platform MVP.

## 2 · Scope (MVP)
* Email + password sign‑in & sign‑up
* Google / Microsoft OAuth 2.0
* Magic‑link (email) for passwordless
* Remember‑me (30 days vs 12 h session)
* Password reset (“Forgot?” link)
* Rate‑limit login endpoints
* JWT (Supabase) + Row‑Level Security (RLS)

## 3 · Out of Scope (Roadmap)
* TOTP 2FA
* SAML / SCIM enterprise SSO

## 4 · User Stories
1. **As a new user** I can create an account with email + password.  
2. **As a returning user** I can tick “Remember me” to stay signed in for 30 days.  
3. **As a PM** I can invite colleagues; if they already have a Google account they can one‑click join.  
4. **As a security admin** I can see failed‑login audits and lock an account.

## 5 · Functional Requirements
| # | Requirement | Priority |
|---|-------------|----------|
| A1 | Password min‑length 8, reject common 10 k passwords | Must |
| A2 | Email verification mandatory before workspace access | Must |
| A3 | `rememberMe=true` stores refresh token (encrypted) in `localStorage` | Must |
| A4 | 5 failed logins per IP in 15 min → CAPTCHA challenge | Must |
| A5 | `POST /auth/refresh` rotates tokens; old refresh expires immediately | Must |
| A6 | Logout clears access + refresh cookies/local storage | Must |
| A7 | Login & password‑reset events logged to **AuthAudit** table | Should |

## 6 · API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | — | body: `{email,password,name}` |
| POST | `/auth/login` | — | body: `{email,password,remember}` |
| POST | `/auth/oauth/:provider` | — | Redirect to Supabase OAuth helper |
| POST | `/auth/refresh` | refresh token | returns new access + refresh |
| POST | `/auth/logout` | access | revoke tokens |
| POST | `/auth/forgot-password` | — | send reset link |
| POST | `/auth/reset-password` | magic token | set new password |

## 7 · Database Changes
### 7.1 auth.users (Supabase)
Supabase-managed (`id`, `email`, `hashed_password`, `email_confirmed_at`, …).

### 7.2 public.authAudit
| Field | Type | Notes |
|-------|------|-------|
| id | uuid pk | |
| userId | uuid | nullable for failed attempts |
| event | text | login_success, login_fail, reset_request… |
| ip | inet | |
| userAgent | text | |
| createdAt | timestamptz default now() | |

### 7.3 RLS Policies (excerpt)
```sql
-- Users may insert their own audit row
CREATE POLICY audit_insert ON public.authAudit
FOR INSERT WITH CHECK (auth.uid() = NEW.userId OR NEW.userId IS NULL);
```

## 8 · Security Controls
* **TLS 1.3** everywhere (Vercel edge cert).
* JWT lifespan: **15 min**; refresh token: 30 days.  
* `SameSite=Lax` cookies.
* Bcrypt 12 rounds for passwords.

## 9 · Open Questions
1. Do we allow social login without email domain restriction?  
2. Should we store login IP history in user profile for display?

---

> Update via pull request or comment.
