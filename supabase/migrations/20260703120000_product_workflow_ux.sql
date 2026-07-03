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
