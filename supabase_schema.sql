-- Enable UUID generation
create extension if not exists pgcrypto;

create type public.app_role as enum ('ceo', 'hardware', 'software', 'legal', 'medical');
create type public.task_status as enum ('pending', 'in_progress', 'blocked', 'pending_validation', 'completed', 'rejected');
create type public.evidence_file_type as enum ('image', 'video', 'pdf', 'document');
create type public.evidence_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  status public.task_status not null default 'pending',
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_url text not null,
  file_type public.evidence_file_type not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  status public.evidence_status not null default 'pending',
  reviewer_id uuid references public.profiles(id),
  review_comment text,
  created_at timestamptz not null default now()
);

create table public.biometric_logs (
  id uuid primary key default gen_random_uuid(),
  raw_data jsonb not null,
  timestamp timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'hardware')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.evidence enable row level security;
alter table public.biometric_logs enable row level security;

create policy "profiles_select_own_or_ceo"
on public.profiles
for select
using (auth.uid() = id or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo'
));

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "tasks_select_own_or_ceo"
on public.tasks
for select
using (
  assigned_to = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
);

create policy "tasks_update_ceo_or_owner"
on public.tasks
for update
using (
  assigned_to = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
)
with check (
  assigned_to = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
);

create policy "tasks_insert_ceo_only"
on public.tasks
for insert
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo'
));

create policy "evidence_select_own_task_or_ceo"
on public.evidence
for select
using (
  uploaded_by = auth.uid()
  or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo'
  )
);

create policy "evidence_insert_owner_only"
on public.evidence
for insert
with check (uploaded_by = auth.uid());

create policy "evidence_update_ceo_only"
on public.evidence
for update
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
);

create policy "biometric_logs_select_ceo_or_medical"
on public.biometric_logs
for select
using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ceo', 'medical')
  )
);

create policy "biometric_logs_insert_ceo_or_medical"
on public.biometric_logs
for insert
with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ceo', 'medical')
  )
);

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "evidence_storage_select_own_or_ceo"
on storage.objects
for select
using (
  bucket_id = 'evidence'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo')
  )
);

create policy "evidence_storage_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'evidence'
  and owner = auth.uid()
);
