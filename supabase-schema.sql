-- Family Kharcha — database setup
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query -> Run).
--
-- IMPORTANT: this version adds real family login, so more than one family
-- can use the same deployment, each seeing only their own data.
-- New family creation is handled by the server-side `family-auth` Edge
-- Function using the Auth Admin API with auto-confirmation. No email is sent.
--
-- Already ran an earlier version of this file and have tables from
-- before? Skip down to the "UPGRADING" block at the very bottom instead
-- of running the CREATE TABLE statements below.

create extension if not exists "uuid-ossp";

create table if not exists family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  emoji text default '🙂',
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  member_name text,
  amount numeric(10,2) not null,
  description text,
  category text not null default 'other',
  emoji text,
  expense_date date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists shopping_list (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_name text not null,
  quantity text,
  estimated_cost numeric(10,2),
  category text default 'other',
  emoji text,
  is_purchased boolean default false,
  added_by text,
  created_at timestamptz default now()
);

create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(10,2) not null,
  created_at timestamptz default now(),
  unique (category, family_id)
);

create table if not exists category_learned (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  keyword text not null,
  category text not null,
  created_at timestamptz default now(),
  unique (keyword, family_id)
);

create table if not exists recurring (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text not null default 'other',
  emoji text,
  member_name text,
  day_of_month integer not null default 1,
  last_logged_month text,
  created_at timestamptz default now()
);

-- Row Level Security: each family can only ever see or change its own
-- rows. This is enforced by the database itself — not just hidden in
-- the app — so it holds even against a direct API request.
alter table family_members enable row level security;
alter table expenses enable row level security;
alter table shopping_list enable row level security;
alter table budgets enable row level security;
alter table category_learned enable row level security;
alter table recurring enable row level security;

drop policy if exists "family owns its family_members" on family_members;
create policy "family owns its family_members" on family_members for all using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "family owns its expenses" on expenses;
create policy "family owns its expenses" on expenses for all using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "family owns its shopping_list" on shopping_list;
create policy "family owns its shopping_list" on shopping_list for all using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "family owns its budgets" on budgets;
create policy "family owns its budgets" on budgets for all using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "family owns its category_learned" on category_learned;
create policy "family owns its category_learned" on category_learned for all using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "family owns its recurring" on recurring;
create policy "family owns its recurring" on recurring for all using (family_id = auth.uid()) with check (family_id = auth.uid());

-- Live sync across everyone's phones. Realtime respects the same RLS
-- rules above, so this still only ever syncs within one family.
alter publication supabase_realtime add table family_members;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table shopping_list;
alter publication supabase_realtime add table budgets;
alter publication supabase_realtime add table category_learned;
alter publication supabase_realtime add table recurring;

-- =================================================================
-- UPGRADING from an earlier version of this app (tables already exist
-- without family_id)? Run this whole block instead of everything above.
-- =================================================================
--
-- -- Step 1: add the column, nullable for now.
-- alter table family_members add column if not exists family_id uuid references auth.users(id) on delete cascade;
-- alter table expenses add column if not exists family_id uuid references auth.users(id) on delete cascade;
-- alter table shopping_list add column if not exists family_id uuid references auth.users(id) on delete cascade;
-- alter table budgets add column if not exists family_id uuid references auth.users(id) on delete cascade;
-- alter table category_learned add column if not exists family_id uuid references auth.users(id) on delete cascade;
-- alter table recurring add column if not exists family_id uuid references auth.users(id) on delete cascade;
--
-- -- Step 2: old rows have no family_id yet. Either clear old test data:
-- --   delete from expenses; delete from shopping_list; delete from family_members;
-- --   delete from budgets; delete from category_learned; delete from recurring;
-- -- ...or sign up your first family in the app, find its id under
-- -- Authentication -> Users in the dashboard, and for each table run:
-- --   update expenses set family_id = 'paste-the-uuid-here' where family_id is null;
--
-- -- Step 3: make it required from now on, defaulting to whoever's logged in.
-- alter table family_members alter column family_id set default auth.uid(), alter column family_id set not null;
-- alter table expenses alter column family_id set default auth.uid(), alter column family_id set not null;
-- alter table shopping_list alter column family_id set default auth.uid(), alter column family_id set not null;
-- alter table budgets alter column family_id set default auth.uid(), alter column family_id set not null;
-- alter table category_learned alter column family_id set default auth.uid(), alter column family_id set not null;
-- alter table recurring alter column family_id set default auth.uid(), alter column family_id set not null;
--
-- -- Step 4: budgets/category_learned were unique per category/keyword
-- -- alone before; now they need to be unique per family instead.
-- alter table budgets drop constraint if exists budgets_category_key;
-- alter table budgets add constraint budgets_category_family_unique unique (category, family_id);
-- alter table category_learned drop constraint if exists category_learned_keyword_key;
-- alter table category_learned add constraint category_learned_keyword_family_unique unique (keyword, family_id);
--
-- -- Step 5: now run the "enable row level security" and every
-- -- "create policy" statement above as-is — they're safe to re-run.
-- -- Also run the "alter publication" lines above if you haven't already.
--
-- -- The old app_settings table (the previous shared PIN) is no longer
-- -- used — the PIN now lives on each device instead. You can leave it
-- -- alone or drop it; the app never reads it anymore.
