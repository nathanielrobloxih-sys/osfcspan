-- ============================================================
--  OSFUSA C-SPAN — Supabase schema
--  Run this in Supabase SQL Editor for your new osfcspan project
-- ============================================================

-- 1. Posts (Newsletters / Breaking News / Foreign-Intl)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('newsletter', 'breaking', 'foreign')),
  title text not null,
  body text not null,
  image_url text,
  source text default 'web',        -- 'web' or 'discord'
  pinned boolean default false,
  created_at timestamptz default now()
);

-- 2. Settings (key/value store — livestream url/status, app_status, discord invite, etc.)
create table if not exists settings (
  key text primary key,
  value text
);

insert into settings (key, value) values
  ('app_status', 'open'),
  ('app_closed_message', 'Applications are currently closed. Check back soon.'),
  ('livestream_embed_url', ''),
  ('livestream_status', 'offline'),
  ('discord_invite', '')
on conflict (key) do nothing;

-- 3. Applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  roblox_username text not null,
  discord_username text not null,
  roblox_profile_link text,
  timezone text,
  has_mic text,
  position text,
  broadcast_experience text,
  strength_weakness text,
  why_hire text,
  ack_no_contact text,
  ack_denied_anytime text,
  ack_no_reason text,
  status text default 'Submitted',
  notes text,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Admin users (same pattern as the DOS/USMC sites)
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text default 'User'
);

-- ============================================================
--  Row Level Security
--  Public can read posts/settings and submit applications.
--  Writes to posts/settings/applications-status should go through
--  the admin panel (anon key) or the Discord bot (service role key).
--  Since the admin panel itself uses the anon key + a client-side
--  password gate (same as your other OSFUSA sites), these tables
--  stay open to the anon key like the DOS project did.
-- ============================================================

alter table posts enable row level security;
alter table settings enable row level security;
alter table applications enable row level security;
alter table admin_users enable row level security;

create policy "public read posts" on posts for select using (true);
create policy "public write posts" on posts for insert with check (true);
create policy "public update posts" on posts for update using (true);
create policy "public delete posts" on posts for delete using (true);

create policy "public read settings" on settings for select using (true);
create policy "public write settings" on settings for all using (true) with check (true);

create policy "public insert applications" on applications for insert with check (true);
create policy "public read applications" on applications for select using (true);
create policy "public update applications" on applications for update using (true);

create policy "public read admin_users for login" on admin_users for select using (true);

-- ============================================================
--  NOTE: create your first admin login manually, e.g.:
--  (replace the password before running — this is SHA-256 of "changeme123")
-- ============================================================
-- insert into admin_users (email, password_hash, role)
-- values ('admin', '<sha256 hash of your password>', 'Owner');
