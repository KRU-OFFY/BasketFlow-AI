create extension if not exists "pgcrypto";

alter table public.review_projects add column if not exists archived_at timestamptz;
alter table public.review_projects add column if not exists current_brief_id uuid;
alter table public.review_projects add column if not exists current_script_id uuid;
alter table public.review_projects add column if not exists current_compliance_check_id uuid;
alter table public.review_projects add column if not exists media_revision int not null default 0;

alter table public.ai_briefs add column if not exists request_id uuid;
alter table public.ai_briefs add column if not exists superseded_at timestamptz;
alter table public.scripts add column if not exists request_id uuid;
alter table public.scripts add column if not exists superseded_at timestamptz;
alter table public.compliance_checks add column if not exists request_id uuid;
alter table public.compliance_checks add column if not exists superseded_at timestamptz;
alter table public.media_assets add column if not exists media_revision int not null default 0;
alter table public.approvals add column if not exists script_id uuid references public.scripts(id) on delete set null;
alter table public.approvals add column if not exists compliance_check_id uuid references public.compliance_checks(id) on delete set null;
alter table public.approvals add column if not exists media_revision int;
alter table public.posting_queue add column if not exists script_id uuid references public.scripts(id) on delete set null;
alter table public.posting_queue add column if not exists compliance_check_id uuid references public.compliance_checks(id) on delete set null;
alter table public.posting_queue add column if not exists approval_id uuid references public.approvals(id) on delete set null;
alter table public.posting_queue add column if not exists media_revision int;

create table if not exists public.workflow_action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.review_projects(id) on delete cascade,
  action_type text not null,
  request_id uuid not null,
  status text not null default 'pending',
  result_entity_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, project_id, action_type, request_id)
);

create index if not exists workflow_action_requests_project_idx on public.workflow_action_requests(project_id, created_at desc);
create index if not exists review_projects_current_script_idx on public.review_projects(current_script_id);
create index if not exists review_projects_current_compliance_idx on public.review_projects(current_compliance_check_id);
create index if not exists ai_briefs_current_idx on public.ai_briefs(project_id, superseded_at, created_at desc);
create index if not exists scripts_current_idx on public.scripts(project_id, superseded_at, created_at desc);
create index if not exists compliance_current_idx on public.compliance_checks(project_id, superseded_at, created_at desc);
create unique index if not exists ai_briefs_request_uidx on public.ai_briefs(user_id, project_id, request_id) where request_id is not null;
create unique index if not exists scripts_request_uidx on public.scripts(user_id, project_id, request_id) where request_id is not null;
create unique index if not exists compliance_request_uidx on public.compliance_checks(user_id, project_id, request_id) where request_id is not null;

update public.review_projects p set
  current_brief_id = coalesce(current_brief_id, (select b.id from public.ai_briefs b where b.project_id = p.id and b.user_id = p.user_id order by b.created_at desc limit 1)),
  current_script_id = coalesce(current_script_id, (select s.id from public.scripts s where s.project_id = p.id and s.user_id = p.user_id order by s.created_at desc limit 1)),
  current_compliance_check_id = coalesce(current_compliance_check_id, (select c.id from public.compliance_checks c where c.project_id = p.id and c.user_id = p.user_id order by c.created_at desc limit 1))
where current_brief_id is null or current_script_id is null or current_compliance_check_id is null;

update public.ai_briefs b set superseded_at = coalesce(b.superseded_at, now())
where exists (select 1 from public.review_projects p where p.id = b.project_id and p.user_id = b.user_id and p.current_brief_id is not null and p.current_brief_id <> b.id)
  and b.superseded_at is null;
update public.scripts s set superseded_at = coalesce(s.superseded_at, now())
where exists (select 1 from public.review_projects p where p.id = s.project_id and p.user_id = s.user_id and p.current_script_id is not null and p.current_script_id <> s.id)
  and s.superseded_at is null;
update public.compliance_checks c set superseded_at = coalesce(c.superseded_at, now())
where exists (select 1 from public.review_projects p where p.id = c.project_id and p.user_id = c.user_id and p.current_compliance_check_id is not null and p.current_compliance_check_id <> c.id)
  and c.superseded_at is null;

alter table public.workflow_action_requests enable row level security;
drop policy if exists "owner workflow_action_requests" on public.workflow_action_requests;
create policy "owner workflow_action_requests" on public.workflow_action_requests
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.mark_workflow_request(
  p_user_id uuid,
  p_project_id uuid,
  p_action_type text,
  p_request_id uuid,
  p_status text,
  p_result_entity_id uuid default null,
  p_error_message text default null
) returns void
language plpgsql security definer set search_path='' as $$
begin
  insert into public.workflow_action_requests(user_id, project_id, action_type, request_id, status, result_entity_id, error_message, completed_at)
  values (p_user_id, p_project_id, p_action_type, p_request_id, p_status, p_result_entity_id, p_error_message, case when p_status in ('completed','failed') then now() else null end)
  on conflict (user_id, project_id, action_type, request_id) do update set
    status = excluded.status,
    result_entity_id = coalesce(excluded.result_entity_id, public.workflow_action_requests.result_entity_id),
    error_message = excluded.error_message,
    completed_at = excluded.completed_at,
    updated_at = now();
end;
$$;

create or replace function public.create_review_project_rpc(
  p_user_id uuid,
  p_product_id uuid,
  p_title text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_product public.products%rowtype;
  v_project_id uuid;
begin
  select * into v_product from public.products where id = p_product_id and user_id = p_user_id;
  if not found then raise exception 'Unauthorized or product not found'; end if;

  insert into public.review_projects(user_id, product_id, title, status, has_affiliate_disclosure, has_ai_content_label, approval_status)
  values (p_user_id, p_product_id, coalesce(nullif(trim(p_title), ''), 'รีวิว ' || v_product.title), 'product_imported', false, false, 'pending')
  returning id into v_project_id;
  return v_project_id;
end;
$$;

create or replace function public.complete_generate_brief(
  p_user_id uuid,
  p_project_id uuid,
  p_request_id uuid,
  p_output jsonb,
  p_prompt_version text,
  p_ai_provider text,
  p_ai_model text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_brief_id uuid;
begin
  select result_entity_id into v_brief_id from public.workflow_action_requests
  where user_id = p_user_id and project_id = p_project_id and action_type = 'generate_brief' and request_id = p_request_id and status = 'completed';
  if v_brief_id is not null then return v_brief_id; end if;

  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'generate_brief', p_request_id, 'pending');
  update public.ai_briefs set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  update public.scripts set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  update public.compliance_checks set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');

  insert into public.ai_briefs(
    user_id, project_id, request_id, product_summary, target_audience, pain_points, key_benefits, usp,
    content_angles, hook_ideas, risk_level, creator_note, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, p_request_id, p_output->>'product_summary', p_output->>'target_audience',
    p_output->'pain_points', p_output->'key_benefits', p_output->>'usp', p_output->'content_angles',
    p_output->'hook_ideas', p_output->>'risk_level', p_output->>'creator_note', p_prompt_version, p_ai_provider, p_ai_model
  ) returning id into v_brief_id;

  update public.review_projects set
    status = 'brief_generated',
    current_brief_id = v_brief_id,
    current_script_id = null,
    current_compliance_check_id = null,
    compliance_status = null,
    approval_status = 'pending',
    has_affiliate_disclosure = false,
    updated_at = now()
  where id = p_project_id and user_id = p_user_id;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'generate_brief', p_request_id, 'completed', v_brief_id);
  return v_brief_id;
end;
$$;

create or replace function public.complete_generate_script(
  p_user_id uuid,
  p_project_id uuid,
  p_request_id uuid,
  p_duration_seconds int,
  p_output jsonb,
  p_prompt_version text,
  p_ai_provider text,
  p_ai_model text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_script_id uuid;
begin
  select result_entity_id into v_script_id from public.workflow_action_requests
  where user_id = p_user_id and project_id = p_project_id and action_type = 'generate_script' and request_id = p_request_id and status = 'completed';
  if v_script_id is not null then return v_script_id; end if;

  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  if v_project.current_brief_id is null then raise exception 'Brief is required before script generation'; end if;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'generate_script', p_request_id, 'pending');
  update public.scripts set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  update public.compliance_checks set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');

  insert into public.scripts(
    user_id, project_id, request_id, duration_seconds, hook, problem, product_intro, benefits, use_case,
    cta, affiliate_disclosure, full_script, subtitle_lines, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, p_request_id, p_duration_seconds, p_output->>'hook', p_output->>'problem',
    p_output->>'product_intro', p_output->'benefits', p_output->>'use_case', p_output->>'cta',
    p_output->>'affiliate_disclosure', p_output->>'full_script', p_output->'subtitle_lines',
    p_prompt_version, p_ai_provider, p_ai_model
  ) returning id into v_script_id;

  update public.review_projects set
    status = 'script_generated',
    current_script_id = v_script_id,
    current_compliance_check_id = null,
    compliance_status = null,
    approval_status = 'pending',
    has_affiliate_disclosure = coalesce(nullif(p_output->>'affiliate_disclosure','') is not null, false),
    updated_at = now()
  where id = p_project_id and user_id = p_user_id;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'generate_script', p_request_id, 'completed', v_script_id);
  return v_script_id;
end;
$$;

create or replace function public.complete_compliance_check(
  p_user_id uuid,
  p_project_id uuid,
  p_request_id uuid,
  p_output jsonb,
  p_prompt_version text,
  p_ai_provider text,
  p_ai_model text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_check_id uuid;
  v_status text;
  v_project_status text;
begin
  select result_entity_id into v_check_id from public.workflow_action_requests
  where user_id = p_user_id and project_id = p_project_id and action_type = 'compliance_check' and request_id = p_request_id and status = 'completed';
  if v_check_id is not null then return v_check_id; end if;

  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  if v_project.current_script_id is null then raise exception 'Script is required before compliance check'; end if;

  v_status := p_output->>'status';
  if v_status not in ('PASS','WARNING','BLOCK') then raise exception 'Invalid compliance status'; end if;
  v_project_status := case v_status when 'PASS' then 'compliance_checked' when 'WARNING' then 'warning' else 'blocked' end;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'compliance_check', p_request_id, 'pending');
  update public.compliance_checks set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');

  insert into public.compliance_checks(
    user_id, project_id, request_id, status, risk_score, issues, prohibited_words, missing_requirements,
    suggested_fixes, safe_rewrite, prompt_version, ai_provider, ai_model
  ) values (
    p_user_id, p_project_id, p_request_id, v_status, coalesce((p_output->>'risk_score')::int, 0),
    p_output->'issues', p_output->'prohibited_words', p_output->'missing_requirements',
    p_output->'suggested_fixes', p_output->>'safe_rewrite', p_prompt_version, p_ai_provider, p_ai_model
  ) returning id into v_check_id;

  update public.review_projects set
    status = v_project_status,
    current_compliance_check_id = v_check_id,
    compliance_status = v_status,
    approval_status = 'pending',
    updated_at = now()
  where id = p_project_id and user_id = p_user_id;

  perform public.mark_workflow_request(p_user_id, p_project_id, 'compliance_check', p_request_id, 'completed', v_check_id);
  return v_check_id;
end;
$$;

create or replace function public.create_media_asset_rpc(
  p_user_id uuid,
  p_project_id uuid,
  p_type text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_asset_id uuid;
  v_revision int;
begin
  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  if p_type not in ('voiceover','avatar','subtitle','video_preview','rendered_video') then raise exception 'Invalid media type'; end if;
  v_revision := v_project.media_revision + 1;

  update public.compliance_checks set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');

  insert into public.media_assets(user_id, project_id, type, provider, metadata, media_revision)
  values (p_user_id, p_project_id, p_type, 'mock', p_metadata, v_revision)
  returning id into v_asset_id;

  update public.review_projects set
    status = 'media_generated',
    media_revision = v_revision,
    current_compliance_check_id = null,
    compliance_status = null,
    approval_status = 'pending',
    updated_at = now()
  where id = p_project_id and user_id = p_user_id;

  return v_asset_id;
end;
$$;

create or replace function public.set_ai_content_label_rpc(
  p_user_id uuid,
  p_project_id uuid,
  p_enabled boolean
) returns void
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
begin
  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;

  update public.compliance_checks set superseded_at = now() where project_id = p_project_id and user_id = p_user_id and superseded_at is null;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');

  update public.review_projects set
    has_ai_content_label = p_enabled,
    current_compliance_check_id = null,
    compliance_status = null,
    approval_status = 'pending',
    status = case when p_enabled then status else 'warning' end,
    updated_at = now()
  where id = p_project_id and user_id = p_user_id;
end;
$$;

create or replace function public.approve_project_rpc(
  p_user_id uuid,
  p_project_id uuid
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_approval_id uuid;
begin
  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  if v_project.current_script_id is null or v_project.current_compliance_check_id is null or v_project.compliance_status is distinct from 'PASS' then
    raise exception 'Project must have current PASS compliance before approval';
  end if;

  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');
  insert into public.approvals(user_id, project_id, status, script_id, compliance_check_id, media_revision)
  values (p_user_id, p_project_id, 'approved', v_project.current_script_id, v_project.current_compliance_check_id, v_project.media_revision)
  returning id into v_approval_id;

  update public.review_projects set approval_status = 'approved', status = 'approved', updated_at = now()
  where id = p_project_id and user_id = p_user_id;
  return v_approval_id;
end;
$$;

create or replace function public.reject_project_rpc(
  p_user_id uuid,
  p_project_id uuid,
  p_reason text default null
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_approval_id uuid;
begin
  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  delete from public.posting_queue where project_id = p_project_id and user_id = p_user_id and status in ('ready','scheduled');
  insert into public.approvals(user_id, project_id, status, notes, script_id, compliance_check_id, media_revision)
  values (p_user_id, p_project_id, 'rejected', nullif(trim(coalesce(p_reason,'')), ''), v_project.current_script_id, v_project.current_compliance_check_id, v_project.media_revision)
  returning id into v_approval_id;
  update public.review_projects set approval_status = 'rejected', status = 'rejected', updated_at = now()
  where id = p_project_id and user_id = p_user_id;
  return v_approval_id;
end;
$$;

create or replace function public.queue_project_rpc(
  p_user_id uuid,
  p_project_id uuid
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_project public.review_projects%rowtype;
  v_approval public.approvals%rowtype;
  v_queue_id uuid;
begin
  select * into v_project from public.review_projects where id = p_project_id and user_id = p_user_id and archived_at is null for update;
  if not found then raise exception 'Unauthorized or project not found'; end if;
  select * into v_approval from public.approvals
    where project_id = p_project_id and user_id = p_user_id
    order by created_at desc limit 1;

  if v_project.compliance_status is distinct from 'PASS'
    or v_project.approval_status is distinct from 'approved'
    or not v_project.has_affiliate_disclosure
    or not v_project.has_ai_content_label
    or v_project.current_script_id is null
    or v_project.current_compliance_check_id is null
    or v_approval.status is distinct from 'approved'
    or v_approval.script_id is distinct from v_project.current_script_id
    or v_approval.compliance_check_id is distinct from v_project.current_compliance_check_id
    or v_approval.media_revision is distinct from v_project.media_revision
    or exists(select 1 from public.workflow_action_requests r where r.project_id = p_project_id and r.user_id = p_user_id and r.status = 'pending') then
    raise exception 'Project has not passed the Publishing Safety Gate';
  end if;

  insert into public.posting_queue(user_id, project_id, status, script_id, compliance_check_id, approval_id, media_revision)
  values (p_user_id, p_project_id, 'ready', v_project.current_script_id, v_project.current_compliance_check_id, v_approval.id, v_project.media_revision)
  on conflict (user_id, project_id) do update set
    status='ready',
    script_id=excluded.script_id,
    compliance_check_id=excluded.compliance_check_id,
    approval_id=excluded.approval_id,
    media_revision=excluded.media_revision,
    updated_at=now()
  returning id into v_queue_id;

  update public.review_projects set status='ready_to_publish', updated_at=now() where id=p_project_id and user_id=p_user_id;
  return v_queue_id;
end;
$$;

revoke all on function public.mark_workflow_request(uuid,uuid,text,uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.create_review_project_rpc(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.complete_generate_brief(uuid,uuid,uuid,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.complete_generate_script(uuid,uuid,uuid,int,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.complete_compliance_check(uuid,uuid,uuid,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.create_media_asset_rpc(uuid,uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.set_ai_content_label_rpc(uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.approve_project_rpc(uuid,uuid) from public, anon, authenticated;
revoke all on function public.reject_project_rpc(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.queue_project_rpc(uuid,uuid) from public, anon, authenticated;
revoke all on function public.queue_project(uuid) from public, anon, authenticated;

grant execute on function public.mark_workflow_request(uuid,uuid,text,uuid,text,uuid,text) to service_role;
grant execute on function public.create_review_project_rpc(uuid,uuid,text) to service_role;
grant execute on function public.complete_generate_brief(uuid,uuid,uuid,jsonb,text,text,text) to service_role;
grant execute on function public.complete_generate_script(uuid,uuid,uuid,int,jsonb,text,text,text) to service_role;
grant execute on function public.complete_compliance_check(uuid,uuid,uuid,jsonb,text,text,text) to service_role;
grant execute on function public.create_media_asset_rpc(uuid,uuid,text,jsonb) to service_role;
grant execute on function public.set_ai_content_label_rpc(uuid,uuid,boolean) to service_role;
grant execute on function public.approve_project_rpc(uuid,uuid) to service_role;
grant execute on function public.reject_project_rpc(uuid,uuid,text) to service_role;
grant execute on function public.queue_project_rpc(uuid,uuid) to service_role;

revoke insert, update, delete on table public.review_projects, public.ai_briefs, public.scripts, public.compliance_checks, public.media_assets, public.approvals, public.posting_queue, public.workflow_action_requests from authenticated;
grant select on table public.review_projects, public.ai_briefs, public.scripts, public.compliance_checks, public.media_assets, public.approvals, public.posting_queue, public.workflow_action_requests to authenticated;
grant select, insert, update, delete on table public.products, public.analytics_events, public.ai_logs to authenticated;
