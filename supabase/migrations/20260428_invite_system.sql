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

create index invitations_code_idx on public.invitations(code);

alter table public.invitations enable row level security;

create policy "owner reads own invites"
  on public.invitations for select
  using (created_by = auth.uid());

-- Add user_id to recipes so ownership can be enforced in RLS.
-- Nullable so existing rows (created before auth was wired up) are unaffected.
alter table public.recipes
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Gate the recipes table on invite_validated
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
