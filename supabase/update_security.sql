-- ============================================================
--  FlowTrack — Security Update Script
--  Run this in the Supabase SQL Editor to apply security fixes
--  to your EXISTING database without recreating tables.
-- ============================================================

-- 1. Secure existing views to enforce Row Level Security
create or replace view public.monthly_summary with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.date)::date as month,
  sum(case when t.type = 'income'  then t.amount else 0 end) as total_income,
  sum(case when t.type = 'expense' then t.amount else 0 end) as total_expense,
  sum(case when t.type = 'income'  then t.amount else -t.amount end) as net
from public.transactions t
group by t.user_id, date_trunc('month', t.date);

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

-- 2. Hard-wire table defaults to the authenticated user's ID
alter table public.categories alter column user_id set default auth.uid();
alter table public.transactions alter column user_id set default auth.uid();
alter table public.budgets alter column user_id set default auth.uid();
alter table public.recurring_rules alter column user_id set default auth.uid();
