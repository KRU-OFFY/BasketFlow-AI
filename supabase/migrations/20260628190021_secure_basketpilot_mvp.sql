create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'creator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  affiliate_link text not null,
  image_url text,
  price numeric,
  commission_rate numeric,
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.review_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  status text not null default 'product_imported',
  compliance_status text,
  approval_status text not null default 'pending',
  has_affiliate_disclosure boolean not null default false,
  has_ai_content_label boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  product_summary text,
  target_audience text,
  pain_points jsonb,
  key_benefits jsonb,
  usp text,
  content_angles jsonb,
  hook_ideas jsonb,
  risk_level text,
  creator_note text,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  duration_seconds int not null,
  hook text,
  problem text,
  product_intro text,
  benefits jsonb,
  use_case text,
  cta text,
  affiliate_disclosure text,
  full_script text,
  subtitle_lines jsonb,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status text not null,
  risk_score int not null,
  issues jsonb,
  prohibited_words jsonb,
  missing_requirements jsonb,
  suggested_fixes jsonb,
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
  type text not null,
  provider text not null default 'mock',
  storage_path text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.posting_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  status text not null default 'ready',
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
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.review_projects(id) on delete cascade,
  task_type text not null,
  prompt_version text not null,
  ai_provider text not null,
  ai_model text not null,
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  latency_ms int,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_logs add column if not exists project_id uuid references public.review_projects(id) on delete cascade;
update public.media_assets m set user_id = p.user_id from public.review_projects p where m.project_id = p.id and m.user_id is null;
update public.approvals a set user_id = p.user_id from public.review_projects p where a.project_id = p.id and a.user_id is null;
update public.posting_queue q set user_id = p.user_id from public.review_projects p where q.project_id = p.id and q.user_id is null;

do $$ begin
  if exists(select 1 from public.media_assets where user_id is null)
    or exists(select 1 from public.approvals where user_id is null)
    or exists(select 1 from public.posting_queue where user_id is null) then
    raise exception 'Ownerless workflow rows must be repaired before applying BasketPilot security constraints';
  end if;
end $$;
alter table public.media_assets alter column user_id set not null;
alter table public.approvals alter column user_id set not null;
alter table public.posting_queue alter column user_id set not null;
do $$ begin
  if exists(select 1 from public.ai_logs where user_id is null) then
    raise exception 'Ownerless AI logs must be repaired before applying BasketPilot security constraints';
  end if;
end $$;
alter table public.ai_logs alter column user_id set not null;
alter table public.ai_logs alter column project_id set not null;

create unique index if not exists posting_queue_owner_project_uidx on public.posting_queue(user_id, project_id);
create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists review_projects_user_id_idx on public.review_projects(user_id);
create index if not exists review_projects_product_id_idx on public.review_projects(product_id);
create index if not exists ai_briefs_project_created_idx on public.ai_briefs(project_id, created_at desc);
create index if not exists scripts_project_created_idx on public.scripts(project_id, created_at desc);
create index if not exists compliance_project_created_idx on public.compliance_checks(project_id, created_at desc);
create index if not exists media_assets_project_idx on public.media_assets(project_id);
create index if not exists approvals_project_created_idx on public.approvals(project_id, created_at desc);
create index if not exists ai_logs_user_created_idx on public.ai_logs(user_id, created_at desc);

do $$ begin
  if not exists(select 1 from pg_constraint where conname='review_projects_status_check') then
    alter table public.review_projects add constraint review_projects_status_check check (status in ('draft','product_imported','brief_generated','script_generated','compliance_checked','warning','blocked','media_generated','pending_approval','approved','ready_to_publish','published','rejected'));
  end if;
  if not exists(select 1 from pg_constraint where conname='review_projects_compliance_check') then
    alter table public.review_projects add constraint review_projects_compliance_check check (compliance_status is null or compliance_status in ('PASS','WARNING','BLOCK'));
  end if;
  if not exists(select 1 from pg_constraint where conname='review_projects_approval_check') then
    alter table public.review_projects add constraint review_projects_approval_check check (approval_status in ('pending','approved','rejected'));
  end if;
  if not exists(select 1 from pg_constraint where conname='scripts_duration_check') then
    alter table public.scripts add constraint scripts_duration_check check (duration_seconds in (15,30,60,90));
  end if;
  if not exists(select 1 from pg_constraint where conname='compliance_status_check') then
    alter table public.compliance_checks add constraint compliance_status_check check (status in ('PASS','WARNING','BLOCK') and risk_score between 0 and 100);
  end if;
  if not exists(select 1 from pg_constraint where conname='media_assets_type_check') then
    alter table public.media_assets add constraint media_assets_type_check check (type in ('voiceover','avatar','subtitle','video_preview','rendered_video'));
  end if;
  if not exists(select 1 from pg_constraint where conname='approvals_status_check') then
    alter table public.approvals add constraint approvals_status_check check (status in ('approved','rejected'));
  end if;
  if not exists(select 1 from pg_constraint where conname='posting_queue_status_check') then
    alter table public.posting_queue add constraint posting_queue_status_check check (status in ('ready','scheduled','published','failed','cancelled'));
  end if;
end $$;

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

drop policy if exists "owner profiles" on public.profiles;
create policy "owner profiles" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
do $$ declare t text; begin
  foreach t in array array['products','review_projects','ai_briefs','scripts','compliance_checks','media_assets','approvals','posting_queue','analytics_events','ai_logs'] loop
    execute format('drop policy if exists %I on public.%I', 'owner ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', 'owner ' || t, t);
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;
grant update(full_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.products, public.review_projects, public.ai_briefs, public.scripts, public.compliance_checks, public.media_assets, public.approvals, public.posting_queue, public.analytics_events, public.ai_logs to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at = now(); return new; end;
$$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,email,full_name) values (new.id,new.email,new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$ declare t text; begin
  foreach t in array array['profiles','products','review_projects','ai_briefs','scripts','compliance_checks','media_assets','approvals','posting_queue'] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
  end loop;
end $$;

create or replace function public.queue_project(p_project_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_compliance text;
  v_approval text;
  v_queue_id uuid;
begin
  select * into v_project from public.review_projects where id=p_project_id and user_id=(select auth.uid());
  if not found then raise exception 'Unauthorized or project not found'; end if;
  select status into v_compliance from public.compliance_checks where project_id=p_project_id and user_id=(select auth.uid()) order by created_at desc limit 1;
  select status into v_approval from public.approvals where project_id=p_project_id and user_id=(select auth.uid()) order by created_at desc limit 1;
  if v_compliance is distinct from 'PASS' or v_approval is distinct from 'approved'
    or v_project.compliance_status is distinct from 'PASS' or v_project.approval_status is distinct from 'approved'
    or not v_project.has_affiliate_disclosure or not v_project.has_ai_content_label then
    raise exception 'Project has not passed the Publishing Safety Gate';
  end if;
  insert into public.posting_queue(user_id,project_id,status)
  values ((select auth.uid()),p_project_id,'ready')
  on conflict (user_id,project_id) do update set status='ready',updated_at=now()
  returning id into v_queue_id;
  update public.review_projects set status='ready_to_publish' where id=p_project_id and user_id=(select auth.uid());
  return v_queue_id;
end;
$$;
revoke all on function public.queue_project(uuid) from public, anon;
grant execute on function public.queue_project(uuid) to authenticated;
