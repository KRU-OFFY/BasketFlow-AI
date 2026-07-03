create or replace function public.set_project_ai_label(
  p_request_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_enabled boolean
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_current boolean;
begin
  if not exists(
    select 1 from public.review_projects
    where id=p_project_id and user_id=p_user_id and archived_at is null
  ) then raise exception 'Project ownership check failed'; end if;
  if not exists(
    select 1 from public.workflow_action_requests
    where id=p_request_id and user_id=p_user_id and project_id=p_project_id
      and action_type='update_ai_label' and status='pending'
  ) then raise exception 'Workflow request is not pending'; end if;

  select has_ai_content_label into v_current
  from public.review_projects
  where id=p_project_id and user_id=p_user_id;

  if v_current is distinct from p_enabled then
    update public.review_projects set
      has_ai_content_label=p_enabled,
      status=case when p_enabled then 'media_generated' else 'warning' end,
      compliance_status=null,
      approval_status='pending'
    where id=p_project_id and user_id=p_user_id;

    update public.compliance_checks set superseded_at=now()
    where project_id=p_project_id and user_id=p_user_id
      and phase='final' and superseded_at is null;

    delete from public.posting_queue
    where project_id=p_project_id and user_id=p_user_id
      and status in ('ready','scheduled');
  end if;

  update public.workflow_action_requests
  set status='succeeded', updated_at=now()
  where id=p_request_id and user_id=p_user_id;
  return p_enabled;
end;
$$;

revoke all on function public.set_project_ai_label(uuid,uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.set_project_ai_label(uuid,uuid,uuid,boolean) to service_role;
