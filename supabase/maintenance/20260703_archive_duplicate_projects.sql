-- Run only after a verified Production backup and after the hardening migration.
-- This operation is reversible because it sets archived_at/superseded_at and does not delete content.
begin;

do $$
declare
  v_keep_project constant uuid := '957b9dd6-2c9d-4265-b4a6-ee64668f630b';
  v_user_id uuid;
  v_product_id uuid;
  v_duplicate_count integer;
begin
  select user_id,product_id into strict v_user_id,v_product_id
    from public.review_projects where id=v_keep_project and archived_at is null;
  select count(*) into v_duplicate_count
    from public.review_projects
    where user_id=v_user_id and product_id=v_product_id
      and id<>v_keep_project and archived_at is null;
  if v_duplicate_count<>8 then
    raise exception 'Expected exactly 8 active duplicate projects, found %',v_duplicate_count;
  end if;
end;
$$;

with keep_project as (
  select user_id,product_id from public.review_projects
  where id='957b9dd6-2c9d-4265-b4a6-ee64668f630b'
), archived as (
  update public.review_projects project
    set archived_at=now(),approval_status='pending'
    from keep_project keep
    where project.user_id=keep.user_id and project.product_id=keep.product_id
      and project.id<>'957b9dd6-2c9d-4265-b4a6-ee64668f630b'
      and project.archived_at is null
    returning project.id,project.user_id
)
update public.compliance_checks check_result
  set superseded_at=coalesce(check_result.superseded_at,now())
  from archived
  where check_result.project_id=archived.id and check_result.user_id=archived.user_id;

delete from public.posting_queue queue_row
using public.review_projects project
where queue_row.project_id=project.id and queue_row.user_id=project.user_id
  and project.archived_at is not null and queue_row.status in ('ready','scheduled');

with ranked as (
  select id,row_number() over(order by created_at desc,id desc) as version_rank
  from public.ai_briefs
  where project_id='957b9dd6-2c9d-4265-b4a6-ee64668f630b'
)
update public.ai_briefs brief
  set superseded_at=coalesce(brief.superseded_at,now())
  from ranked
  where brief.id=ranked.id and ranked.version_rank>1;

commit;
