# Invite System — Design, Security, and Risk

## How it works

Access to RecipeCards is restricted to invited users only. The full flow:

1. An existing validated user generates an invite code (UUID v4) via Settings screen
2. They share the code with the intended recipient — the in-app share sheet pre-fills a message including a leakage warning
3. The recipient enters the code on the Login screen, then taps "Continue with Google"
4. The app validates the code server-side (Edge Function) before opening the Google OAuth browser
5. After Google OAuth, the app calls `consume-invite` which marks the code used and sets `app_metadata.invite_validated = true` on the new user via the service role key
6. The session is refreshed so `invite_validated` is immediately visible
7. All Supabase RLS policies check `invite_validated = true` before granting any data access

## Why the check is server-side (critical)

The `consume-invite` Edge Function sets `invite_validated = true` using the **service role key** — a key that never leaves the server. The mobile app cannot set this flag directly. Even a modified APK that bypasses the invite code screen will create a Supabase user without `invite_validated = true`, and every RLS policy on every table will deny that user access to all data.

## Invite code properties

| Property | Value |
|---|---|
| Format | UUID v4 — 128-bit random, not guessable by brute force |
| Lifetime | 7 days from creation |
| Uses | Single-use — consumed immediately on first valid login |
| Per-user limit | 5 active (unused + unexpired) invites at a time |
| Traceability | Every code records `created_by` (the inviting user's UUID) |

---

## ⚠️ PRIMARY RISK: INVITE LEAKAGE

**This is the system's most significant vulnerability.** It is a social engineering attack, not a technical one, and cannot be fully mitigated with code.

### The attack
A legitimate user receives 5 invite codes. They share all 5 with unauthorized people — intentionally (insider threat) or carelessly (forwarded a screenshot to the wrong group chat). Each code grants one new user full access.

### Why it cannot be fully prevented
- Invite codes are plaintext — they can be forwarded, screenshotted, or posted publicly
- We cannot distinguish an authorized recipient from an unauthorized one before the code is used
- Once shared, there is no technical mechanism to recall the code before consumption

### How to reduce the impact

1. **Codes are single-use**: a forwarded code can only onboard one person; the intended recipient claims the slot if they get there first
2. **5-invite cap**: an insider cannot silently provision unlimited accounts
3. **7-day expiry**: careless oversharing has a bounded window
4. **Traceability**: `created_by` is always recorded — misuse is attributable to a specific account
5. **In-app warning**: every invite generation displays the leakage warning before showing the code
6. **Share message warning**: the pre-filled share text includes the warning so the recipient also sees it

### Mandatory UI requirement

Every screen or component that shows an invite code must display this warning (or a direct translation):

> "This code is single-use and tied to your account. Sharing it with someone who should not have access is a violation of this app's terms and can be traced back to you."

This warning must be visible by default — not collapsed, not behind a toggle, not in a tooltip.

---

## Admin operations (Supabase dashboard → SQL editor)

### Find who invited a specific user
```sql
select i.code, i.created_at, i.used_at, u.email as inviter_email
from public.invitations i
join auth.users u on u.id = i.created_by
where i.used_by = '<suspect-user-uuid>';
```

### List all active invites for a user
```sql
select code, expires_at, used_by, used_at
from public.invitations
where created_by = '<user-uuid>'
order by created_at desc;
```

### Revoke all unused invites for a user (after suspected misuse)
```sql
delete from public.invitations
where created_by = '<user-uuid>'
  and used_at is null;
```

### Remove an unauthorized user
```
In Supabase dashboard: Authentication → Users → find by email → Delete user
This revokes their session immediately and removes all auth records.
```

---

## Security requirements checklist

Run this checklist before every production release:

- [ ] S1: Invite validation is enforced in a Supabase Edge Function, not only in the app
- [ ] S2: Invite codes are generated with `gen_random_uuid()` — not sequential or guessable
- [ ] S3: `used_at` is stamped atomically with an optimistic lock in `consume-invite`
- [ ] S4: `expires_at` is checked in both `validate-invite` and `consume-invite`
- [ ] S5: `generate-invite` blocks requests when the user already has 5 active invites
- [ ] S6: `app_metadata.invite_validated` is set only via `adminClient.auth.admin.updateUserById`
- [ ] S7: Every data table has an RLS policy that checks `invite_validated = true`
- [ ] S8: `expo-auth-session` PKCE is active (default — do not disable)
- [ ] S9: Both debug and production SHA-1 fingerprints are registered in Google Cloud Console
- [ ] S10: `InviteShareCard` leakage warning is visible by default whenever a code is shown
- [ ] S11: Security agent review (`/security-review`) run and all HIGH/CRITICAL findings resolved
