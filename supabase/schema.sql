-- ==============================================================================
-- INFOMORPH — SUPABASE DATABASE SCHEMA
-- "One Source. Infinite Forms."
-- Multi-modal Content Transformation & Grounding Verification Platform
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. USER PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  primary_source text,
  outputs_count integer default 0,
  quality_score numeric default 98.0,
  status text default 'Draft' check (status in ('Completed', 'In Progress', 'Draft')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SOURCES TABLE (Uploaded files, raw text, scraped URLs)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'csv', 'txt', 'url')),
  size text,
  pages text,
  is_primary boolean default false,
  raw_text text not null,
  file_url text,
  spans jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SOURCE OF TRUTH (Extracted facts, critical metrics, and entity graph)
create table if not exists public.source_of_truth (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  summary text,
  core_facts jsonb default '[]'::jsonb,
  entities jsonb default '[]'::jsonb,
  critical_metrics jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. OUTPUTS TABLE (Generated multi-channel communications)
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  output_type text not null check (output_type in ('instagram', 'youtube', 'linkedin', 'blog', 'whatsapp', 'twitter')),
  title text not null,
  subtitle text,
  content text not null,
  quality_score numeric default 98.0,
  character_count integer default 0,
  grounded_percent numeric default 100.0,
  status text default 'ready' check (status in ('ready', 'published', 'draft', 'under_review')),
  published_at timestamp with time zone,
  hashtags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. CLAIMS TABLE (Grounded claims & cross-channel contradiction verification)
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  output_id uuid references public.outputs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  claim_text text not null,
  source_span_ids text[] default '{}',
  source_span text,
  grounded boolean default true,
  contradiction_flag boolean default false,
  contradiction_details text,
  contradicting_output_id uuid references public.outputs(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AUDIT LOGS TABLE (Traceable system history & audit trail)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  category text not null check (category in ('ingestion', 'understanding', 'generation', 'verification', 'review', 'publish')),
  action text not null,
  details text not null,
  status text default 'info' check (status in ('info', 'success', 'warning', 'error')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sources enable row level security;
alter table public.source_of_truth enable row level security;
alter table public.outputs enable row level security;
alter table public.claims enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES: Users can view and edit only their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Helper policy for demo mode or authenticated users:
-- Allow authenticated users full CRUD on their own records
-- (Fallback: allows public read/write if auth is disabled for zero-friction hackathon demos)

create policy "Users can manage their own projects" on public.projects
  for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage their own sources" on public.sources
  for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage their own source_of_truth" on public.source_of_truth
  for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage their own outputs" on public.outputs
  for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can manage their own claims" on public.claims
  for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can view their audit logs" on public.audit_logs
  for all using (auth.uid() = user_id or auth.uid() is null);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
