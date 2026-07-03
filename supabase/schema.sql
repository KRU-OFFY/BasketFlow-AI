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

do $$ begin
  if exists (
    select 1 from public.review_projects p
    join public.products product on product.id = p.product_id
    where p.user_id <> product.user_id
  ) or exists (
    select 1 from public.ai_briefs child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.scripts child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.compliance_checks child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.media_assets child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.approvals child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.posting_queue child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) or exists (
    select 1 from public.ai_logs child
    join public.review_projects project on project.id = child.project_id
    where child.user_id <> project.user_id
  ) then
    raise exception 'Cross-owner workflow rows must be repaired before applying BasketPilot ownership constraints';
  end if;
end $$;

create unique index if not exists products_id_user_uidx on public.products(id, user_id);
create unique index if not exists review_projects_id_user_uidx on public.review_projects(id, user_id);
do $$ begin
  if not exists(select 1 from pg_constraint where conname='review_projects_product_owner_fkey') then
    alter table public.review_projects add constraint review_projects_product_owner_fkey foreign key(product_id,user_id) references public.products(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='ai_briefs_project_owner_fkey') then
    alter table public.ai_briefs add constraint ai_briefs_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='scripts_project_owner_fkey') then
    alter table public.scripts add constraint scripts_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='compliance_project_owner_fkey') then
    alter table public.compliance_checks add constraint compliance_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='media_assets_project_owner_fkey') then
    alter table public.media_assets add constraint media_assets_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='approvals_project_owner_fkey') then
    alter table public.approvals add constraint approvals_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='posting_queue_project_owner_fkey') then
    alter table public.posting_queue add constraint posting_queue_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='ai_logs_project_owner_fkey') then
    alter table public.ai_logs add constraint ai_logs_project_owner_fkey foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
end $$;

create unique index if not exists posting_queue_owner_project_uidx on public.posting_queue(user_id, project_id);
create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists review_projects_user_id_idx on public.review_projects(user_id);
create index if not exists review_projects_product_id_idx on public.review_projects(product_id);
create index if not exists ai_briefs_user_id_idx on public.ai_briefs(user_id);
create index if not exists ai_briefs_project_created_idx on public.ai_briefs(project_id, created_at desc);
create index if not exists scripts_user_id_idx on public.scripts(user_id);
create index if not exists scripts_project_created_idx on public.scripts(project_id, created_at desc);
create index if not exists compliance_checks_user_id_idx on public.compliance_checks(user_id);
create index if not exists compliance_project_created_idx on public.compliance_checks(project_id, created_at desc);
create index if not exists media_assets_user_id_idx on public.media_assets(user_id);
create index if not exists media_assets_project_idx on public.media_assets(project_id);
create index if not exists approvals_user_id_idx on public.approvals(user_id);
create index if not exists approvals_project_created_idx on public.approvals(project_id, created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
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

create or replace function public.enforce_posting_safety_gate() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_compliance text;
  v_approval text;
begin
  if new.user_id is distinct from (select auth.uid()) then
    raise exception 'Unauthorized queue owner';
  end if;
  select * into v_project
  from public.review_projects
  where id = new.project_id and user_id = new.user_id;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  select status into v_compliance
  from public.compliance_checks
  where project_id = new.project_id and user_id = new.user_id
  order by created_at desc, id desc limit 1;
  select status into v_approval
  from public.approvals
  where project_id = new.project_id and user_id = new.user_id
  order by created_at desc, id desc limit 1;
  if v_compliance is distinct from 'PASS' or v_approval is distinct from 'approved'
    or v_project.compliance_status is distinct from 'PASS'
    or v_project.approval_status is distinct from 'approved'
    or not v_project.has_affiliate_disclosure
    or not v_project.has_ai_content_label then
    raise exception 'Project has not passed the Publishing Safety Gate';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_posting_safety_gate() from public, anon, authenticated;
drop trigger if exists enforce_posting_safety_gate on public.posting_queue;
create trigger enforce_posting_safety_gate
before insert or update on public.posting_queue
for each row execute function public.enforce_posting_safety_gate();

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
  select status into v_compliance from public.compliance_checks where project_id=p_project_id and user_id=(select auth.uid()) order by created_at desc, id desc limit 1;
  select status into v_approval from public.approvals where project_id=p_project_id and user_id=(select auth.uid()) order by created_at desc, id desc limit 1;
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

-- Security and data-integrity hardening. Keep synchronized with
-- supabase/migrations/20260702083000_harden_workflow_mutations.sql.
alter table public.review_projects
  add column if not exists archived_at timestamptz,
  add column if not exists media_revision integer not null default 0;

alter table public.products
  add column if not exists source text not null default 'manual',
  add column if not exists product_url text,
  add column if not exists affiliate_validation_status text not null default 'validated';

alter table public.ai_briefs
  add column if not exists superseded_at timestamptz;
alter table public.scripts
  add column if not exists superseded_at timestamptz;
alter table public.compliance_checks
  add column if not exists superseded_at timestamptz,
  add column if not exists phase text not null default 'preliminary',
  add column if not exists script_id uuid references public.scripts(id) on delete restrict,
  add column if not exists media_revision integer not null default 0;

alter table public.approvals
  add column if not exists script_id uuid references public.scripts(id) on delete restrict,
  add column if not exists compliance_check_id uuid references public.compliance_checks(id) on delete restrict,
  add column if not exists media_revision integer;

alter table public.media_assets
  add column if not exists media_revision integer not null default 0;

alter table public.posting_queue
  add column if not exists script_id uuid references public.scripts(id) on delete restrict,
  add column if not exists compliance_check_id uuid references public.compliance_checks(id) on delete restrict,
  add column if not exists approval_id uuid references public.approvals(id) on delete restrict,
  add column if not exists media_revision integer;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='products_source_check') then
    alter table public.products add constraint products_source_check
      check (source in ('manual','mock','shopee_api'));
  end if;
  if not exists(select 1 from pg_constraint where conname='products_affiliate_validation_check') then
    alter table public.products add constraint products_affiliate_validation_check
      check (affiliate_validation_status in ('pending','validated','rejected'));
  end if;
  if not exists(select 1 from pg_constraint where conname='review_projects_media_revision_check') then
    alter table public.review_projects add constraint review_projects_media_revision_check
      check (media_revision >= 0);
  end if;
  if not exists(select 1 from pg_constraint where conname='compliance_checks_phase_check') then
    alter table public.compliance_checks add constraint compliance_checks_phase_check
      check (phase in ('preliminary','final'));
  end if;
  if not exists(select 1 from pg_constraint where conname='compliance_checks_media_revision_check') then
    alter table public.compliance_checks add constraint compliance_checks_media_revision_check
      check (media_revision >= 0);
  end if;
  if not exists(select 1 from pg_constraint where conname='media_assets_media_revision_check') then
    alter table public.media_assets add constraint media_assets_media_revision_check
      check (media_revision >= 0);
  end if;
end $$;

-- Product/workflow UX additions. Keep synchronized with
-- supabase/migrations/20260703120000_product_workflow_ux.sql.
alter table public.scripts
  add column if not exists hook_candidates jsonb not null default '[]'::jsonb,
  add column if not exists selected_hook text;
update public.scripts set selected_hook=hook where selected_hook is null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='scripts_hook_candidates_array_check') then
    alter table public.scripts add constraint scripts_hook_candidates_array_check
      check (jsonb_typeof(hook_candidates)='array');
  end if;
end $$;

create table if not exists public.workflow_action_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.review_projects(id) on delete cascade,
  action_type text not null,
  status text not null default 'pending',
  result_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_action_requests_status_check
    check (status in ('pending', 'succeeded', 'failed')),
  constraint workflow_action_requests_action_check
    check (action_type in (
      'create_project','generate_brief','generate_script',
      'run_preliminary_compliance','run_final_compliance',
      'create_media','update_ai_label','approve_project','reject_project',
      'archive_project','queue_project'
    ))
);

do $$ begin
  if not exists(select 1 from pg_constraint where conname='workflow_action_requests_project_owner_fkey') then
    alter table public.workflow_action_requests add constraint workflow_action_requests_project_owner_fkey
      foreign key(project_id,user_id) references public.review_projects(id,user_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='approvals_version_binding_check') then
    alter table public.approvals add constraint approvals_version_binding_check check (
      status='rejected' or (script_id is not null and compliance_check_id is not null and media_revision is not null)
    );
  end if;
  if not exists(select 1 from pg_constraint where conname='posting_queue_snapshot_check') then
    alter table public.posting_queue add constraint posting_queue_snapshot_check check (
      status in ('failed','cancelled','published')
      or (script_id is not null and compliance_check_id is not null and approval_id is not null and media_revision is not null)
    );
  end if;
end $$;

create index if not exists review_projects_active_user_idx
  on public.review_projects(user_id, created_at desc) where archived_at is null;
create index if not exists ai_briefs_current_project_idx
  on public.ai_briefs(project_id, created_at desc) where superseded_at is null;
create index if not exists scripts_current_project_idx
  on public.scripts(project_id, created_at desc) where superseded_at is null;
create index if not exists compliance_current_project_idx
  on public.compliance_checks(project_id, created_at desc) where superseded_at is null;
create index if not exists compliance_current_phase_idx
  on public.compliance_checks(project_id, phase, created_at desc) where superseded_at is null;
create index if not exists workflow_action_requests_user_idx
  on public.workflow_action_requests(user_id, created_at desc);
create index if not exists approvals_compliance_check_id_idx
  on public.approvals(compliance_check_id);
create index if not exists approvals_script_id_idx
  on public.approvals(script_id);
create index if not exists compliance_checks_script_id_idx
  on public.compliance_checks(script_id);
create index if not exists posting_queue_approval_id_idx
  on public.posting_queue(approval_id);
create index if not exists posting_queue_compliance_check_id_idx
  on public.posting_queue(compliance_check_id);
create index if not exists posting_queue_script_id_idx
  on public.posting_queue(script_id);
create index if not exists workflow_action_requests_project_owner_idx
  on public.workflow_action_requests(project_id, user_id);

alter table public.workflow_action_requests enable row level security;
drop policy if exists "owner workflow_action_requests select" on public.workflow_action_requests;
create policy "owner workflow_action_requests select"
  on public.workflow_action_requests for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table
  public.products,
  public.review_projects,
  public.ai_briefs,
  public.scripts,
  public.compliance_checks,
  public.media_assets,
  public.approvals,
  public.posting_queue,
  public.analytics_events,
  public.ai_logs,
  public.workflow_action_requests
from anon, authenticated;

grant select on table
  public.products,
  public.review_projects,
  public.ai_briefs,
  public.scripts,
  public.compliance_checks,
  public.media_assets,
  public.approvals,
  public.posting_queue,
  public.analytics_events,
  public.ai_logs,
  public.workflow_action_requests
to authenticated;

grant all on table
  public.products,
  public.review_projects,
  public.ai_briefs,
  public.scripts,
  public.compliance_checks,
  public.media_assets,
  public.approvals,
  public.posting_queue,
  public.analytics_events,
  public.ai_logs,
  public.workflow_action_requests
to service_role;

create or replace function public.claim_workflow_action(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_action_type text
) returns text
language plpgsql security invoker set search_path = '' as $$
declare v_status text;
begin
  insert into public.workflow_action_requests(id, user_id, project_id, action_type)
  values (p_request_id, p_user_id, p_project_id, p_action_type)
  on conflict (id) do nothing;

  if found then return 'claimed'; end if;
  select status into v_status from public.workflow_action_requests
    where id = p_request_id and user_id = p_user_id and action_type = p_action_type;
  return coalesce(v_status, 'conflict');
end;
$$;

create or replace function public.record_review_project(
  p_request_id uuid,
  p_user_id uuid,
  p_product_id uuid,
  p_title text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.products where id=p_product_id and user_id=p_user_id) then
    raise exception 'Product ownership check failed';
  end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and action_type='create_project' and status='pending') then
    raise exception 'Workflow request is not pending';
  end if;
  insert into public.review_projects(user_id, product_id, title)
    values(p_user_id, p_product_id, p_title) returning id into v_id;
  update public.workflow_action_requests set status='succeeded', result_id=v_id, project_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.record_ai_brief(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then
    raise exception 'Project ownership check failed';
  end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='generate_brief' and status='pending') then
    raise exception 'Workflow request is not pending';
  end if;
  update public.ai_briefs set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  update public.scripts set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  insert into public.ai_briefs(
    user_id, project_id, product_summary, target_audience, pain_points, key_benefits,
    usp, content_angles, hook_ideas, risk_level, creator_note, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, p_payload->>'product_summary', p_payload->>'target_audience',
    p_payload->'pain_points', p_payload->'key_benefits', p_payload->>'usp',
    p_payload->'content_angles', p_payload->'hook_ideas', p_payload->>'risk_level',
    p_payload->>'creator_note', p_payload->>'prompt_version', p_payload->>'ai_provider', p_payload->>'ai_model'
  ) returning id into v_id;
  update public.review_projects set status='brief_generated', compliance_status=null,
    approval_status='pending', has_affiliate_disclosure=false, media_revision=media_revision+1
    where id=p_project_id and user_id=p_user_id;
  delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded', result_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.record_script(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then
    raise exception 'Project ownership check failed';
  end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='generate_script' and status='pending') then
    raise exception 'Workflow request is not pending';
  end if;
  update public.scripts set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  insert into public.scripts(
    user_id, project_id, duration_seconds, hook, problem, product_intro, benefits,
    use_case, cta, affiliate_disclosure, full_script, subtitle_lines,
    prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, (p_payload->>'duration_seconds')::int, p_payload->>'hook',
    p_payload->>'problem', p_payload->>'product_intro', p_payload->'benefits',
    p_payload->>'use_case', p_payload->>'cta', p_payload->>'affiliate_disclosure',
    p_payload->>'full_script', p_payload->'subtitle_lines', p_payload->>'prompt_version',
    p_payload->>'ai_provider', p_payload->>'ai_model'
  ) returning id into v_id;
  update public.review_projects set status='script_generated', compliance_status=null,
    approval_status='pending', has_affiliate_disclosure=coalesce(p_payload->>'affiliate_disclosure','') <> '',
    media_revision=media_revision+1
    where id=p_project_id and user_id=p_user_id;
  delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded', result_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.record_compliance_check(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_phase text,
  p_payload jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_status text;
  v_project_status text;
  v_action_type text;
  v_script_id uuid;
  v_media_revision integer;
begin
  if p_phase not in ('preliminary','final') then
    raise exception 'Invalid compliance phase';
  end if;
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then
    raise exception 'Project ownership check failed';
  end if;
  v_action_type := case p_phase when 'preliminary' then 'run_preliminary_compliance' else 'run_final_compliance' end;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type=v_action_type and status='pending') then
    raise exception 'Workflow request is not pending';
  end if;
  select s.id into v_script_id
    from public.scripts s
    where s.project_id=p_project_id and s.user_id=p_user_id and s.superseded_at is null
    order by s.created_at desc,s.id desc limit 1;
  if v_script_id is null then raise exception 'Current script is required'; end if;
  select media_revision into v_media_revision
    from public.review_projects where id=p_project_id and user_id=p_user_id;
  v_status := p_payload->>'status';
  if v_status not in ('PASS','WARNING','BLOCK') then raise exception 'Invalid compliance status'; end if;
  v_project_status := case v_status when 'PASS' then 'compliance_checked' when 'WARNING' then 'warning' else 'blocked' end;
  update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and phase=p_phase and superseded_at is null;
  insert into public.compliance_checks(
    user_id, project_id, script_id, media_revision, phase, status, risk_score, issues, prohibited_words,
    missing_requirements, suggested_fixes, safe_rewrite, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, v_script_id, v_media_revision, p_phase, v_status, (p_payload->>'risk_score')::int,
    p_payload->'issues', p_payload->'prohibited_words', p_payload->'missing_requirements',
    p_payload->'suggested_fixes', p_payload->>'safe_rewrite', p_payload->>'prompt_version',
    p_payload->>'ai_provider', p_payload->>'ai_model'
  ) returning id into v_id;
  if p_phase='final' then
    update public.review_projects set
      status=case when v_status='PASS' then 'pending_approval' else v_project_status end,
      compliance_status=v_status, approval_status='pending'
      where id=p_project_id and user_id=p_user_id;
  else
    update public.review_projects set
      status=case when v_status='PASS' then 'compliance_checked' else v_project_status end,
      compliance_status=null,
      approval_status='pending'
      where id=p_project_id and user_id=p_user_id;
  end if;
  delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded', result_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.record_media_asset(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_type text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_media_revision integer;
begin
  if p_type not in ('voiceover','avatar','subtitle','video_preview','rendered_video') then raise exception 'Invalid media type'; end if;
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then raise exception 'Project ownership check failed'; end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='create_media' and status='pending') then raise exception 'Workflow request is not pending'; end if;
  update public.review_projects set status='media_generated', compliance_status=null,
    approval_status='pending', media_revision=media_revision+1
    where id=p_project_id and user_id=p_user_id
    returning media_revision into v_media_revision;
  insert into public.media_assets(user_id,project_id,type,provider,metadata,media_revision)
    values(p_user_id,p_project_id,p_type,'mock','{"status":"placeholder"}'::jsonb,v_media_revision) returning id into v_id;
  update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and phase='final' and superseded_at is null;
  delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded', result_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.set_project_ai_label(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_enabled boolean
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_current boolean;
begin
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then raise exception 'Project ownership check failed'; end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='update_ai_label' and status='pending') then raise exception 'Workflow request is not pending'; end if;
  select has_ai_content_label into v_current from public.review_projects
    where id=p_project_id and user_id=p_user_id;
  if v_current is distinct from p_enabled then
    update public.review_projects set has_ai_content_label=p_enabled,
      status=case when p_enabled then 'media_generated' else 'warning' end,
      compliance_status=null, approval_status='pending'
      where id=p_project_id and user_id=p_user_id;
    update public.compliance_checks set superseded_at=now()
      where project_id=p_project_id and user_id=p_user_id and phase='final' and superseded_at is null;
    delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  end if;
  update public.workflow_action_requests set status='succeeded', updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return p_enabled;
end;
$$;

create or replace function public.record_project_approval(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_status text,
  p_notes text default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_project public.review_projects%rowtype;
  v_script_id uuid;
  v_check_id uuid;
  v_check_status text;
begin
  if p_status not in ('approved','rejected') then raise exception 'Invalid approval status'; end if;
  select * into v_project from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null;
  if not found then raise exception 'Project ownership check failed'; end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type=case when p_status='approved' then 'approve_project' else 'reject_project' end and status='pending') then raise exception 'Workflow request is not pending'; end if;
  select id into v_script_id from public.scripts
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null
    order by created_at desc,id desc limit 1;
  select id,status into v_check_id,v_check_status from public.compliance_checks
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null
      and phase='final' and script_id=v_script_id and media_revision=v_project.media_revision
    order by created_at desc,id desc limit 1;
  if p_status='approved' then
    if v_script_id is null or v_check_id is null or v_check_status is distinct from 'PASS'
      or v_project.compliance_status is distinct from 'PASS' then
      raise exception 'Current final compliance must pass';
    end if;
  end if;
  insert into public.approvals(
    user_id,project_id,script_id,compliance_check_id,media_revision,status,notes
  ) values (
    p_user_id,p_project_id,v_script_id,v_check_id,v_project.media_revision,p_status,nullif(trim(p_notes),'')
  ) returning id into v_id;
  update public.review_projects set approval_status=p_status,status=p_status where id=p_project_id and user_id=p_user_id;
  if p_status='rejected' then delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled'); end if;
  update public.workflow_action_requests set status='succeeded',result_id=v_id,updated_at=now() where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

create or replace function public.archive_review_project(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid
) returns uuid
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(
    select 1 from public.review_projects
    where id=p_project_id and user_id=p_user_id and archived_at is null
  ) then raise exception 'Project ownership check failed'; end if;
  if not exists(
    select 1 from public.workflow_action_requests
    where id=p_request_id and user_id=p_user_id and project_id=p_project_id
      and action_type='archive_project' and status='pending'
  ) then raise exception 'Workflow request is not pending'; end if;
  update public.review_projects set archived_at=now(), approval_status='pending'
    where id=p_project_id and user_id=p_user_id;
  update public.compliance_checks set superseded_at=coalesce(superseded_at,now())
    where project_id=p_project_id and user_id=p_user_id;
  delete from public.posting_queue
    where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded',result_id=p_project_id,updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return p_project_id;
end;
$$;

drop trigger if exists enforce_posting_safety_gate on public.posting_queue;
drop function if exists public.enforce_posting_safety_gate();
create function public.enforce_posting_safety_gate() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_project public.review_projects%rowtype;
  v_script public.scripts%rowtype;
  v_check public.compliance_checks%rowtype;
  v_approval public.approvals%rowtype;
begin
  if new.status not in ('ready','scheduled') then return new; end if;
  select * into v_project from public.review_projects
    where id=new.project_id and user_id=new.user_id and archived_at is null;
  select * into v_script from public.scripts
    where id=new.script_id and project_id=new.project_id and user_id=new.user_id and superseded_at is null;
  select * into v_check from public.compliance_checks
    where id=new.compliance_check_id and project_id=new.project_id and user_id=new.user_id
      and superseded_at is null and phase='final';
  select * into v_approval from public.approvals
    where id=new.approval_id and project_id=new.project_id and user_id=new.user_id;
  if v_project.id is null or v_script.id is null or v_check.id is null or v_approval.id is null
    or v_check.status is distinct from 'PASS'
    or v_check.script_id is distinct from v_script.id
    or v_check.media_revision is distinct from v_project.media_revision
    or v_approval.status is distinct from 'approved'
    or v_approval.script_id is distinct from v_script.id
    or v_approval.compliance_check_id is distinct from v_check.id
    or v_approval.media_revision is distinct from v_project.media_revision
    or new.media_revision is distinct from v_project.media_revision
    or v_project.compliance_status is distinct from 'PASS'
    or v_project.approval_status is distinct from 'approved'
    or not v_project.has_affiliate_disclosure
    or not v_project.has_ai_content_label
    or exists(
      select 1 from public.workflow_action_requests request
      where request.project_id=new.project_id and request.user_id=new.user_id
        and request.status='pending' and request.action_type <> 'queue_project'
    ) then
    raise exception 'Project has not passed the version-bound Publishing Safety Gate';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_posting_safety_gate() from public, anon, authenticated;
create trigger enforce_posting_safety_gate
before insert or update on public.posting_queue
for each row execute function public.enforce_posting_safety_gate();

drop function if exists public.queue_project(uuid);
create or replace function public.queue_project(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_project public.review_projects%rowtype;
  v_script public.scripts%rowtype;
  v_compliance public.compliance_checks%rowtype;
  v_approval public.approvals%rowtype;
  v_queue_id uuid;
begin
  select * into v_project from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='queue_project' and status='pending') then raise exception 'Workflow request is not pending'; end if;
  select * into v_script from public.scripts
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null
    order by created_at desc,id desc limit 1;
  select * into v_compliance from public.compliance_checks
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null
      and phase='final' and script_id=v_script.id and media_revision=v_project.media_revision
    order by created_at desc,id desc limit 1;
  select * into v_approval from public.approvals
    where project_id=p_project_id and user_id=p_user_id
    order by created_at desc,id desc limit 1;
  if v_script.id is null or v_compliance.id is null or v_approval.id is null
    or v_compliance.status is distinct from 'PASS'
    or v_approval.status is distinct from 'approved'
    or v_approval.script_id is distinct from v_script.id
    or v_approval.compliance_check_id is distinct from v_compliance.id
    or v_approval.media_revision is distinct from v_project.media_revision
    or v_project.compliance_status is distinct from 'PASS'
    or v_project.approval_status is distinct from 'approved'
    or not v_project.has_affiliate_disclosure or not v_project.has_ai_content_label
    or exists(
      select 1 from public.workflow_action_requests request
      where request.project_id=p_project_id and request.user_id=p_user_id
        and request.status='pending' and request.id <> p_request_id
    ) then
    raise exception 'Project has not passed the version-bound Publishing Safety Gate';
  end if;
  insert into public.posting_queue(
    user_id,project_id,script_id,compliance_check_id,approval_id,media_revision,status
  ) values (
    p_user_id,p_project_id,v_script.id,v_compliance.id,v_approval.id,v_project.media_revision,'ready'
  ) on conflict(user_id,project_id) do update set
    script_id=excluded.script_id,
    compliance_check_id=excluded.compliance_check_id,
    approval_id=excluded.approval_id,
    media_revision=excluded.media_revision,
    status='ready',updated_at=now()
  returning id into v_queue_id;
  update public.review_projects set status='ready_to_publish' where id=p_project_id and user_id=p_user_id;
  update public.workflow_action_requests set status='succeeded',result_id=v_queue_id,updated_at=now() where id=p_request_id and user_id=p_user_id;
  return v_queue_id;
end;
$$;

alter table public.ai_logs add column if not exists request_id uuid;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='ai_logs_request_fkey') then
    alter table public.ai_logs add constraint ai_logs_request_fkey
      foreign key(request_id) references public.workflow_action_requests(id) on delete set null;
  end if;
end $$;
create unique index if not exists ai_logs_request_id_uidx
  on public.ai_logs(request_id) where request_id is not null;

create or replace function public.purge_expired_ai_logs(
  p_retention_days integer default 90
) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare v_deleted bigint;
begin
  if p_retention_days < 1 or p_retention_days > 365 then
    raise exception 'AI log retention must be between 1 and 365 days';
  end if;
  delete from public.ai_logs
    where created_at < now() - make_interval(days => p_retention_days);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'claim_workflow_action','record_review_project','record_ai_brief','record_script',
      'record_compliance_check','record_media_asset','set_project_ai_label',
      'record_project_approval','archive_review_project','purge_expired_ai_logs','queue_project'
    )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end $$;

-- Final record_script definition from 20260703120000_product_workflow_ux.sql.
create or replace function public.record_script(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.review_projects where id=p_project_id and user_id=p_user_id and archived_at is null) then
    raise exception 'Project ownership check failed';
  end if;
  if not exists(select 1 from public.workflow_action_requests where id=p_request_id and user_id=p_user_id and project_id=p_project_id and action_type='generate_script' and status='pending') then
    raise exception 'Workflow request is not pending';
  end if;
  update public.scripts set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id and superseded_at is null;
  insert into public.scripts(
    user_id, project_id, duration_seconds, hook, hook_candidates, selected_hook,
    problem, product_intro, benefits, use_case, cta, affiliate_disclosure,
    full_script, subtitle_lines, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, (p_payload->>'duration_seconds')::int, p_payload->>'hook',
    coalesce(p_payload->'hook_candidates','[]'::jsonb),
    coalesce(p_payload->>'selected_hook',p_payload->>'hook'),
    p_payload->>'problem', p_payload->>'product_intro', p_payload->'benefits',
    p_payload->>'use_case', p_payload->>'cta', p_payload->>'affiliate_disclosure',
    p_payload->>'full_script', p_payload->'subtitle_lines', p_payload->>'prompt_version',
    p_payload->>'ai_provider', p_payload->>'ai_model'
  ) returning id into v_id;
  update public.review_projects set status='script_generated', compliance_status=null,
    approval_status='pending', has_affiliate_disclosure=coalesce(p_payload->>'affiliate_disclosure','') <> '',
    media_revision=media_revision+1
    where id=p_project_id and user_id=p_user_id;
  delete from public.posting_queue where project_id=p_project_id and user_id=p_user_id and status in ('ready','scheduled');
  update public.workflow_action_requests set status='succeeded', result_id=v_id, updated_at=now()
    where id=p_request_id and user_id=p_user_id;
  return v_id;
end;
$$;

revoke all on function public.record_script(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_script(uuid,uuid,uuid,jsonb) to service_role;
