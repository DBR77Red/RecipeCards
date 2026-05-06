# Google Auth + Invite-Only Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add invite-only Google OAuth authentication so only users invited by an existing member can access the app, with all access control enforced server-side regardless of what the client does.

**Architecture:** Google OAuth via `expo-auth-session` + Supabase Auth handles identity. An invite code (UUID) is validated and consumed by a Supabase Edge Function before any user gains data access. All Supabase tables are gated by `app_metadata.invite_validated = true` in RLS policies — a flag that only the service-role Edge Function can set, never the client. A modified APK that skips the invite screen still cannot read or write any data.

**Tech Stack:** `expo-auth-session`, `expo-web-browser`, `expo-crypto`, `@supabase/supabase-js`, Supabase Edge Functions (Deno), Supabase RLS, AsyncStorage

---

## ⚠️ PRIMARY RISK: INVITE LEAKAGE — READ BEFORE IMPLEMENTING ANYTHING

This system has one attack vector that **cannot be closed with code**: a legitimate user sharing their invite code with an unauthorized person, intentionally or carelessly.

### Why it cannot be fully prevented
- Invite codes are plaintext UUIDs — they can be forwarded, screenshotted, or posted anywhere
- We cannot distinguish an authorized recipient from an unauthorized one before the code is used
- Once a code is shared, there is no way to recall it before it is consumed

### What the system does to limit the blast radius
1. **Single-use codes** — a forwarded code can only create one account; the intended recipient gets there first or loses the slot
2. **5-invite limit per user** — a rogue insider cannot flood the system; maximum 5 active codes per account at any time
3. **7-day expiry** — carelessly shared codes expire within a week whether used or not
4. **Full traceability** — every invite records `created_by`; if an unauthorized user appears, the inviting account is identifiable in seconds
5. **In-app warning** — every time a code is displayed, a prominent warning states the code is traceable and misuse violates terms
6. **Share sheet warning** — the pre-filled share message includes the leakage warning so recipients see it too

### Non-negotiable UI requirement
Every surface that shows an invite code **must** display this exact warning (or a translation equivalent):

> "This code is single-use and tied to your account. Sharing it with someone who should not have access is a violation of this app's terms and can be traced back to you."

This warning is not optional and must not be hidden behind a toggle or collapsed by default.

---

## Security Requirements (all must pass before merging)

| ID | Requirement | Enforced at |
|---|---|---|
| S1 | Invite check is server-side, not client-only | Supabase Edge Function + RLS |
| S2 | Invite codes are UUID v4 (`gen_random_uuid()`) | Postgres default |
| S3 | Codes are single-use — `used_at` stamped on consume | Edge Function optimistic lock |
| S4 | Codes expire after 7 days | `expires_at` checked in Edge Function |
| S5 | Per-user limit of 5 active invites | `generate-invite` Edge Function |
| S6 | `app_metadata.invite_validated` set only via service role | Supabase Auth admin API |
| S7 | All data tables have RLS checking `invite_validated` | Supabase migration |
| S8 | PKCE used in OAuth flow | `expo-auth-session` default |
| S9 | Release keystore SHA-1 registered in Google Cloud Console | Task 6 |
| S10 | Invite leakage warning shown every time a code is displayed | `InviteShareCard` component |
| S11 | Security agent review run before merging | Task 12 |

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `supabase/migrations/20260428_invite_system.sql` | `invitations` table + RLS policies on all data tables |
| `supabase/functions/validate-invite/index.ts` | Check code exists, unused, not expired (called before OAuth) |
| `supabase/functions/consume-invite/index.ts` | Mark code used, set `app_metadata.invite_validated` (called after OAuth) |
| `supabase/functions/generate-invite/index.ts` | Create invite code for authenticated validated user (max 5) |
| `src/context/AuthContext.tsx` | Session state, `isValidated` derived flag, `signOut` helper |
| `src/screens/LoginScreen.tsx` | Invite code entry + Google OAuth sign-in |
| `src/components/InviteCodeInput.tsx` | Styled invite code text input with validation feedback |
| `src/components/InviteShareCard.tsx` | Displays generated code + mandatory leakage warning |
| `docs/INVITE_SYSTEM.md` | Full risk documentation + admin runbook |

### Modified files
| File | Change |
|---|---|
| `App.tsx` | Wrap with `AuthProvider`; render `LoginScreen` when not authenticated |
| `src/types/navigation.ts` | Add `Login: undefined` to `RootStackParamList` |
| `src/screens/ProfileScreen.tsx` | Add sign-out button + invite generation entry point |

---

## Task 1: Database — Invitations Table + RLS

**Files:**
- Create: `supabase/migrations/20260428_invite_system.sql`

- [ ] **Step 1.1: Write the migration**

```sql
-- supabase/migrations/20260428_invite_system.sql

-- Invitations table
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  code        uuid not null unique default gen_random_uuid(),
  created_by  uuid not null references auth.users(id) on delete cascade,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

-- Fast lookup by code (called on every login attempt)
create index invitations_code_idx on public.invitations(code);

-- RLS: owners can see their own generated invites; all writes via service role only
alter table public.invitations enable row level security;

create policy "owner reads own invites"
  on public.invitations for select
  using (created_by = auth.uid());

-- Gate the recipes table on invite_validated
-- Run the same pattern for every table that holds user data
alter table public.recipes enable row level security;

drop policy if exists "authenticated users can read recipes" on public.recipes;

create policy "invite_validated users read recipes"
  on public.recipes for select
  using (
    (auth.jwt() -> 'app_metadata' ->> 'invite_validated')::boolean = true
  );

create policy "invite_validated users write own recipes"
  on public.recipes for insert
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'invite_validated')::boolean = true
    and auth.uid() = user_id
  );

create policy "invite_validated users update own recipes"
  on public.recipes for update
  using (
    (auth.jwt() -> 'app_metadata' ->> 'invite_validated')::boolean = true
    and auth.uid() = user_id
  );
```

- [ ] **Step 1.2: Apply the migration**

Use the Supabase MCP tool (`mcp__plugin_supabase_supabase__apply_migration`) with the SQL above, or run:

```bash
npx supabase db push
```

- [ ] **Step 1.3: Verify**

In Supabase dashboard → Table Editor: confirm `invitations` exists with columns `id`, `code`, `created_by`, `used_by`, `used_at`, `expires_at`, `created_at`.

In Authentication → Policies: confirm `recipes` has the three `invite_validated` policies.

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/20260428_invite_system.sql
git commit -m "feat(auth): add invitations table and invite_validated RLS gate on recipes"
```

---

## Task 2: Edge Function — Validate Invite

Called before OAuth starts. Checks the code exists, is unused, and has not expired. Requires no auth (user has no session yet).

**Files:**
- Create: `supabase/functions/validate-invite/index.ts`

- [ ] **Step 2.1: Create the directory**

```bash
mkdir -p supabase/functions/validate-invite
```

- [ ] **Step 2.2: Write the function**

```typescript
// supabase/functions/validate-invite/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'missing_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedCode = code.trim().toLowerCase()

    // Reject obviously invalid input before hitting the DB — prevents enumeration noise
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    if (!uuidRegex.test(normalizedCode)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'invalid_format' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase
      .from('invitations')
      .select('id, used_at, expires_at')
      .eq('code', normalizedCode)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, error: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (data.used_at) {
      return new Response(
        JSON.stringify({ valid: false, error: 'already_used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (new Date(data.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ valid: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
```

- [ ] **Step 2.3: Deploy**

```bash
npx supabase functions deploy validate-invite --no-verify-jwt
```

`--no-verify-jwt` is correct here: the caller has no session yet.

- [ ] **Step 2.4: Test with curl**

```bash
# Should return { valid: false, error: 'not_found' }
curl -X POST "$SUPABASE_URL/functions/v1/validate-invite" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"code": "00000000-0000-0000-0000-000000000000"}'

# Should return { valid: false, error: 'invalid_format' }
curl -X POST "$SUPABASE_URL/functions/v1/validate-invite" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"code": "not-a-uuid"}'
```

Where `SUPABASE_URL=https://hlvaztyvrpyfpgojitvu.supabase.co`.

- [ ] **Step 2.5: Commit**

```bash
git add supabase/functions/validate-invite/
git commit -m "feat(auth): add validate-invite edge function with UUID guard"
```

---

## Task 3: Edge Function — Consume Invite

Called immediately after OAuth success. Marks the code used and sets `app_metadata.invite_validated = true`. This is the server-side enforcement gate — the flag that all RLS policies check.

**Files:**
- Create: `supabase/functions/consume-invite/index.ts`

- [ ] **Step 3.1: Create the directory**

```bash
mkdir -p supabase/functions/consume-invite
```

- [ ] **Step 3.2: Write the function**

```typescript
// supabase/functions/consume-invite/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedCode = code.trim().toLowerCase()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Resolve caller identity from their JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Idempotent: if already validated, return success without consuming another invite
    if (user.app_metadata?.invite_validated === true) {
      return new Response(
        JSON.stringify({ success: true, alreadyValidated: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: invite, error: inviteError } = await adminClient
      .from('invitations')
      .select('id, used_at, expires_at')
      .eq('code', normalizedCode)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ success: false, error: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (invite.used_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'already_used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Optimistic lock: only update if still unused — handles race condition where
    // two clients submit the same code simultaneously
    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)
      .is('used_at', null)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'race_condition' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Set invite_validated in app_metadata — service role only, client cannot do this
    const { error: metaError } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: { invite_validated: true },
    })

    if (metaError) {
      // Roll back the invite consumption so the user can retry
      await adminClient
        .from('invitations')
        .update({ used_by: null, used_at: null })
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({ success: false, error: 'metadata_update_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
```

- [ ] **Step 3.3: Deploy**

```bash
npx supabase functions deploy consume-invite
```

Do NOT use `--no-verify-jwt` — this function requires a valid user session.

- [ ] **Step 3.4: Test the race condition guard**

Insert a test invite in the Supabase SQL editor:

```sql
insert into public.invitations (code, created_by)
values ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '<any-real-user-uuid>');
```

Call `consume-invite` twice concurrently with a real JWT and the same code. Exactly one call must return `{ success: true }`; the other must return `{ success: false, error: 'race_condition' }` or `already_used`.

- [ ] **Step 3.5: Commit**

```bash
git add supabase/functions/consume-invite/
git commit -m "feat(auth): add consume-invite edge function with optimistic lock and rollback"
```

---

## Task 4: Edge Function — Generate Invite

Called by authenticated validated users to create invite codes. Enforces the 5-invite active limit.

**Files:**
- Create: `supabase/functions/generate-invite/index.ts`

- [ ] **Step 4.1: Create the directory**

```bash
mkdir -p supabase/functions/generate-invite
```

- [ ] **Step 4.2: Write the function**

```typescript
// supabase/functions/generate-invite/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ACTIVE_INVITES = 5
const EXPIRY_DAYS = 7

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'invalid_token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Only invite-validated users can generate invites
  if (!user.app_metadata?.invite_validated) {
    return new Response(
      JSON.stringify({ error: 'not_validated' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Count active (unused + unexpired) invites for this user
  const { count, error: countError } = await adminClient
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())

  if (countError) {
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if ((count ?? 0) >= MAX_ACTIVE_INVITES) {
    return new Response(
      JSON.stringify({ error: 'limit_reached', limit: MAX_ACTIVE_INVITES }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

  const { data: invite, error: insertError } = await adminClient
    .from('invitations')
    .insert({ created_by: user.id, expires_at: expiresAt.toISOString() })
    .select('code, expires_at')
    .single()

  if (insertError || !invite) {
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ code: invite.code, expiresAt: invite.expires_at }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
```

- [ ] **Step 4.3: Deploy**

```bash
npx supabase functions deploy generate-invite
```

- [ ] **Step 4.4: Test limit enforcement**

Insert 5 active invites for a test user in SQL editor:

```sql
insert into public.invitations (created_by, expires_at)
select '<user-uuid>', now() + interval '7 days'
from generate_series(1, 5);
```

Call `generate-invite` with that user's JWT. Must return `{ error: 'limit_reached', limit: 5 }`.

- [ ] **Step 4.5: Commit**

```bash
git add supabase/functions/generate-invite/
git commit -m "feat(auth): add generate-invite edge function with 5-invite active limit"
```

---

## Task 5: Dev Google OAuth Setup

One-time configuration for development builds (Expo Go / local debug APK). No code changes — configuration only.

- [ ] **Step 5.1: Create an Android OAuth credential in Google Cloud Console**

1. Go to `console.cloud.google.com` → select or create project `RecipeCards`
2. APIs & Services → Enable APIs → search "Google Identity" → Enable
3. APIs & Services → Credentials → Create Credentials → OAuth Client ID → **Android**
4. Package name: match `android.package` in `app.json` exactly (e.g. `com.danielrcamelo.recipecards`)
5. SHA-1 fingerprint for the **debug keystore**:

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android \
  | grep SHA1
```

6. Save the resulting Android Client ID

- [ ] **Step 5.2: Create a Web OAuth credential (required by Supabase)**

Back in Credentials → Create Credentials → OAuth Client ID → **Web application**
- Name: `RecipeCards Supabase`
- Authorized redirect URI: `https://hlvaztyvrpyfpgojitvu.supabase.co/auth/v1/callback`
- Save the **Client ID** and **Client Secret** (these go into Supabase, not the app)

- [ ] **Step 5.3: Configure Supabase Google provider**

1. Supabase dashboard → Authentication → Providers → Google → Enable
2. Client ID: the **Web** client ID from Step 5.2
3. Client Secret: the Web client secret from Step 5.2
4. Save

- [ ] **Step 5.4: Confirm deep link scheme in app.json**

Open `app.json`. Confirm the following exists under `"expo"`:

```json
"scheme": "recipecards",
"android": {
  "package": "com.danielrcamelo.recipecards",
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [{ "scheme": "recipecards" }],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

Add any missing fields. Do not duplicate existing ones.

- [ ] **Step 5.5: Verify dev OAuth works**

After Task 9 (LoginScreen) is complete, run `npx expo start --clear`, open on Android, attempt Google sign-in. A browser window should open Google's consent screen. After consent the app should receive the callback. Verify in Supabase → Authentication → Users that a new user appears with provider `google`.

---

## Task 6: Production Google OAuth Setup

Adds the release keystore SHA-1 so Google OAuth works in Play Store builds. Configuration only.

- [ ] **Step 6.1: Get the production SHA-1**

**If using EAS Build:**

```bash
eas credentials
# Select: Android → Production → View credentials → copy SHA-1
```

**If using local Gradle release build:**

```bash
keytool -list -v \
  -keystore /path/to/release.keystore \
  -alias your-alias \
  -storepass your-store-password \
  | grep SHA1
```

- [ ] **Step 6.2: Register production SHA-1 in Google Cloud Console**

1. Go to the Android OAuth credential from Task 5 Step 5.1
2. Add the production SHA-1 as a second entry alongside the debug SHA-1
3. Save

> Both debug and production SHA-1s must be registered simultaneously. Removing the debug SHA-1 will break development builds.

- [ ] **Step 6.3: Build a release APK and test**

```bash
# Local release build — no EAS quota used
cd android && ./gradlew assembleRelease
```

Install the APK on a physical Android device. Attempt Google sign-in. Confirm it reaches the consent screen and returns successfully. Check Supabase → Authentication → Users for the new entry.

- [ ] **Step 6.4: Confirm production sign-in gets invite_validated**

After sign-in, check the user's `app_metadata` in Supabase:

```sql
select id, email, raw_app_meta_data
from auth.users
where email = '<your-test-email>'
order by created_at desc
limit 1;
```

`raw_app_meta_data` must include `"invite_validated": true` after a successful invite flow.

---

## Task 7: AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`

- [ ] **Step 7.1: Write AuthContext**

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  isValidated: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isValidated: false,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const user = session?.user ?? null
  // invite_validated lives in app_metadata — only service role can set it
  const isValidated = user?.app_metadata?.invite_validated === true

  return (
    <AuthContext.Provider value={{ session, user, isValidated, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 7.2: Wrap App.tsx**

In `App.tsx`, add the import at the top and wrap the outermost element:

```typescript
// Add import
import { AuthProvider } from './src/context/AuthContext'

// Wrap everything in AuthProvider — place it outside LanguageProvider
// so auth state is available to any screen including onboarding
return (
  <AuthProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <SafeAreaProvider>
          <TabBarProvider>
            <NavigationContainer ref={navigationRef} linking={linking} onReady={...} onStateChange={...}>
              <InnerLayout ... />
            </NavigationContainer>
          </TabBarProvider>
        </SafeAreaProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  </AuthProvider>
)
```

- [ ] **Step 7.3: Commit**

```bash
git add src/context/AuthContext.tsx App.tsx
git commit -m "feat(auth): add AuthContext with isValidated flag and signOut"
```

---

## Task 8: LoginScreen + InviteCodeInput

**Files:**
- Create: `src/screens/LoginScreen.tsx`
- Create: `src/components/InviteCodeInput.tsx`

- [ ] **Step 8.1: Install required packages**

```bash
npx expo install expo-auth-session expo-web-browser
```

- [ ] **Step 8.2: Write InviteCodeInput**

```typescript
// src/components/InviteCodeInput.tsx
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native'

type Props = {
  value: string
  onChange: (v: string) => void
  error: string | null
  validating: boolean
}

export function InviteCodeInput({ value, onChange, error, validating }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="Paste invite code"
        placeholderTextColor="#C4A882"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {validating && (
        <ActivityIndicator size="small" color="#E8521A" style={styles.spinner} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0D0B8',
    backgroundColor: '#F2E9D8',
    paddingHorizontal: 20,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#1C0A00',
  },
  inputError: { borderColor: '#C0392B' },
  spinner: { position: 'absolute', right: 16, top: 14 },
  error: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#C0392B',
    paddingHorizontal: 4,
  },
})
```

- [ ] **Step 8.3: Write LoginScreen**

```typescript
// src/screens/LoginScreen.tsx
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import React, { useState } from 'react'
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { InviteCodeInput } from '../components/InviteCodeInput'

WebBrowser.maybeCompleteAuthSession()

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Invite code not found.',
  already_used: 'This invite code has already been used.',
  expired: 'This invite code has expired.',
  invalid_format: 'Invalid code format — paste the full code you received.',
  missing_code: 'Please enter your invite code.',
  race_condition: 'This code was just used by someone else.',
}

export function LoginScreen() {
  const [inviteCode, setInviteCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'recipecards' })

  const handleSignIn = async () => {
    setInviteError(null)
    const trimmedCode = inviteCode.trim()

    if (!trimmedCode) {
      setInviteError('Please enter your invite code before signing in.')
      return
    }

    // Step 1: Validate invite code server-side BEFORE opening Google OAuth.
    // This is a UX pre-check only — the real enforcement is in consume-invite.
    setValidating(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ code: trimmedCode }),
      })
      const json = await res.json()
      if (!json.valid) {
        setInviteError(ERROR_MESSAGES[json.error] ?? 'Invalid invite code.')
        return
      }
    } catch {
      setInviteError('Could not validate invite code. Check your connection and try again.')
      return
    } finally {
      setValidating(false)
    }

    // Step 2: Open Google OAuth
    setSigningIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      })

      if (error || !data.url) {
        Alert.alert('Sign-in error', error?.message ?? 'Could not start sign-in.')
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri)
      if (result.type !== 'success') return

      // Extract tokens from the callback URL fragment
      const fragment = result.url.split('#')[1] ?? result.url.split('?')[1] ?? ''
      const params = new URLSearchParams(fragment)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        Alert.alert('Sign-in error', 'Could not retrieve session. Please try again.')
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (sessionError) {
        Alert.alert('Sign-in error', sessionError.message)
        return
      }

      // Step 3: Consume the invite server-side.
      // This sets invite_validated = true in app_metadata via service role.
      // If this fails, sign the user out immediately — they have no data access anyway,
      // but a clean sign-out gives a clear error state to retry from.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Sign-in error', 'Session not found after authentication.')
        await supabase.auth.signOut()
        return
      }

      const consumeRes = await fetch(`${SUPABASE_URL}/functions/v1/consume-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: trimmedCode }),
      })
      const consumeJson = await consumeRes.json()

      if (!consumeJson.success && !consumeJson.alreadyValidated) {
        await supabase.auth.signOut()
        setInviteError(
          ERROR_MESSAGES[consumeJson.error] ??
          'Invite validation failed. Contact the person who invited you.',
        )
        return
      }

      // Force session refresh so app_metadata.invite_validated is reflected immediately
      await supabase.auth.refreshSession()
      // AuthContext picks up the updated session via onAuthStateChange — no navigation needed
    } catch {
      Alert.alert('Sign-in error', 'Something went wrong. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>RecipeCards</Text>
        <Text style={styles.subtitle}>You need an invite to join.</Text>

        <InviteCodeInput
          value={inviteCode}
          onChange={(v) => { setInviteCode(v); setInviteError(null) }}
          error={inviteError}
          validating={validating}
        />

        <TouchableOpacity
          style={[styles.btn, (signingIn || validating) && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={signingIn || validating}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This is an invite-only app. If you don't have a code, ask a current member.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF5EE' },
  container: { flex: 1, padding: 32, justifyContent: 'center', gap: 16 },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#1C0A00',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#8B6444',
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: '#E8521A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  disclaimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#C4A882',
    textAlign: 'center',
    marginTop: 8,
  },
})
```

- [ ] **Step 8.4: Commit**

```bash
git add src/screens/LoginScreen.tsx src/components/InviteCodeInput.tsx
git commit -m "feat(auth): add LoginScreen and InviteCodeInput with invite validation flow"
```

---

## Task 9: Navigation Gating

Render `LoginScreen` when there is no authenticated + validated session.

**Files:**
- Modify: `App.tsx`
- Modify: `src/types/navigation.ts`

- [ ] **Step 9.1: Add Login to navigation types**

In `src/types/navigation.ts`, add to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  Login: undefined;    // <-- add this
  Onboarding: undefined;
  _tabs: undefined;
  Form: { recipe?: RecipeData };
  Preview: { recipe: RecipeData; celebrate?: boolean };
  CardView: { cardId: string; recipes?: RecipeData[] };
  Receive: { cardId: string };
  Deck: { recipes: RecipeData[]; startCardId?: string };
};
```

- [ ] **Step 9.2: Gate the navigator in App.tsx**

In `App.tsx`, import `useAuth` and `LoginScreen`. In the `InnerLayout` component (or directly in the navigator), add the auth gate:

```typescript
import { useAuth } from './src/context/AuthContext'
import { LoginScreen } from './src/screens/LoginScreen'

// At the top of InnerLayout (or as a sibling component):
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isValidated, loading } = useAuth()
  if (loading) return null
  if (!session || !isValidated) return <LoginScreen />
  return <>{children}</>
}

// Wrap the Stack.Navigator in InnerLayout:
return (
  <View style={{ flex: 1 }}>
    <AuthGate>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        {/* all existing screens unchanged */}
      </Stack.Navigator>
      {showTabBar && <BottomTabBar ... />}
    </AuthGate>
  </View>
)
```

- [ ] **Step 9.3: Test the gate**

Run the app with no stored session. `LoginScreen` must appear. Sign in with a valid invite code + Google account. Home screen must appear. Go to Profile → sign out. `LoginScreen` must reappear immediately.

- [ ] **Step 9.4: Commit**

```bash
git add App.tsx src/types/navigation.ts
git commit -m "feat(auth): gate navigation on session + invite_validated, show LoginScreen otherwise"
```

---

## Task 10: Invite Generation UI in ProfileScreen

**Files:**
- Create: `src/components/InviteShareCard.tsx`
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 10.1: Write InviteShareCard — the leakage warning is mandatory**

```typescript
// src/components/InviteShareCard.tsx
import React from 'react'
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// This warning must appear every time an invite code is shown. Non-negotiable.
const LEAKAGE_WARNING =
  "This code is single-use and tied to your account. Sharing it with someone who should not have access is a violation of this app's terms and can be traced back to you."

type Props = {
  code: string
  expiresAt: string
  onDismiss: () => void
}

export function InviteShareCard({ code, expiresAt, onDismiss }: Props) {
  const expiry = new Date(expiresAt).toLocaleDateString()

  const handleShare = () => {
    Share.share({
      title: 'RecipeCards Invite',
      message:
        `You're invited to RecipeCards!\n\nInvite code: ${code}\n\nValid until ${expiry}. One-time use only.\n\n⚠️ ${LEAKAGE_WARNING}`,
    })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your Invite Code</Text>
      <Text style={styles.code} selectable>{code}</Text>
      <Text style={styles.expiry}>Expires {expiry} · Single use · Traceable to you</Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Important</Text>
        <Text style={styles.warningBody}>{LEAKAGE_WARNING}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
        <Text style={styles.shareBtnText}>Share Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissText}>Done</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F5F2',
    borderRadius: 24,
    padding: 32,
    gap: 12,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#8B6444',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1C0A00',
    letterSpacing: 1,
  },
  expiry: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#C4A882',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0C040',
  },
  warningTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#856404',
  },
  warningBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  shareBtn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: '#E8521A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  shareBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  dismissBtn: { alignItems: 'center', paddingVertical: 16 },
  dismissText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#C4A882' },
})
```

- [ ] **Step 10.2: Add invite generation and sign-out to ProfileScreen**

Open `src/screens/ProfileScreen.tsx`. Add these imports and state:

```typescript
import { useAuth } from '../context/AuthContext'
import { InviteShareCard } from '../components/InviteShareCard'

// Inside the component:
const { session, signOut } = useAuth()
const [inviteData, setInviteData] = useState<{ code: string; expiresAt: string } | null>(null)
const [generatingInvite, setGeneratingInvite] = useState(false)

const handleGenerateInvite = async () => {
  if (!session) return
  setGeneratingInvite(true)
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    const json = await res.json()
    if (json.error === 'limit_reached') {
      Alert.alert(
        'Invite limit reached',
        `You already have ${json.limit} active invites. Wait for them to be used or expire before generating more.`,
      )
      return
    }
    if (json.code) {
      setInviteData({ code: json.code, expiresAt: json.expiresAt })
    }
  } catch {
    Alert.alert('Error', 'Could not generate invite. Please try again.')
  } finally {
    setGeneratingInvite(false)
  }
}
```

Add to the JSX in ProfileScreen:

```typescript
// Invite button
<TouchableOpacity onPress={handleGenerateInvite} disabled={generatingInvite}>
  <Text>{generatingInvite ? 'Generating…' : 'Invite someone'}</Text>
</TouchableOpacity>

// Sign out button
<TouchableOpacity onPress={signOut}>
  <Text>Sign out</Text>
</TouchableOpacity>

// InviteShareCard shown in a modal overlay matching the project modal pattern
// (see PublishConfirmModal.tsx for the Animated fade + translateY pattern)
{inviteData && (
  <Modal visible animationType="fade" transparent>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', padding: 16 }}>
      <InviteShareCard
        code={inviteData.code}
        expiresAt={inviteData.expiresAt}
        onDismiss={() => setInviteData(null)}
      />
    </View>
  </Modal>
)}
```

Style the invite and sign-out buttons to match the existing ProfileScreen visual style.

- [ ] **Step 10.3: Commit**

```bash
git add src/components/InviteShareCard.tsx src/screens/ProfileScreen.tsx
git commit -m "feat(auth): add invite generation and sign-out to ProfileScreen with leakage warning"
```

---

## Task 11: Invite System Documentation

**Files:**
- Create: `docs/INVITE_SYSTEM.md`

- [ ] **Step 11.1: Write the documentation**

```markdown
# Invite System — Design, Security, and Risk

## How it works

Access to RecipeCards is restricted to invited users only. The full flow:

1. An existing validated user generates an invite code (UUID v4) via Profile screen
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
```sql
-- In Supabase dashboard: Authentication → Users → find by email → Delete user
-- This revokes their session immediately and removes all auth records
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
```

- [ ] **Step 11.2: Commit**

```bash
git add docs/INVITE_SYSTEM.md
git commit -m "docs: add invite system risk documentation with leakage mitigation and admin runbook"
```

---

## Task 12: Security Compliance Agent Review

Run this after all other tasks are complete, before merging to `develop`.

- [ ] **Step 12.1: Run the security-reviewer agent**

From the Claude Code CLI:

```
/security-review
```

The agent will check:
- RLS policies on all tables for `invite_validated` enforcement
- Edge Functions for correct JWT verification settings
- Client-side code for hardcoded secrets or auth bypass paths
- `app_metadata.invite_validated` is never set from client code
- PKCE is present in the OAuth flow
- Deep link redirect URI handling cannot be hijacked

- [ ] **Step 12.2: Resolve all HIGH and CRITICAL findings**

Do not merge to `develop` until every HIGH and CRITICAL finding is closed. Document any MEDIUM findings with a mitigation plan in a follow-up issue.

- [ ] **Step 12.3: Verify the security checklist**

Open `docs/INVITE_SYSTEM.md` and verify each item in the security requirements checklist (S1–S11) by reading the code or querying Supabase. Every item must be verifiable — no "trust me" items.

- [ ] **Step 12.4: Commit**

```bash
git add -A
git commit -m "chore(security): resolve security review findings before merge to develop"
```

---

## Self-Review

**Spec coverage:**
- ✅ Google OAuth dev setup — Task 5
- ✅ Google OAuth production (Play Store) — Task 6
- ✅ Server-side invite validation — Tasks 2, 3
- ✅ Client invite gate — Tasks 8, 9
- ✅ Invite generation with per-user limit — Task 4
- ✅ Invite leakage warning in every code display — Task 10 (`InviteShareCard`)
- ✅ Invite leakage thoroughly documented — Plan header + Task 11
- ✅ Security risks identified and addressed per requirement — Security Requirements table
- ✅ Security compliance agent check — Task 12
- ✅ Sign-out — Task 10 (ProfileScreen)

**Placeholder scan:** No TBD, no "add appropriate error handling", no "similar to Task N". All code blocks are complete and self-contained.

**Type consistency:** `AuthState` type in `AuthContext.tsx` matches all `useAuth()` call sites in `LoginScreen`, `ProfileScreen`, and `App.tsx`. Edge Function response shapes (`{ valid, error }`, `{ success, error }`, `{ code, expiresAt, error }`) match fetch call handling in `LoginScreen` and `ProfileScreen`. `InviteShareCard` props (`code`, `expiresAt`, `onDismiss`) match usage in `ProfileScreen`.
```
