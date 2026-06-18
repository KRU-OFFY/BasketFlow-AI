-- AI Product Review Video Bot Supabase schema
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'creator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  shopee_affiliate_link text not null,
  product_image_url text,
  price numeric(12,2),
  commission_rate numeric(5,2),
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.project_status as enum ('draft','product_imported','brief_generated','script_generated','compliance_checked','warning','blocked','media_generated','pending_approval','approved','ready_to_publish','published','rejected');
create type public.compliance_status as enum ('PASS','WARNING','BLOCK');
create type public.approval_status as enum ('pending','approved','rejected');
create type public.queue_status as enum ('ready','scheduled','published','failed','cancelled');
create type public.ai_log_status as enum ('success','fallback','error');

create table if not exists public.review_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  status public.project_status not null default 'product_imported',
  compliance_status public.compliance_status,
  approval_status public.approval_status default 'pending',
  has_affiliate_disclosure boolean not null default false,
  has_ai_content_label boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  product_summary text not null,
  target_audience text not null,
  pain_points jsonb not null default '[]',
  key_benefits jsonb not null default '[]',
  usp text not null,
  content_angles jsonb not null default '[]',
  hook_ideas jsonb not null default '[]',
  risk_level text not null default 'LOW',
  creator_note text,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  duration_seconds int not null,
  hook text not null,
  problem text,
  product_intro text,
  benefits text,
  use_case text,
  cta text,
  affiliate_disclosure text not null,
  full_script text not null,
  subtitle_lines jsonb not null default '[]',
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status public.compliance_status not null,
  risk_score int not null default 0,
  issues jsonb not null default '[]',
  prohibited_words jsonb not null default '[]',
  missing_requirements jsonb not null default '[]',
  suggested_fixes jsonb not null default '[]',
  safe_rewrite text,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  asset_type text not null,
  storage_path text,
  provider text not null default 'mock',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status public.approval_status not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posting_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status public.queue_status not null default 'ready',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.review_projects(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task_type text not null,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  input_payload jsonb not null default '{}',
  output_payload jsonb,
  error_message text,
  latency_ms int,
  status public.ai_log_status not null,
  created_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger review_projects_updated_at before update on public.review_projects for each row execute function public.set_updated_at();
create trigger ai_briefs_updated_at before update on public.ai_briefs for each row execute function public.set_updated_at();
create trigger scripts_updated_at before update on public.scripts for each row execute function public.set_updated_at();
create trigger compliance_checks_updated_at before update on public.compliance_checks for each row execute function public.set_updated_at();
create trigger media_assets_updated_at before update on public.media_assets for each row execute function public.set_updated_at();
create trigger approvals_updated_at before update on public.approvals for each row execute function public.set_updated_at();
create trigger posting_queue_updated_at before update on public.posting_queue for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.review_projects enable row level security;
alter table public.ai_briefs enable row level security;
alter table public.scripts enable row level security;
alter table public.compliance_checks enable row level security;
alter table public.media_assets enable row level security;
alter table public.approvals enable row level security;
alter table public.posting_queue enable row level security;
alter table public.analytics_events enable row level security;
alter table public.ai_logs enable row level security;

create policy "profiles owner access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "products owner access" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects owner access" on public.review_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "briefs owner access" on public.ai_briefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scripts owner access" on public.scripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checks owner access" on public.compliance_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "media owner access" on public.media_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "approvals owner access" on public.approvals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "queue owner access" on public.posting_queue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "analytics owner access" on public.analytics_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai logs owner access" on public.ai_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
