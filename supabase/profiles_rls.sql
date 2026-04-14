-- Profiles table RLS hardening for Bayes CRM
-- Run this in Supabase SQL editor after Prisma migration.

alter table if exists public.profiles enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own"
  on public.profiles
  for select
  using (auth.uid() = auth_user_id);

drop policy if exists "profile_update_own_limited" on public.profiles;
create policy "profile_update_own_limited"
  on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Admin management is done via server routes using service role key.
