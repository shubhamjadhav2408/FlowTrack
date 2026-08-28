-- ============================================================
--  FlowTrack — Supabase Schema
--  Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (one per auth.users row)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  currency      text    not null default 'USD',
  monthly_budget numeric(12,2) default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. CATEGORIES  (system defaults + user-custom)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid default auth.uid() references public.profiles(id) on delete cascade,
  -- user_id NULL = system category visible to all users
  name       text not null,
  emoji      text not null default '💰',
  color      text not null default '#6366f1',
  type       text not null check (type in ('income','expense','both')) default 'expense',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users see system and own categories"
  on public.categories for select
  using (user_id is null or user_id = auth.uid());

create policy "Users insert own categories"
  on public.categories for insert
  with check (user_id = auth.uid());

create policy "Users update own categories"
  on public.categories for update
  using (user_id = auth.uid());

create policy "Users delete own categories"
  on public.categories for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. TRANSACTIONS  (core ledger)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  type            text not null check (type in ('income','expense')),
  amount          numeric(12,2) not null check (amount > 0),
  note            text,
  date            date not null default current_date,
  is_recurring    boolean not null default false,
  recurring_id    uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_type_idx on public.transactions(user_id, type);
create index if not exists transactions_category_idx  on public.transactions(category_id);

alter table public.transactions enable row level security;

create policy "Users CRUD own transactions"
  on public.transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. BUDGETS  (monthly per category)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month       date not null,   -- always first day: e.g. 2025-08-01
  amount      numeric(12,2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table public.budgets enable row level security;

create policy "Users CRUD own budgets"
  on public.budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 5. RECURRING RULES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.recurring_rules (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  type         text not null check (type in ('income','expense')),
  amount       numeric(12,2) not null check (amount > 0),
  note         text,
  frequency    text not null check (frequency in ('daily','weekly','monthly','yearly')),
  start_date   date not null default current_date,
  end_date     date,
  last_run     date,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.recurring_rules enable row level security;

create policy "Users CRUD own recurring rules"
  on public.recurring_rules for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 6. HELPER VIEWS
-- ─────────────────────────────────────────────────────────────

-- Monthly summary (income, expense, net) per user
create or replace view public.monthly_summary with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.date)::date as month,
  sum(case when t.type = 'income'  then t.amount else 0 end) as total_income,
  sum(case when t.type = 'expense' then t.amount else 0 end) as total_expense,
  sum(case when t.type = 'income'  then t.amount else -t.amount end) as net
from public.transactions t
group by t.user_id, date_trunc('month', t.date);

-- Category spending for current month
create or replace view public.category_spending_current_month with (security_invoker = true) as
select
  t.user_id,
  t.category_id,
  c.name      as category_name,
  c.emoji     as category_emoji,
  c.color     as category_color,
  sum(t.amount) as total_spent
from public.transactions t
join public.categories c on c.id = t.category_id
where
  t.type = 'expense'
  and date_trunc('month', t.date) = date_trunc('month', current_date)
group by t.user_id, t.category_id, c.name, c.emoji, c.color;

-- ─────────────────────────────────────────────────────────────
-- 7. SEED — Default system categories  (user_id = NULL)
-- ─────────────────────────────────────────────────────────────
insert into public.categories (id, user_id, name, emoji, color, type, sort_order) values
  ('00000000-0000-0000-0000-000000000001', null, 'Salary',        '💼', '#22c55e', 'income',  1),
  ('00000000-0000-0000-0000-000000000002', null, 'Freelance',     '🖥️', '#10b981', 'income',  2),
  ('00000000-0000-0000-0000-000000000003', null, 'Investments',   '📈', '#06b6d4', 'income',  3),
  ('00000000-0000-0000-0000-000000000004', null, 'Gift',          '🎁', '#a78bfa', 'income',  4),
  ('00000000-0000-0000-0000-000000000005', null, 'Other Income',  '💰', '#f59e0b', 'income',  5),
  ('00000000-0000-0000-0000-000000000010', null, 'Food & Dining', '🍔', '#f97316', 'expense', 10),
  ('00000000-0000-0000-0000-000000000011', null, 'Groceries',     '🛒', '#84cc16', 'expense', 11),
  ('00000000-0000-0000-0000-000000000012', null, 'Transport',     '🚗', '#3b82f6', 'expense', 12),
  ('00000000-0000-0000-0000-000000000013', null, 'Housing',       '🏠', '#8b5cf6', 'expense', 13),
  ('00000000-0000-0000-0000-000000000014', null, 'Utilities',     '💡', '#eab308', 'expense', 14),
  ('00000000-0000-0000-0000-000000000015', null, 'Healthcare',    '❤️', '#ef4444', 'expense', 15),
  ('00000000-0000-0000-0000-000000000016', null, 'Shopping',      '🛍️', '#ec4899', 'expense', 16),
  ('00000000-0000-0000-0000-000000000017', null, 'Entertainment', '🎬', '#f43f5e', 'expense', 17),
  ('00000000-0000-0000-0000-000000000018', null, 'Education',     '📚', '#0ea5e9', 'expense', 18),
  ('00000000-0000-0000-0000-000000000019', null, 'Travel',        '✈️', '#14b8a6', 'expense', 19),
  ('00000000-0000-0000-0000-000000000020', null, 'Fitness',       '🏋️', '#f97316', 'expense', 20),
  ('00000000-0000-0000-0000-000000000021', null, 'Subscriptions', '📱', '#7c3aed', 'expense', 21),
  ('00000000-0000-0000-0000-000000000022', null, 'Pets',          '🐾', '#a16207', 'expense', 22),
  ('00000000-0000-0000-0000-000000000023', null, 'Kids',          '👶', '#fb7185', 'expense', 23),
  ('00000000-0000-0000-0000-000000000024', null, 'Savings',       '🏦', '#2dd4bf', 'expense', 24),
  ('00000000-0000-0000-0000-000000000025', null, 'Other',         '📋', '#94a3b8', 'expense', 25)
on conflict (id) do nothing;
